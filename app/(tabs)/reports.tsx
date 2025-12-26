import { ScrollView, Text, View, FlatList, Pressable, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, Conflict, EvictionArchive } from '@/types';
import { loadData, calculateProjectStats, getConflicts, loadEvictionArchive, clearEvictionArchive, getDaysRemaining } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'evictions' | 'conflicts' | 'archive'>('overview');
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [archive, setArchive] = useState<EvictionArchive[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await loadData();
      setProjects(data);
      
      // Collect all conflicts
      const allConflicts: Conflict[] = [];
      for (const project of data) {
        allConflicts.push(...getConflicts(project));
      }
      setConflicts(allConflicts);
      
      // Load archive
      const archiveData = await loadEvictionArchive();
      setArchive(archiveData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = () => {
    let totalSpaces = 0;
    let totalOccupied = 0;
    let totalVacant = 0;
    let totalWypowiedzenie = 0;

    for (const project of projects) {
      const stats = calculateProjectStats(project);
      totalSpaces += stats.total;
      totalOccupied += stats.occupied;
      totalVacant += stats.vacant;
      totalWypowiedzenie += stats.wypowiedzenie;
    }

    const occupancyPercent = totalSpaces > 0 
      ? Math.round(((totalOccupied + totalWypowiedzenie) / totalSpaces) * 100)
      : 0;

    return { totalSpaces, totalOccupied, totalVacant, totalWypowiedzenie, occupancyPercent };
  };

  const getEvictionsWithProgress = () => {
    const evictions: any[] = [];
    for (const project of projects) {
      for (const address of project.addresses) {
        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.status === 'wypowiedzenie' && space.wypowiedzenie) {
              const daysRemaining = getDaysRemaining(space.wypowiedzenie.endDate);
              evictions.push({
                id: space.id,
                projectName: project.name,
                addressName: address.name,
                tenantName: space.tenant ? `${space.tenant.firstName} ${space.tenant.lastName}` : 'Wolne',
                daysRemaining,
                endDate: space.wypowiedzenie.endDate,
              });
            }
          }
        }
      }
    }
    // Sort by days remaining (urgent first)
    return evictions.sort((a, b) => a.daysRemaining - b.daysRemaining);
  };

  const handleExportExcel = async (projectId: string) => {
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      // Build CSV content
      let csv = 'Projekt,Adres,Pokój,Miejsce,Imię,Nazwisko,Płeć,Rok urodzenia,Data zameldowania,Cena\n';

      for (const address of project.addresses) {
        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.tenant) {
              csv += `"${project.name}","${address.name}","${room.name}","${space.number}","${space.tenant.firstName}","${space.tenant.lastName}","${space.tenant.gender}","${space.tenant.birthYear}","${space.tenant.checkInDate}","${space.tenant.monthlyPrice}"\n`;
            }
          }
        }
      }

      // Save file
      const filename = `${project.name}-${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(filepath, csv);
      
      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'text/csv',
          dialogTitle: `Eksportuj raport: ${project.name}`,
        });
      } else {
        Alert.alert('Sukces', `Plik zapisany: ${filename}`);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      Alert.alert('Błąd', 'Nie udało się wyeksportować raportu');
    }
  };

  const handleClearArchive = () => {
    Alert.alert(
      'Wyczyść archiwum',
      'Czy na pewno chcesz usunąć wszystkie rekordy z archiwum?',
      [
        { text: t.common.cancel, onPress: () => {} },
        {
          text: t.common.delete,
          onPress: async () => {
            try {
              await clearEvictionArchive();
              await loadReports();
            } catch (error) {
              console.error('Error clearing archive:', error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const overallStats = calculateOverallStats();
  const evictionsWithProgress = getEvictionsWithProgress();

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Overall Stats */}
      <Card className="p-4 mb-4 bg-primary">
        <View className="items-center">
          <Text className="text-white text-sm">{t.statistics.occupancyPercent}</Text>
          <Text className="text-white text-5xl font-bold mt-2">{overallStats.occupancyPercent}%</Text>
          <Text className="text-white/80 text-sm mt-2">Cel: 100%</Text>
        </View>
      </Card>

      {/* Key Metrics */}
      <View className="gap-3 mb-4">
        <Pressable
          className="bg-surface rounded-lg p-4 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-sm text-muted">Razem miejsc</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalSpaces}</Text>
          </View>
          <MaterialIcons name="apartment" size={32} color={colors.primary} />
        </Pressable>

        <Pressable
          className="bg-surface rounded-lg p-4 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-sm text-muted">Zajęte miejsca</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalOccupied}</Text>
          </View>
          <MaterialIcons name="person" size={32} color={colors.success} />
        </Pressable>

        <Pressable
          className="bg-surface rounded-lg p-4 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-sm text-muted">Wolne miejsca</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalVacant}</Text>
          </View>
          <MaterialIcons name="event-available" size={32} color={colors.warning} />
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('evictions')}
          className="bg-surface rounded-lg p-4 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-sm text-muted">Na wypowiedzeniu</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalWypowiedzenie}</Text>
          </View>
          <MaterialIcons name="warning" size={32} color={colors.warning} />
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('conflicts')}
          className="bg-surface rounded-lg p-4 flex-row justify-between items-center"
        >
          <View>
            <Text className="text-sm text-muted">Konflikty</Text>
            <Text className="text-2xl font-bold text-foreground mt-1">{conflicts.length}</Text>
          </View>
          <MaterialIcons name="error" size={32} color={colors.error} />
        </Pressable>
      </View>

      {/* Projects with Export */}
      <Text className="text-lg font-bold text-foreground mb-3">Projekty</Text>
      {projects.map((project) => {
        const stats = calculateProjectStats(project);
        return (
          <Card key={project.id} className="p-4 mb-3">
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{project.name}</Text>
                  <Text className="text-sm text-muted mt-1">{stats.occupancyPercent}% obłożenie</Text>
                </View>
                <Pressable
                  onPress={() => handleExportExcel(project.id)}
                  className="bg-primary rounded-lg px-3 py-2"
                >
                  <MaterialIcons name="download" size={20} color="white" />
                </Pressable>
              </View>
              <ProgressBar progress={stats.occupancyPercent} />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );

  const renderEvictionsTab = () => (
    <FlatList
      data={evictionsWithProgress}
      renderItem={({ item }) => (
        <Card className="p-4 mb-3">
          <View className="gap-2">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{item.tenantName}</Text>
                <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
                <Text className="text-xs text-muted mt-1">{item.addressName}</Text>
              </View>
              <Badge 
                variant={item.daysRemaining <= 3 ? 'error' : 'warning'} 
                size="sm" 
                label={`${item.daysRemaining}d`} 
              />
            </View>
            <ProgressBar 
              progress={Math.max(0, (item.daysRemaining / 14) * 100)} 
              color={item.daysRemaining <= 3 ? 'bg-error' : 'bg-warning'}
            />
            <Text className="text-xs text-muted">Do: {item.endDate}</Text>
          </View>
        </Card>
      )}
      keyExtractor={(item) => item.id}
      scrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListEmptyComponent={
        <View className="items-center justify-center py-8">
          <Text className="text-muted">Brak wypowiedzeń</Text>
        </View>
      }
    />
  );

  const renderConflictsTab = () => (
    <FlatList
      data={conflicts}
      renderItem={({ item }) => (
        <Card className="p-4 mb-3 border-l-4 border-error">
          <View className="gap-2">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="font-semibold text-foreground">{item.firstName} {item.lastName}</Text>
                <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
              </View>
              <Badge variant="error" size="sm" label={item.type === 'no_room' ? 'Bez pokoju' : 'Zaległy'} />
            </View>
            <Text className="text-sm text-foreground mt-2">{item.message}</Text>
            <Text className="text-xs text-muted mt-1">{item.addressName}</Text>
          </View>
        </Card>
      )}
      keyExtractor={(item) => item.id}
      scrollEnabled={true}
      contentContainerStyle={{ paddingBottom: 20 }}
      ListEmptyComponent={
        <View className="items-center justify-center py-8">
          <Text className="text-muted">Brak konfliktów</Text>
        </View>
      }
    />
  );

  const renderArchiveTab = () => (
    <View className="flex-1">
      <FlatList
        data={archive}
        renderItem={({ item }) => (
          <Card className="p-4 mb-3">
            <View className="gap-2">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-foreground">{item.firstName} {item.lastName}</Text>
                  <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
                </View>
                <Badge variant="info" size="sm" label={item.reason} />
              </View>
              <Text className="text-xs text-muted">Zameldowany: {item.checkInDate}</Text>
              <Text className="text-xs text-muted">Wymeldowany: {item.checkOutDate}</Text>
            </View>
          </Card>
        )}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-muted">Archiwum puste</Text>
          </View>
        }
      />
      {archive.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <Pressable
            onPress={handleClearArchive}
            className="bg-error rounded-lg py-3 items-center"
          >
            <Text className="text-white font-semibold">Wyczyść archiwum</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <Text className="text-2xl font-bold text-foreground mb-6">{t.reports.title}</Text>

      {/* Tabs */}
      <View className="flex-row gap-2 mb-4 bg-surface rounded-lg p-1">
        {(['overview', 'evictions', 'conflicts', 'archive'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg items-center ${
              activeTab === tab ? 'bg-primary' : ''
            }`}
          >
            <Text className={`text-xs font-semibold ${
              activeTab === tab ? 'text-white' : 'text-muted'
            }`}>
              {tab === 'overview' && 'Przegląd'}
              {tab === 'evictions' && 'Wypowiedzenia'}
              {tab === 'conflicts' && 'Konflikty'}
              {tab === 'archive' && 'Archiwum'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : activeTab === 'overview' ? (
        renderOverviewTab()
      ) : activeTab === 'evictions' ? (
        renderEvictionsTab()
      ) : activeTab === 'conflicts' ? (
        renderConflictsTab()
      ) : (
        renderArchiveTab()
      )}
    </ScreenContainer>
  );
}
