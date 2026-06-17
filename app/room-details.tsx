import { Text, View, FlatList, Pressable, Modal, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Room, Space } from '@/types';
import {
  addSpace,
  getDaysRemaining,
  loadData,
  putRoomOnWypowiedzenie,
  removeSpace,
  saveData,
  updateAddressTotalSpaces,
  updateSpaceWypowiedzenieDates,
} from '@/lib/store';

export default function RoomDetailsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, roomId } = useLocalSearchParams<{ projectId: string; addressId: string; roomId: string }>();

  const [room, setRoom] = useState<Room | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [spaceMenuVisible, setSpaceMenuVisible] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>();
  const [editSpaceModalVisible, setEditSpaceModalVisible] = useState(false);
  const [spaceNumberInput, setSpaceNumberInput] = useState('');
  const [wypowiedzenieDatesModalVisible, setWypowiedzenieDatesModalVisible] = useState(false);
  const [wypowiedzenieStartDate, setWypowiedzenieStartDate] = useState('');
  const [wypowiedzenieEndDate, setWypowiedzenieEndDate] = useState('');

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
      const project = projects.find((item) => item.id === projectId);
      const addr = project?.addresses.find((item) => item.id === addressId);
      const foundRoom = addr?.rooms.find((item) => item.id === roomId);
      if (addr) setAddress(addr);
      if (foundRoom) setRoom(foundRoom);
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

  const getSpaceStatus = (space: Space): { label: string; color: string } => {
    if (space.status === 'inactive') {
      return { label: 'Nieaktywne', color: 'bg-muted' };
    }

    if (space.wypowiedzenie) {
      const daysRemaining = getDaysRemaining(space.wypowiedzenie.endDate);
      return space.tenant
        ? { label: `Zajęte (${daysRemaining} dni)`, color: 'bg-warning' }
        : { label: `Wypowiedzenie (${daysRemaining} dni)`, color: 'bg-warning' };
    }

    if (space.tenant) {
      return { label: 'Zajęte', color: 'bg-success' };
    }

    return { label: 'Wolne', color: 'bg-muted' };
  };

  const handleAddSpace = async () => {
    try {
      await addSpace(projectId, addressId, roomId);
      await loadRoom();
    } catch (error: any) {
      if (error.message?.includes('Przekroczono limit miejsc w adresie')) {
        Alert.alert(
          'Limit miejsc w adresie',
          'Przekroczono limit miejsc dostępnych na adresie. Czy chcesz zwiększyć limit miejsc w ustawieniach adresu?',
          [
            { text: 'Anuluj', style: 'cancel' },
            {
              text: 'Zwiększ limit',
              onPress: async () => {
                await updateAddressTotalSpaces(projectId, addressId, address.totalSpaces + 1);
                await addSpace(projectId, addressId, roomId);
                await loadRoom();
              },
            },
          ],
        );
      } else {
        Alert.alert('Błąd', error.message || 'Nie udało się dodać miejsca.');
      }
    }
  };

  const handleRemoveSpace = async (spaceId?: string) => {
    if (!spaceId) return;
    try {
      await removeSpace(projectId, addressId, roomId, spaceId);
      await loadRoom();
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się usunąć miejsca.');
    }
  };

  const handleDeleteSpace = async (space: Space) => {
    setSpaceMenuVisible(false);

    if (space.tenant) {
      Alert.alert(
        'Miejsce zajęte',
        'Miejsce jest zajęte. Najpierw wymelduj albo przenieś mieszkańca.',
        [{ text: 'OK' }],
      );
      return;
    }

    Alert.alert('Usuń miejsce', 'Czy na pewno chcesz usunąć to miejsce?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', onPress: () => handleRemoveSpace(space.id), style: 'destructive' },
    ]);
  };

  const handlePutSpaceOnWypowiedzenie = async (space: Space) => {
    try {
      const projects = await loadData();
      const project = projects.find((item) => item.id === projectId);
      const addr = project?.addresses.find((item) => item.id === addressId);
      const targetRoom = addr?.rooms.find((item) => item.id === roomId);
      const targetSpace = targetRoom?.spaces.find((item) => item.id === space.id);
      if (!addr || !targetSpace) return;

      const period = addr.evictionPeriod || addr.wypowiedzeniePeriod || 14;
      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + period);
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      targetSpace.status = 'wypowiedzenie';
      targetSpace.wypowiedzenie = {
        startDate: start,
        endDate: end,
        paidUntil: end,
        groupedWithAddress: false,
      };

      await saveData(projects);
      await loadRoom();
      setSpaceMenuVisible(false);
      setSelectedSpace(undefined);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się ustawić wypowiedzenia.');
    }
  };

  const openEditSpaceModal = (space: Space) => {
    setSpaceNumberInput(String(space.number));
    setSpaceMenuVisible(false);
    setEditSpaceModalVisible(true);
  };

  const handleSaveSpaceNumber = async () => {
    if (!selectedSpace) return;
    const nextNumber = parseInt(spaceNumberInput, 10);
    if (!Number.isFinite(nextNumber) || nextNumber <= 0) {
      Alert.alert('Błąd', 'Numer miejsca musi być większy niż 0.');
      return;
    }

    if (room.spaces.some((space) => space.id !== selectedSpace.id && space.number === nextNumber)) {
      Alert.alert('Błąd', 'W tym pokoju istnieje już miejsce o takim numerze.');
      return;
    }

    try {
      const projects = await loadData();
      const project = projects.find((item) => item.id === projectId);
      const addr = project?.addresses.find((item) => item.id === addressId);
      const targetRoom = addr?.rooms.find((item) => item.id === roomId);
      const targetSpace = targetRoom?.spaces.find((item) => item.id === selectedSpace.id);
      if (!targetSpace) return;

      targetSpace.number = nextNumber;
      targetRoom!.spaces.sort((left, right) => left.number - right.number);
      await saveData(projects);
      await loadRoom();
      setEditSpaceModalVisible(false);
      setSelectedSpace(undefined);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się zapisać miejsca.');
    }
  };

  const openWypowiedzenieDatesModal = (space: Space) => {
    if (!space.wypowiedzenie) return;
    setWypowiedzenieStartDate(space.wypowiedzenie.startDate);
    setWypowiedzenieEndDate(space.wypowiedzenie.endDate);
    setSpaceMenuVisible(false);
    setWypowiedzenieDatesModalVisible(true);
  };

  const handleSaveWypowiedzenieDates = async () => {
    if (!selectedSpace) return;

    try {
      await updateSpaceWypowiedzenieDates(
        projectId,
        addressId,
        roomId,
        selectedSpace.id,
        wypowiedzenieStartDate,
        wypowiedzenieEndDate,
      );
      await loadRoom();
      setWypowiedzenieDatesModalVisible(false);
      setSelectedSpace(undefined);
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się zapisać dat wypowiedzenia.');
    }
  };

  const handleCancelSpaceWypowiedzenie = async () => {
    if (!selectedSpace) return;

    Alert.alert(
      'Anuluj wypowiedzenie',
      'Czy na pewno anulować wypowiedzenie tego miejsca?',
      [
        { text: 'Nie', style: 'cancel' },
        {
          text: 'Anuluj wypowiedzenie',
          style: 'destructive',
          onPress: async () => {
            try {
              const projects = await loadData();
              const project = projects.find((item) => item.id === projectId);
              const addr = project?.addresses.find((item) => item.id === addressId);
              const targetRoom = addr?.rooms.find((item) => item.id === roomId);
              const targetSpace = targetRoom?.spaces.find((item) => item.id === selectedSpace.id);
              if (!targetSpace) return;

              targetSpace.wypowiedzenie = undefined;
              targetSpace.status = targetSpace.tenant ? 'occupied' : 'vacant';

              await saveData(projects);
              await loadRoom();
              setWypowiedzenieDatesModalVisible(false);
              setSelectedSpace(undefined);
            } catch (error: any) {
              Alert.alert('Błąd', error.message || 'Nie udało się anulować wypowiedzenia.');
            }
          },
        },
      ],
    );
  };

  const handlePutRoomOnWypowiedzenie = async () => {
    try {
      await putRoomOnWypowiedzenie(projectId, addressId, roomId);
      await loadRoom();
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się ustawić wypowiedzenia pokoju.');
    }
  };

  const handleAddTenant = () => {
    if (room.spaces.filter((space) => !space.tenant && space.status !== 'inactive').length === 0) {
      Alert.alert('Brak wolnych miejsc', 'Wszystkie miejsca w tym pokoju są zajęte albo nieaktywne.');
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
      <Card className="p-4 mb-3">
        <View className="gap-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-foreground flex-1">
                  {item.tenant ? (
                    <>
                      {item.tenant.firstName} {item.tenant.lastName}
                      <Text className="text-muted">, {new Date().getFullYear() - item.tenant.birthYear} lat</Text>
                    </>
                  ) : 'Wolne'}
                </Text>
                <Badge variant="default" size="sm" label={`Miejsce ${item.number}`} />
              </View>
              <Badge
                variant={status.color === 'bg-success' ? 'success' : status.color === 'bg-warning' ? 'warning' : 'default'}
                size="sm"
                label={status.label}
              />
              {item.tenant?.status === 'do_wymeldowania' && (
                <Badge variant="warning" size="sm" label="Do wymeldowania" />
              )}
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

          {item.tenant && (
            <View className="gap-2 pt-2 border-t border-border">
              <Text className="text-xs text-muted">Zarezerwowane: {item.tenant.checkInDate}</Text>
              <Text className="text-sm font-semibold text-foreground">{item.tenant.monthlyPrice} zł/miesiąc</Text>
            </View>
          )}

          {item.wypowiedzenie && (
            <View className="gap-2 pt-2 border-t border-border">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted">Wypowiedzenie: {item.wypowiedzenie.startDate} - {item.wypowiedzenie.endDate}</Text>
                <Text className="text-sm font-semibold text-warning">{daysRemaining} dni</Text>
              </View>
              <ProgressBar
                progress={Math.max(0, (daysRemaining / (address.evictionPeriod || address.wypowiedzeniePeriod || 14)) * 100)}
                color="bg-warning"
              />
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <ScreenContainer>
      <View className="flex-row items-center gap-3 mb-4">
        <Pressable onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View className="flex-1 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-foreground">{room.name}</Text>
          <View className="flex-row items-center gap-2">
            <Pressable onPress={handlePutRoomOnWypowiedzenie} className="bg-warning rounded-full p-2">
              <MaterialIcons name="warning" size={24} color={colors.background} />
            </Pressable>
            <Pressable onPress={handleAddSpace} className="bg-primary rounded-full p-2">
              <MaterialIcons name="add" size={24} color={colors.background} />
            </Pressable>
            <Pressable
              onPress={() => handleRemoveSpace(room.spaces[room.spaces.length - 1]?.id)}
              disabled={room.spaces.length === 0 || !!room.spaces[room.spaces.length - 1]?.tenant}
              className={`rounded-full p-2 ${room.spaces.length === 0 || !!room.spaces[room.spaces.length - 1]?.tenant ? 'bg-muted' : 'bg-primary'}`}
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
            <Text className="text-muted text-base">Dodaj miejsca przyciskiem u góry.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <View className="absolute bottom-6 right-4">
        <TouchableOpacity onPress={handleAddTenant} className="bg-primary rounded-full p-4 shadow-lg">
          <MaterialIcons name="person-add" size={30} color={colors.background} />
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={spaceMenuVisible} onRequestClose={() => setSpaceMenuVisible(false)}>
        <Pressable className="flex-1 justify-center items-center bg-black/50" onPress={() => setSpaceMenuVisible(false)}>
          <Pressable
            className="p-6 rounded-2xl w-11/12 max-w-sm border border-border"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              elevation: 12,
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 10 },
            }}
          >
            <Text className="text-lg font-bold text-foreground text-center mb-4">
              Miejsce {selectedSpace?.number}
            </Text>

            {selectedSpace && (
              <>
                <Pressable
                  onPress={() => openEditSpaceModal(selectedSpace)}
                  className="flex-row items-center justify-center gap-3 py-3 bg-surfaceVariant rounded-xl mb-2"
                >
                  <MaterialIcons name="edit" size={24} color={colors.primary} />
                  <Text className="text-foreground font-medium">Edytuj miejsce</Text>
                </Pressable>

                {selectedSpace.wypowiedzenie ? (
                  <Pressable
                    onPress={() => openWypowiedzenieDatesModal(selectedSpace)}
                    className="flex-row items-center justify-center gap-3 py-3 bg-warning/20 rounded-xl mb-2"
                  >
                    <MaterialIcons name="event" size={24} color={colors.warning} />
                    <Text className="text-warning font-medium">Zmień wypowiedzenie</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => handlePutSpaceOnWypowiedzenie(selectedSpace)}
                    className="flex-row items-center justify-center gap-3 py-3 bg-warning/20 rounded-xl mb-2"
                  >
                    <MaterialIcons name="warning" size={24} color={colors.warning} />
                    <Text className="text-warning font-medium">Postaw na wypowiedzenie</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => handleDeleteSpace(selectedSpace)}
                  className="flex-row items-center justify-center gap-3 py-3 bg-error/20 rounded-xl"
                >
                  <MaterialIcons name="delete" size={24} color={colors.error} />
                  <Text className="text-error font-medium">Usuń miejsce</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" transparent visible={editSpaceModalVisible} onRequestClose={() => setEditSpaceModalVisible(false)}>
        <Pressable className="flex-1 justify-center items-center bg-black/50 p-4" onPress={() => setEditSpaceModalVisible(false)}>
          <Pressable className="bg-card p-6 rounded-2xl w-full max-w-sm">
            <Text className="text-lg font-bold text-foreground text-center mb-4">Edytuj miejsce</Text>
            <Text className="text-sm font-semibold text-foreground mb-2">Numer miejsca</Text>
            <TextInput
              value={spaceNumberInput}
              onChangeText={setSpaceNumberInput}
              keyboardType="number-pad"
              placeholder="np. 1"
              placeholderTextColor={colors.muted}
              className="bg-surfaceVariant rounded-xl px-4 py-3 text-foreground"
            />
            <Pressable onPress={handleSaveSpaceNumber} className="bg-primary py-3 rounded-xl items-center mt-4">
              <Text className="text-white font-semibold">Zapisz</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal animationType="fade" transparent visible={wypowiedzenieDatesModalVisible} onRequestClose={() => setWypowiedzenieDatesModalVisible(false)}>
        <Pressable className="flex-1 justify-center items-center bg-black/50 p-4" onPress={() => setWypowiedzenieDatesModalVisible(false)}>
          <Pressable
            className="p-6 rounded-2xl w-full max-w-sm gap-4 border border-border"
            style={{ backgroundColor: colors.card, borderColor: colors.border, elevation: 12 }}
          >
            <Text className="text-lg font-bold text-foreground text-center">Daty wypowiedzenia</Text>
            <DatePicker value={wypowiedzenieStartDate} onChange={setWypowiedzenieStartDate} label="Data rozpoczęcia" placeholder="Wybierz datę" />
            <DatePicker value={wypowiedzenieEndDate} onChange={setWypowiedzenieEndDate} label="Data zakończenia" placeholder="Wybierz datę" />
            <Pressable onPress={handleSaveWypowiedzenieDates} className="bg-primary py-3 rounded-xl items-center">
              <Text className="text-white font-semibold">Zapisz</Text>
            </Pressable>
            <Pressable onPress={handleCancelSpaceWypowiedzenie} className="bg-error/20 py-3 rounded-xl items-center">
              <Text className="text-error font-semibold">Anuluj wypowiedzenie</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
