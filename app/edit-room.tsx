import { ScrollView, Text, View, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Room, RoomType } from '@/types';
import { loadData, saveData } from '@/lib/store';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export default function EditRoomScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, roomId } = useLocalSearchParams();

  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('male');
  const [totalSpaces, setTotalSpaces] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        const projects = await loadData();
        const project = projects.find((item) => item.id === projectId);
        const address = project?.addresses.find((item) => item.id === addressId);
        const foundRoom = address?.rooms.find((item) => item.id === roomId);

        if (foundRoom) {
          setRoom(foundRoom);
          setRoomName(foundRoom.name);
          setRoomType(foundRoom.type);
          setTotalSpaces(foundRoom.totalSpaces.toString());
        }
      } catch (error) {
        console.error('Error loading room:', error);
      }
    };

    loadRoom();
  }, [projectId, addressId, roomId]);

  const handleSubmit = async () => {
    if (!roomName.trim()) {
      Alert.alert('Błąd', 'Wpisz nazwę pokoju.');
      return;
    }

    if (!totalSpaces.trim() || isNaN(parseInt(totalSpaces, 10))) {
      Alert.alert('Błąd', 'Wpisz liczbę miejsc.');
      return;
    }

    const spacesCount = parseInt(totalSpaces, 10);
    if (spacesCount <= 0) {
      Alert.alert('Błąd', 'Liczba miejsc musi być większa niż 0.');
      return;
    }

    try {
      setLoading(true);
      const projects = await loadData();
      const project = projects.find((item) => item.id === projectId);

      if (!project) {
        Alert.alert('Błąd', 'Nie znaleziono projektu.');
        return;
      }

      const address = project.addresses.find((item) => item.id === addressId);
      if (!address) {
        Alert.alert('Błąd', 'Nie znaleziono adresu.');
        return;
      }

      const roomToEdit = address.rooms.find((item) => item.id === roomId);
      if (!roomToEdit) {
        Alert.alert('Błąd', 'Nie znaleziono pokoju.');
        return;
      }

      const otherRoomsSpaces = address.rooms
        .filter((item) => item.id !== roomId)
        .reduce((sum, item) => sum + item.totalSpaces, 0);

      if (otherRoomsSpaces + spacesCount > address.totalSpaces) {
        const newTotal = otherRoomsSpaces + spacesCount;
        Alert.alert(
          'Przekroczono limit miejsc',
          `Całkowita liczba miejsc (${newTotal}) przekroczy limit adresu (${address.totalSpaces}).\n\nCzy chcesz zwiększyć limit adresu do ${newTotal} miejsc?`,
          [
            {
              text: 'Anuluj',
              style: 'cancel',
              onPress: () => setLoading(false),
            },
            {
              text: 'Zwiększ limit',
              onPress: async () => {
                address.totalSpaces = newTotal;
                await continueRoomUpdate(projects);
              },
            },
          ],
        );
        return;
      }

      await continueRoomUpdate(projects);
    } catch (error) {
      console.error('Error editing room:', error);
      Alert.alert('Błąd', 'Nie udało się edytować pokoju.');
    } finally {
      setLoading(false);
    }
  };

  const continueRoomUpdate = async (loadedProjects?: Awaited<ReturnType<typeof loadData>>) => {
    try {
      const projects = loadedProjects || await loadData();
      const project = projects.find((item) => item.id === projectId);
      const address = project?.addresses.find((item) => item.id === addressId);
      const roomToEdit = address?.rooms.find((item) => item.id === roomId);
      if (!roomToEdit) return;

      const spacesCount = parseInt(totalSpaces, 10);
      roomToEdit.name = roomName.trim();
      roomToEdit.type = roomType;

      if (spacesCount > roomToEdit.totalSpaces) {
        for (let index = roomToEdit.totalSpaces; index < spacesCount; index++) {
          roomToEdit.spaces.push({
            id: generateUUID(),
            roomId: roomToEdit.id,
            number: index + 1,
            status: 'vacant',
          });
        }
      }

      if (spacesCount < roomToEdit.totalSpaces) {
        const spacesToRemove = roomToEdit.totalSpaces - spacesCount;
        let removed = 0;

        for (let index = roomToEdit.spaces.length - 1; index >= 0 && removed < spacesToRemove; index--) {
          const space = roomToEdit.spaces[index];
          if (space.status === 'vacant' && !space.tenant && !space.wypowiedzenie) {
            roomToEdit.spaces.splice(index, 1);
            removed++;
          }
        }

        if (removed < spacesToRemove) {
          Alert.alert(
            'Ostrzeżenie',
            `Nie można zmniejszyć liczby miejsc, ponieważ ${spacesToRemove - removed} miejsc jest zajęte albo w okresie wypowiedzenia.`,
          );
          return;
        }
      }

      roomToEdit.totalSpaces = spacesCount;
      await saveData(projects);
      Alert.alert('Sukces', `Pokój "${roomName}" został zaktualizowany.`);
      router.back();
    } catch (error) {
      console.error('Error updating room:', error);
      Alert.alert('Błąd', 'Nie udało się zaktualizować pokoju.');
    }
  };

  if (!room) {
    return (
      <ScreenContainer className="p-4 pt-12 pb-20 items-center justify-center">
        <Text className="text-foreground">{t.common.loading}</Text>
      </ScreenContainer>
    );
  }

  const renderRoomTypeButton = (value: RoomType, label: string) => (
    <Pressable
      onPress={() => setRoomType(value)}
      className={`flex-1 rounded-lg py-3 items-center ${
        roomType === value ? 'bg-primary' : 'bg-surface border border-border'
      }`}
    >
      <Text className={`font-semibold ${roomType === value ? 'text-background' : 'text-foreground'}`}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-4 pt-12 pb-20">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-3 mb-6">
            <Pressable onPress={() => router.back()} className="bg-surfaceVariant rounded-full p-2">
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground flex-1">Edytuj pokój</Text>
          </View>

          <Card className="p-6 gap-4">
            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Nazwa pokoju *</Text>
              <TextInput
                value={roomName}
                onChangeText={setRoomName}
                placeholder="np. Pokój 5"
                placeholderTextColor={colors.muted}
                className="bg-surfaceVariant rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Typ pokoju</Text>
              <View className="flex-row gap-2">
                {renderRoomTypeButton('male', 'Męski')}
                {renderRoomTypeButton('female', 'Żeński')}
                {renderRoomTypeButton('couple', 'Pary')}
              </View>
            </View>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Liczba miejsc *</Text>
              <TextInput
                value={totalSpaces}
                onChangeText={setTotalSpaces}
                placeholder="np. 4"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="bg-surfaceVariant rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            <View className="bg-surface rounded-lg p-3 border border-primary/30">
              <Text className="text-xs text-muted">
                Zmiana liczby miejsc może wpłynąć na obecne zakwaterowanie i okresy wypowiedzenia.
              </Text>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
              className="bg-primary rounded-lg px-6 py-4 items-center mt-4"
            >
              <Text className="text-background font-semibold text-base">
                {loading ? 'Ładowanie...' : 'Zapisz zmiany'}
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
