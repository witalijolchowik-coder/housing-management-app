import { View, Text, Pressable, Modal, ScrollView, FlatList, useWindowDimensions } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project } from '@/types';
import { loadData, loadEvictionArchive } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

interface CalendarEvent {
  id: string;
  date: string;
  type: 'check_in' | 'check_out' | 'wypowiedzenie_end';
  projectName: string;
  addressName: string;
  tenantName: string;
  roomName?: string;
}

export default function CalendarScreen() {
  const t = useTranslations();
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  // Calculate cell width: (screen width - padding - gaps) / 7
  const cellWidth = (screenWidth - 32 - 24) / 7; // 32px padding, 24px gaps (6 * 4px)
  const [projects, setProjects] = useState<Project[]>([]);
  const [evictionArchive, setEvictionArchive] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [dayDetailsVisible, setDayDetailsVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [])
  );

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const data = await loadData();
      const archive = await loadEvictionArchive();
      setProjects(data);
      setEvictionArchive(archive);
      if (data.length > 0) {
        setSelectedProjects([data[0].id]);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Collect all events
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    
    for (const project of projects) {
      for (const address of project.addresses) {
        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.tenant) {
              // Check-in event
              events.push({
                id: `checkin-${space.id}`,
                date: space.tenant.checkInDate,
                type: 'check_in',
                projectName: project.name,
                addressName: address.name,
                tenantName: `${space.tenant.firstName} ${space.tenant.lastName}`,
                roomName: room.name,
              });

              // Wypowiedzenie end event
              if (space.status === 'wypowiedzenie' && space.wypowiedzenie) {
                events.push({
                  id: `wyp-${space.id}`,
                  date: space.wypowiedzenie.endDate,
                  type: 'wypowiedzenie_end',
                  projectName: project.name,
                  addressName: address.name,
                  tenantName: `${space.tenant.firstName} ${space.tenant.lastName}`,
                  roomName: room.name,
                });
              }
            }
          }
        }
      }
    }
    
    // Add check-out events from eviction archive
    for (const archiveEntry of evictionArchive) {
      events.push({
        id: `checkout-${archiveEntry.id}`,
        date: archiveEntry.checkOutDate,
        type: 'check_out',
        projectName: archiveEntry.projectName,
        addressName: archiveEntry.addressName,
        tenantName: `${archiveEntry.firstName} ${archiveEntry.lastName}`,
        roomName: archiveEntry.roomName || undefined,
      });
    }
    
    return events;
  }, [projects, evictionArchive]);

  // Filter events by selected projects
  const filteredEvents = useMemo(() => {
    if (selectedProjects.length === 0) return allEvents;
    return allEvents.filter((event) => {
      const project = projects.find((p) => p.name === event.projectName);
      return project && selectedProjects.includes(project.id);
    });
  }, [allEvents, selectedProjects, projects, evictionArchive]);

  // Get events for current month
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getEventsForDate = (dateStr: string) => {
    return filteredEvents.filter((event) => event.date === dateStr);
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'check_in':
        return colors.success;
      case 'check_out':
        return colors.error;
      case 'wypowiedzenie_end':
        return colors.warning;
      default:
        return colors.muted;
    }
  };

  const renderCalendarDay = (day: number): React.ReactNode => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = getEventsForDate(dateStr);
    const hasEvents = events.length > 0;

    return (
      <Pressable
        key={day.toString()}
        onPress={() => {
          if (hasEvents) {
            setSelectedDate(dateStr);
            setDayDetailsVisible(true);
          }
        }}
        className={`rounded-lg items-center justify-center border ${
          hasEvents ? 'border-primary bg-surface' : 'border-border'
        }`}
        style={{ width: cellWidth, height: cellWidth, minHeight: 60 }}
      >
        <Text className="text-sm font-semibold text-foreground">{day}</Text>
        {hasEvents && (
          <View className="flex-row gap-1 mt-1">
            {events.slice(0, 3).map((event) => (
              <View
                key={event.id}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: getEventColor(event.type) }}
              />
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days: React.ReactNode[] = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={{ width: cellWidth, height: cellWidth, minHeight: 60 }} />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(renderCalendarDay(day));
    }

    return (
      <View className="gap-2">
        {/* Month/Year Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Pressable
            onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2"
          >
            <MaterialIcons name="chevron-left" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-lg font-bold text-foreground capitalize">
            {currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable
            onPress={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2"
          >
            <MaterialIcons name="chevron-right" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Day names */}
        <View className="flex-row gap-1 mb-2">
          {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => (
            <View key={day} className="items-center" style={{ width: cellWidth }}>
              <Text className="text-xs font-semibold text-muted">{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View className="gap-1">
          {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
            <View key={weekIndex.toString()} className="flex-row gap-1">
              {days.slice(weekIndex * 7, (weekIndex + 1) * 7)}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const dayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <Text className="text-2xl font-bold text-foreground mb-6">Kalendarz</Text>

        {/* Calendar */}
        {loading ? (
          <Text className="text-muted text-center py-8">Ładowanie...</Text>
        ) : (
          <Card className="p-4 mb-6">
            {renderCalendar()}
          </Card>
        )}

        {/* Legend */}
        <View className="gap-3 mb-6 bg-surface rounded-lg p-4">
          <Text className="text-sm font-semibold text-foreground">Legenda</Text>
          <View className="gap-2">
            <View className="flex-row items-center gap-3">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.success }} />
              <Text className="text-sm text-foreground">Zamelowanie</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.error }} />
              <Text className="text-sm text-foreground">Wymeldowanie</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.warning }} />
              <Text className="text-sm text-foreground">Koniec wypowiedzenia</Text>
            </View>
          </View>
        </View>

        {/* Project Filter - Moved to bottom */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">Filtry projektów</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
          >
            <Pressable
              onPress={() => {
                if (selectedProjects.length === projects.length) {
                  setSelectedProjects([]);
                } else {
                  setSelectedProjects(projects.map((p) => p.id));
                }
              }}
              className={`px-4 py-2 rounded-full border ${
                selectedProjects.length === projects.length 
                  ? 'bg-primary border-primary' 
                  : 'bg-surface border-border'
              }`}
            >
              <Text className={`text-sm font-semibold ${
                selectedProjects.length === projects.length 
                  ? 'text-background' 
                  : 'text-foreground'
              }`}>
                Wszystkie
              </Text>
            </Pressable>

            {projects.map((project) => (
              <Pressable
                key={project.id}
                onPress={() => {
                  setSelectedProjects((prev) =>
                    prev.includes(project.id)
                      ? prev.filter((id) => id !== project.id)
                      : [...prev, project.id]
                  );
                }}
                className={`px-4 py-2 rounded-full border ${
                  selectedProjects.includes(project.id) 
                    ? 'bg-primary border-primary' 
                    : 'bg-surface border-border'
                }`}
              >
                <Text className={`text-sm font-semibold ${
                  selectedProjects.includes(project.id) 
                    ? 'text-background' 
                    : 'text-foreground'
                }`}>
                  {project.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Day Details Modal */}
      <Modal
        visible={dayDetailsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDayDetailsVisible(false)}
      >
        <View className="flex-1 bg-background pt-12">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Pressable onPress={() => setDayDetailsVisible(false)}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-lg font-bold text-foreground">
              {selectedDate}
            </Text>
            <View className="w-6" />
          </View>

          {/* Events List */}
          <FlatList
            data={dayEvents}
            renderItem={({ item }) => (
              <Card className="p-4 m-4">
                <View className="gap-2">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-foreground">{item.tenantName}</Text>
                      <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
                      <Text className="text-xs text-muted mt-1">{item.addressName}</Text>
                    </View>
                    <Badge
                      variant={
                        item.type === 'check_in' 
                          ? 'success' 
                          : item.type === 'check_out'
                          ? 'error'
                          : 'warning'
                      }
                      size="sm"
                      label={
                        item.type === 'check_in'
                          ? 'Zamelowanie'
                          : item.type === 'check_out'
                          ? 'Wymeldowanie'
                          : 'Koniec wypowiedzenia'
                      }
                    />
                  </View>
                  {item.roomName && (
                    <Text className="text-sm text-foreground">Pokój: {item.roomName}</Text>
                  )}
                </View>
              </Card>
            )}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        </View>
      </Modal>
    </ScreenContainer>
  );
}
