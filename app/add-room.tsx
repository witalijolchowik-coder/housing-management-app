import { ScrollView, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Room, RoomType } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { loadData, saveData } from '@/lib/store';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function AddRoomScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId } = useLocalSearchParams();

  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('male');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!roomName.trim()) {
      Alert.alert('Błąd', 'Proszę wpisać nazwę pokoju');
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

      // Create new room
      const newRoom: Room = {
        id: generateUUID(),
        addressId: addressId as string,
        name: roomName.trim(),
        type: roomType,
        totalSpaces: 0,
        spaces: [],
      };

      address.rooms.push(newRoom);
      await saveData(projects);

      Alert.alert('Sukces', `Pokój "${roomName}" dodany pomyślnie`);
      router.back();
    } catch (error) {
      console.error('Error adding room:', error);
      Alert.alert('Błąd', 'Nie udało się dodać pokoju');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="bg-surfaceVariant rounded-full p-2"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground flex-1">Dodaj pokój</Text>
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
                  ♂ Mężczyźni
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setRoomType('female')}
                className={`flex-1 rounded-lg py-3 items-center ${
                  roomType === 'female' ? 'bg-primary' : 'bg-surface border border-border'
                }`}
              >
                <Text className={`font-semibold ${roomType === 'female' ? 'text-background' : 'text-foreground'}`}>
                  ♀ Kobiety
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

          {/* Info Box */}
          <View className="bg-surface rounded-lg p-3 border border-primary/30">
            <Text className="text-xs text-muted">
              💡 Po utworzeniu pokoju będziesz mógł dodawać do niego miejsca (łóżka).
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
              {loading ? 'Ładowanie...' : 'Dodaj pokój'}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
