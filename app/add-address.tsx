import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
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
  const [coupleRooms, setCoupleRooms] = useState('0');
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !fullAddress || !companyName || !ownerName || !phone) {
      alert(t.messages.savingError);
      return;
    }

    try {
      setLoading(true);
      const projects = await loadData();
      
      // Add to first project (or create if none exists)
      if (projects.length === 0) {
        alert('Brak projektów. Proszę najpierw utworzyć projekt.');
        return;
      }

      const newAddress: any = {
        id: generateUUID(),
        projectId: projects[0].id,
        name,
        fullAddress,
        totalSpaces: 0,
        coupleRooms: parseInt(coupleRooms) || 0,
        companyName,
        ownerName,
        phone,
        evictionPeriod: 14,
        totalCost: 0,
        pricePerSpace: 0,
        rooms: [],
        photos: [],
      };

      projects[0].addresses.push(newAddress);
      await saveData(projects);

      router.back();
    } catch (error) {
      console.error('Error adding address:', error);
      alert(t.messages.savingError);
    } finally {
      setLoading(false);
    }
  };

  const FormField = ({ label, value, onChangeText, placeholder, multiline = false }: any) => (
    <View className="gap-2 mb-4">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        className="bg-surfaceVariant rounded-lg px-4 py-3 text-foreground"
      />
    </View>
  );

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
          <Text className="text-2xl font-bold text-foreground flex-1">{t.addressList.addNewAddress}</Text>
        </View>

        {/* Form */}
        <Card className="p-6 gap-4">
          <FormField
            label={t.addressList.title}
            value={name}
            onChangeText={setName}
            placeholder="np. Apartamenty Centrum"
          />

          <FormField
            label="Pełny adres"
            value={fullAddress}
            onChangeText={setFullAddress}
            placeholder="ul. Główna 123, Warszawa"
            multiline
          />

          <FormField
            label={t.addressList.coupleRooms}
            value={coupleRooms}
            onChangeText={setCoupleRooms}
            placeholder="0"
          />

          <FormField
            label="Nazwa firmy"
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="np. Zarządzanie Nieruchomościami Sp. z o.o."
          />

          <FormField
            label="Imię i nazwisko właściciela"
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Jan Kowalski"
          />

          <FormField
            label="Numer telefonu"
            value={phone}
            onChangeText={setPhone}
            placeholder="+48 123 456 789"
          />

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
            className="bg-primary rounded-lg px-6 py-4 items-center mt-4"
          >
            <Text className="text-foreground font-semibold text-base">
              {loading ? t.common.loading : t.common.save}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
