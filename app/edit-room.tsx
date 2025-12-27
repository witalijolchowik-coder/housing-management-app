import { ScrollView, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Room, RoomType } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { loadData, saveData } from '@/lib/store';

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
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        const address = project.addresses.find((a) => a.id === addressId);
        if (!address) return;

        const foundRoom = address.rooms.find((r) => r.id === roomId);
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
      Alert.alert('Błąd', 'Proszę wpisać nazwę pokoju');
      return;
    }

    if (!totalSpaces.trim() || isNaN(parseInt(totalSpaces))) {
      Alert.alert('Błąd', 'Proszę wpisać liczbę miejsc');
      return;
    }

    const spacesCount = parseInt(totalSpaces);
    if (spacesCount <= 0) {
      Alert.alert('Błąd', 'Liczba miejsc musi być większa niż 0');
      return;
    }

    try {
      setLoading(true);
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);

      if (!project) {
        Alert.alert('Błąd', 'Projekt nie znaleziony');
        return;
      }

      const address = project.addresses.find((a) => a.id === addressId);
      if (!address) {
        Alert.alert('Błąd', 'Adres nie znaleziony');
        return;
      }

      const roomToEdit = address.rooms.find((r) => r.id === roomId);
      if (!roomToEdit) {
        Alert.alert('Błąd', 'Pokój nie znaleziony');
        return;
      }

      // Validate total spaces (excluding current room)
      const otherRoomsSpaces = address.rooms
        .filter((r) => r.id !== roomId)
        .reduce((sum, r) => sum + r.totalSpaces, 0);

      if (otherRoomsSpaces + spacesCount > address.totalSpaces) {
        Alert.alert(
          'Błąd',
          `Nie można zmienić pokoju na ${spacesCount} miejsc, ponieważ całkowita liczba miejsc (${otherRoomsSpaces + spacesCount}) przekroczy limit adresu (${address.totalSpaces})`
        );
        return;
      }

      // Update room
      roomToEdit.name = roomName.trim();
      roomToEdit.type = roomType;

      // If space count changed, update spaces array
      if (spacesCount !== roomToEdit.totalSpaces) {
        const oldSpacesCount = roomToEdit.totalSpaces;
        roomToEdit.totalSpaces = spacesCount;

        if (spacesCount > oldSpacesCount) {
          // Add new spaces
          const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;
              return v.toString(16);
            });
          };

          for (let i = oldSpacesCount; i < spacesCount; i++) {
            roomToEdit.spaces.push({
              id: generateUUID(),
              roomId: roomToEdit.id,
              number: i + 1,
              status: 'vacant',
            });
          }
        } else {
          // Remove spaces (only vacant ones from the end)
          const spacesToRemove = oldSpacesCount - spacesCount;
          let removed = 0;
          for (let i = roomToEdit.spaces.length - 1; i >= 0 && removed < spacesToRemove; i--) {
            if (roomToEdit.spaces[i].status === 'vacant' && !roomToEdit.spaces[i].tenant) {
              roomToEdit.spaces.splice(i, 1);
              removed++;
            }
          }

          if (removed < spacesToRemove) {
            Alert.alert(
              'Ostrzeżenie',
              `Nie można zmniejszyć liczby miejsc, ponieważ ${spacesToRemove - removed} miejsc jest zajęte`
            );
            return;
          }
        }
      }

      await saveData(projects);
      Alert.alert('Sukces', `Pokój "${roomName}" zaktualizowany pomyślnie`);
      router.back();
    } catch (error) {
      console.error('Error editing room:', error);
      Alert.alert('Błąd', 'Nie udało się edytować pokoju');
    } finally {
      setLoading(false);
    }
  };

  if (!room) {
    return (
      <ScreenContainer className="p-4 pt-12 pb-20 items-center justify-center">
        <Text className="text-foreground">{t.common.loading}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4 pt-12 pb-20">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="bg-surfaceVariant rounded-full p-2"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground flex-1">Edytuj pokój</Text>
        </View>

        {/* Form */}
        <Card className="p-6 gap-4">
          {/* Room Name */}
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

          {/* Room Type */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">Typ pokoju</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setRoomType('male')}
                className={`flex-1 rounded-lg py-3 items-center ${
                  roomType === 'male' ? 'bg-primary' : 'bg-surface border border-border'
                }`}
              >
                <Text className={`font-semibold ${roomType === 'male' ? 'text-background' : 'text-foreground'}`}>
                  ♂ Mieści
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRoomType('female')}
                className={`flex-1 rounded-lg py-3 items-center ${
                  roomType === 'female' ? 'bg-primary' : 'bg-surface border border-border'
                }`}
              >
                <Text className={`font-semibold ${roomType === 'female' ? 'text-background' : 'text-foreground'}`}>
                  ♀ Żeńskie
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRoomType('couple')}
                className={`flex-1 rounded-lg py-3 items-center ${
                  roomType === 'couple' ? 'bg-primary' : 'bg-surface border border-border'
                }`}
              >
                <Text className={`font-semibold ${roomType === 'couple' ? 'text-background' : 'text-foreground'}`}>
                  ♡ Pary
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Total Spaces */}
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

          {/* Info Box */}
          <View className="bg-surface rounded-lg p-3 border border-primary/30">
            <Text className="text-xs text-muted">
              💡 Zmiana liczby miejsc może wpłynąć na istniejące rezerwacje.
            </Text>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
            className="bg-primary rounded-lg px-6 py-4 items-center mt-4"
          >
            <Text className="text-background font-semibold text-base">
              {loading ? 'Ładowanie...' : 'Zapisz zmiany'}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
