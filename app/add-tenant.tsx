import { ScrollView, Text, View, Pressable, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Gender, Tenant } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { loadData, saveData } from '@/lib/store';

export default function AddTenantScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId } = useLocalSearchParams();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthYear, setBirthYear] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [workStartDate, setWorkStartDate] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');

  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !checkInDate || !monthlyPrice.trim()) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie wymagane pola');
      return;
    }

    try {
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

      // Create new tenant
      const newTenant: Tenant = {
        id: generateUUID(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthYear: birthYear.trim() ? parseInt(birthYear.trim()) : new Date().getFullYear() - 30,
        checkInDate,
        workStartDate: workStartDate || undefined,
        monthlyPrice: parseFloat(monthlyPrice) || 0,
      };

      // Add tenant to first available space in address
      let assigned = false;
      for (const room of address.rooms) {
        for (const space of room.spaces) {
          if (!space.tenant) {
            space.tenant = newTenant;
            assigned = true;
            break;
          }
        }
        if (assigned) break;
      }

      await saveData(projects);
      Alert.alert('Sukces', assigned ? 'Mieszkaniec dodany i przydzielony do pokoju' : 'Mieszkaniec dodany (brak wolnych miejsc)');
      router.back();
    } catch (error) {
      console.error('Error adding tenant:', error);
      Alert.alert('Błąd', 'Nie udało się dodać mieszkańca');
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
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="bg-surfaceVariant rounded-full p-2"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground flex-1">Dodaj mieszkańca</Text>
        </View>

        {/* Form */}
        <Card className="p-6 gap-4">
          {/* Name Fields */}
          <FormField
            label="Imię"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Jan"
          />
          <FormField
            label="Nazwisko"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Kowalski"
          />

          {/* Gender Selection - Only Male/Female */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">Płeć</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setGender('male')}
                className={`flex-1 rounded-lg py-3 items-center ${
                  gender === 'male' ? 'bg-primary' : 'bg-surface border border-border'
                }`}
              >
                <Text className={`font-semibold ${gender === 'male' ? 'text-background' : 'text-foreground'}`}>
                  ♂ Mężczyzna
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setGender('female')}
                className={`flex-1 rounded-lg py-3 items-center ${
                  gender === 'female' ? 'bg-primary' : 'bg-surface border border-border'
                }`}
              >
                <Text className={`font-semibold ${gender === 'female' ? 'text-background' : 'text-foreground'}`}>
                  ♀ Kobieta
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Birth Year */}
          <FormField
            label="Rok urodzenia (opcjonalnie)"
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder="1990"
            keyboardType="number-pad"
          />

          {/* Check-in Date - Required */}
          <DatePicker
            value={checkInDate}
            onChange={setCheckInDate}
            label="Data zamelowania *"
            placeholder="Wybierz datę"
          />

          {/* Work Start Date - Optional */}
          <DatePicker
            value={workStartDate}
            onChange={setWorkStartDate}
            label="Data rozpoczęcia pracy (opcjonalnie)"
            placeholder="Wybierz datę"
          />

          {/* Monthly Price */}
          <FormField
            label="Cena miesięczna (zł) *"
            value={monthlyPrice}
            onChangeText={setMonthlyPrice}
            placeholder="500"
            keyboardType="decimal-pad"
          />

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
            className="bg-primary rounded-lg px-6 py-4 items-center mt-4"
          >
            <Text className="text-background font-semibold text-base">Dodaj mieszkańca</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
