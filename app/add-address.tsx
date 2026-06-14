import { ScrollView, Text, View, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Room, Space } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { loadData, saveData } from '@/lib/store';

// Simple UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function AddAddressScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();

  const [name, setName] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [totalRooms, setTotalRooms] = useState('0');
  const [coupleRooms, setCoupleRooms] = useState('0');
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !fullAddress || !companyName || !ownerName || !phone) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    const roomCount = parseInt(totalRooms) || 0;
    if (roomCount <= 0) {
      Alert.alert('Błąd', 'Liczba pokoi musi być więksза niż 0');
      return;
    }

    try {
      setLoading(true);
      const projects = await loadData();
      
      if (projects.length === 0) {
        Alert.alert('Błąd', 'Brak projektów. Proszę najpierw utworzyć projekt.');
        return;
      }

      const rooms: Room[] = [];
      for (let i = 1; i <= roomCount; i++) {
        const roomId = generateUUID();
        const room: Room = {
          id: roomId,
          addressId: '',
          name: `Pokój ${i}`,
          type: 'male',
          totalSpaces: 0,
          spaces: [],
        };
        rooms.push(room);
      }

      const newAddress: Address = {
        id: generateUUID(),
        projectId: projects[0].id,
        name,
        street: fullAddress,
        city: '',
        zipCode: '',
        fullAddress,
        totalSpaces: 0,
        coupleRooms: parseInt(coupleRooms) || 0,
        companyName,
        ownerName,
        phone,
        evictionPeriod: 14,
        totalCost: 0,
        pricePerSpace: 0,
        rooms: rooms.map((r) => ({
          ...r,
          addressId: '',
        })),
        unassignedTenants: [],
        photos: [],
      };

      newAddress.rooms.forEach((room) => {
        room.addressId = newAddress.id;
      });

      projects[0].addresses.push(newAddress);
      await saveData(projects);

      Alert.alert('Sukces', `Adres dodany z ${roomCount} pokojami`);
      router.back();
    } catch (error) {
      console.error('Error adding address:', error);
      Alert.alert('Błąd', 'Nie udało się dodać adresu');
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }: any) => (
    <View className="gap-2 mb-4">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        className="bg-surfaceVariant rounded-lg px-4 py-3 text-foreground"
      />
    </View>
  );

  return (
    <ScreenContainer className="p-4 pt-12 pb-20">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-3 mb-6">
            <Pressable
              onPress={() => router.back()}
              className="bg-surfaceVariant rounded-full p-2"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground flex-1">Dodaj adres</Text>
          </View>

          <Card className="p-6 gap-4">
            <FormField
              label="Nazwa adresu *"
              value={name}
              onChangeText={setName}
              placeholder="np. Apartamenty Centrum"
            />

            <FormField
              label="Pełny adres *"
              value={fullAddress}
              onChangeText={setFullAddress}
              placeholder="ul. Główna 123, Warszawa"
              multiline
            />

            <FormField
              label="Liczba pokoi *"
              value={totalRooms}
              onChangeText={setTotalRooms}
              placeholder="4"
              keyboardType="number-pad"
            />

            <FormField
              label="Pokoje dla par (opcjonalnie)"
              value={coupleRooms}
              onChangeText={setCoupleRooms}
              placeholder="0"
              keyboardType="number-pad"
            />

            <FormField
              label="Nazwa firmy *"
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="np. Zarządzanie Nieruchomościami Sp. z o.o."
            />

            <FormField
              label="Imię i nazwisko właściciela *"
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Jan Kowalski"
            />

            <FormField
              label="Numer telefonu *"
              value={phone}
              onChangeText={setPhone}
              placeholder="+48 123 456 789"
            />

            <View className="bg-surface rounded-lg p-3 border border-primary/30">
              <Text className="text-xs text-muted">
                💡 Po utworzeniu adresu pojawi się {totalRooms || '0'} pokoi: Pokój 1, Pokój 2, itd. Możesz je edytować lub usuwać.
              </Text>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => ({
                opacity: pressed ? 0.9 : 1,
              })}
              className="bg-primary rounded-lg px-6 py-4 items-center mt-4"
            >
              <Text className="text-background font-semibold text-base">
                {loading ? 'Ładowanie...' : 'Dodaj adres'}
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
