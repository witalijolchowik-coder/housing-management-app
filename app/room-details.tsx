import { ScrollView, Text, View, FlatList, Pressable, Modal, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Room, Space } from '@/types';
import { loadData, getDaysRemaining, saveData, addSpace, removeSpace, updateAddressTotalSpaces, updateSpaceWypowiedzenieStartDate } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RoomDetailsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, roomId } = useLocalSearchParams<{ projectId: string; addressId: string; roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [spaceMenuVisible, setSpaceMenuVisible] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadRoom();
  }, [projectId, addressId, roomId]);

  useFocusEffect(
    useCallback(() => {
      loadRoom();
    }, [projectId, addressId, roomId])
  );

  const loadRoom = async () => {
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          setAddress(addr);
          const r = addr.rooms.find((rm) => rm.id === roomId);
          if (r) {
            setRoom(r);
          }
        }
      }
    } catch (error) {
      console.error('Error loading room:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !room || !address) {
    return (
      <ScreenContainer>
        <Text className="text-muted">{t.common.loading}</Text>
      </ScreenContainer>
    );
  }

  const getSpaceStatus = (space: Space): { label: string; color: string; icon: string } => {
    if (space.wypowiedzenie) {
      const daysRemaining = getDaysRemaining(space.wypowiedzenie.endDate);
      if (space.tenant) {
        return {
          label: `Zajęte (${daysRemaining} dni)`,
          color: 'bg-warning',
          icon: 'warning',
        };
      } else {
        return {
          label: `Wypowiedzenie (${daysRemaining} dni)`,
          color: 'bg-warning',
          icon: 'schedule',
        };
      }
    } else if (space.tenant) {
      return {
        label: 'Zajęte',
        color: 'bg-success',
        icon: 'check-circle',
      };
    } else {
      return {
        label: 'Wolne',
        color: 'bg-muted',
        icon: 'circle-outline',
      };
    }
  };

  const handleAddSpace = async () => {
    try {
      await addSpace(projectId, addressId, roomId);
      await loadRoom();
    } catch (error: any) {
      if (error.message.includes('Przekroczono limit miejsc w adresie')) {
        Alert.alert(
          'Limit miejsc w adresie',
          'Przekroczono limit miejsc dostępnych na adresie. Czy chcesz zwiększyć limit miejsc w ustawieniach adresu?',
          [
            { text: 'Anuluj', style: 'cancel' },
            { text: 'Zwiększ limit', onPress: async () => {
                if (address) {
                  await updateAddressTotalSpaces(projectId, addressId, address.totalSpaces + 1);
                  await addSpace(projectId, addressId, roomId);
                  await loadRoom();
                }
              }
            },
          ]
        );
      } else {
        Alert.alert('Błąd', error.message);
      }
    }
  };

  const handleRemoveSpace = async (spaceId: string) => {
    try {
      await removeSpace(projectId, addressId, roomId, spaceId);
      await loadRoom();
    } catch (error: any) {
      Alert.alert('Błąd', error.message);
    }
  };

  const handleDeleteSpace = async (space: Space) => {
    setSpaceMenuVisible(false);
    
    Alert.alert(
      'Usuń miejsce',
      'Czy na pewno chcesz usunąć to miejsce?',
      [
        { text: 'Anuluj', style: 'cancel' },
        { text: 'Usuń', onPress: () => handleRemoveSpace(space.id), style: 'destructive' },
      ]
    );
  };

  const handleToggleWypowiedzenie = async (space: Space, putOn: boolean) => {
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          const r = addr.rooms.find((rm) => rm.id === roomId);
          if (r) {
            const s = r.spaces.find((sp) => sp.id === space.id);
            if (s) {
              if (putOn) {
                const wypowiedzenieDays = addr.wypowiedzeniePeriod || 14;
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + wypowiedzenieDays);
                s.status = 'wypowiedzenie';
                s.wypowiedzenie = {
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  paidUntil: endDate.toISOString().split('T')[0],
                  groupedWithAddress: false,
                };
              } else {
                s.wypowiedzenie = undefined;
                s.status = s.tenant ? 'occupied' : 'vacant';
              }
              await saveData(projects);
              await loadRoom();
              setSpaceMenuVisible(false);
              setSelectedSpace(undefined);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error toggling wypowiedzenie:', error);
    }
  };

  const handleChangeWypowiedzenieStartDate = async (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate && selectedSpace && selectedSpace.wypowiedzenie) {
      try {
        await updateSpaceWypowiedzenieStartDate(projectId, addressId, roomId, selectedSpace.id, selectedDate.toISOString().split('T')[0]);
        await loadRoom();
        setSpaceMenuVisible(false);
        setSelectedSpace(undefined);
      } catch (error: any) {
        Alert.alert('Błąd', error.message);
      }
    }
  };

  const handleAddTenant = () => {
    if (room.spaces.filter(s => !s.tenant).length === 0) {
      Alert.alert('Brak wolnych miejsc', 'Wszystkie miejsca w tym pokoju są zajęte.');
      return;
    }
    router.push({
      pathname: '/select-tenant',
      params: { projectId, addressId, roomId },
    });
  };

  const renderSpaceCard = ({ item }: { item: Space }) => {
    const status = getSpaceStatus(item);
    const daysRemaining = item.wypowiedzenie ? getDaysRemaining(item.wypowiedzenie.endDate) : 0;

    return (
      <View>
        <Card className="p-4 mb-3">
          <View className="gap-3">
            {/* Header: Tenant name or "Wolne" with space badge and menu */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-bold text-foreground flex-1">
                    {item.tenant ? (
                      <>
                        {item.tenant.firstName} {item.tenant.lastName}<Text className="text-muted">, {new Date().getFullYear() - item.tenant.birthYear} {(() => {
                          const age = new Date().getFullYear() - item.tenant.birthYear;
                          const lastDigit = age % 10;
                          const lastTwoDigits = age % 100;
                          if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'lat';
                          if (lastDigit === 1) return 'rok';
                          if (lastDigit >= 2 && lastDigit <= 4) return 'lata';
                          return 'lat';
                        })()}</Text>
                      </>
                    ) : 'Wolne'}
                  </Text>
                  <Badge
                    variant="default"
                    size="sm"
                    label={`Miejsce ${item.number}`}
                    className=""
                  />
                </View>
                <Badge
                  variant={status.color === 'bg-success' ? 'success' : status.color === 'bg-warning' ? 'warning' : 'default'}
                  size="sm"
                  label={status.label}
                  className=""
                />
              </View>
              <Pressable
                onPress={() => {
                  setSelectedSpace(item);
                  setSpaceMenuVisible(true);
                }}
                className="p-2"
              >
                <MaterialIcons name="more-vert" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Tenant details */}
            {item.tenant && (
              <View className="gap-2 pt-2 border-t border-border">
                <Text className="text-xs text-muted">
                  Zarezerwowane: {item.tenant.checkInDate}
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  {item.tenant.monthlyPrice} zł/miesiąc
                </Text>
              </View>
            )}

            {/* Eviction info */}
            {item.wypowiedzenie && (
              <View className="gap-2 pt-2 border-t border-border">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-muted">Wypowiedzenie:</Text>
                  <Text className="text-sm font-semibold text-warning">{daysRemaining} dni</Text>
                </View>
                <ProgressBar
                  progress={Math.max(0, (daysRemaining / 14) * 100)}
                  color="bg-warning"
                />
              </View>
            )}
          </View>
        </Card>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-4" style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <Pressable onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View className="flex-1 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">{room.name}</Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={handleAddSpace}
              className="bg-primary rounded-full p-2"
            >
              <MaterialIcons name="add" size={24} color={colors.background} />
            </Pressable>
            <Pressable
              onPress={() => handleRemoveSpace(room.spaces[room.spaces.length - 1]?.id)}
              disabled={room.spaces.length === 0 || room.spaces[room.spaces.length - 1]?.tenant !== null}
              className={`rounded-full p-2 ${room.spaces.length === 0 || room.spaces[room.spaces.length - 1]?.tenant !== null ? 'bg-muted' : 'bg-primary'}`}
            >
              <MaterialIcons name="remove" size={24} color={colors.background} />
            </Pressable>
          </View>
        </View>
      </View>

      <FlatList
        data={room.spaces}
        keyExtractor={(item) => item.id}
        renderItem={renderSpaceCard}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-6">
            <MaterialIcons name="bed" size={48} color={colors.muted} />
            <Text className="text-muted text-lg mt-4">Brak miejsc w tym pokoju.</Text>
            <Text className="text-muted text-base">Dodaj miejsca, używając przycisku '+' u góry.</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 120 }}
      />

      {/* Floating Action Button */}
      <View className="absolute right-4" style={{ bottom: insets.bottom + 20 }}>
        <TouchableOpacity
          onPress={handleAddTenant}
          className="bg-primary rounded-full p-4 shadow-lg"
        >
          <MaterialIcons name="person-add" size={30} color={colors.background} />
        </TouchableOpacity>
      </View>

      {/* Space Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={spaceMenuVisible}
        onRequestClose={() => setSpaceMenuVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/80"
          onPress={() => setSpaceMenuVisible(false)}
        >
          <Pressable className="bg-card p-6 rounded-2xl w-11/12 max-w-sm">
            <Text className="text-lg font-bold text-foreground text-center mb-4">
              Opcje miejsca {selectedSpace?.number}
            </Text>
            
            {selectedSpace?.wypowiedzenie ? (
              <>
                <Pressable
                  onPress={() => {
                    setSpaceMenuVisible(false);
                    setShowDatePicker(true);
                  }}
                  className="flex-row items-center justify-center gap-3 py-3 bg-surfaceVariant rounded-xl mb-2"
                >
                  <MaterialIcons name="calendar-today" size={24} color={colors.primary} />
                  <Text className="text-foreground font-medium">Zmień datę rozpoczęcia wypowiedzenia</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleToggleWypowiedzenie(selectedSpace, false)}
                  className="flex-row items-center justify-center gap-3 py-3 bg-warning/20 rounded-xl mb-2"
                >
                  <MaterialIcons name="cancel" size={24} color={colors.warning} />
                  <Text className="text-warning font-medium">Anuluj wypowiedzenie</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => handleToggleWypowiedzenie(selectedSpace as Space, true)}
                className="flex-row items-center justify-center gap-3 py-3 bg-warning/20 rounded-xl mb-2"
              >
                <MaterialIcons name="warning" size={24} color={colors.warning} />
                <Text className="text-warning font-medium">Postaw na wypowiedzenie</Text>
              </Pressable>
            )}

            <Pressable
              onPress={() => handleDeleteSpace(selectedSpace as Space)}
              className="flex-row items-center justify-center gap-3 py-3 bg-error/20 rounded-xl"
            >
              <MaterialIcons name="delete" size={24} color={colors.error} />
              <Text className="text-error font-medium">Usuń miejsce</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {showDatePicker && selectedSpace && selectedSpace.wypowiedzenie && (
        <DateTimePicker
          value={new Date(selectedSpace.wypowiedzenie.startDate)}
          mode="date"
          display="default"
          onChange={handleChangeWypowiedzenieStartDate}
        />
      )}
    </ScreenContainer>
  );
}
