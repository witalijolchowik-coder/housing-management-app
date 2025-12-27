import { useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TextInput, ScrollView, Pressable, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Gender, Tenant } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { loadData, saveData } from '@/lib/store';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function AddTenantScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId } = useLocalSearchParams();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthYear, setBirthYear] = useState(new Date().getFullYear() - 30);
  const [checkInDate, setCheckInDate] = useState('');
  const [workStartDate, setWorkStartDate] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !checkInDate || !monthlyPrice.trim()) {
      Alert.alert('Błąd', 'Proszę wypełnić wszystkie wymagane pola');
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

      // Create new tenant WITHOUT room assignment
      const newTenant: Tenant = {
        id: generateUUID(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        birthYear,
        checkInDate,
        workStartDate: workStartDate || undefined,
        monthlyPrice: parseFloat(monthlyPrice) || 0,
      };

      // Tenant is added without space assignment (spaceId is undefined)
      // It will appear in the tenant list with status "Bez miejsca"
      // User can later assign it to a space from the Pokoje tab

      await saveData(projects);
      Alert.alert('Sukces', `Mieszkaniec "${firstName} ${lastName}" dodany bez miejsca`);
      router.back();
    } catch (error) {
      console.error('Error adding tenant:', error);
      Alert.alert('Błąd', 'Nie udało się dodać mieszkańca');
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, gender, birthYear, checkInDate, workStartDate, monthlyPrice, projectId, addressId]);

  const FormField = useCallback(({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', editable = true }: any) => (
    <View className="gap-2 mb-4">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        editable={editable}
        className="bg-surfaceVariant rounded-lg px-4 py-3 text-foreground"
      />
    </View>
  ), [colors]);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - 80 + i);

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
          {/* First Name */}
          <FormField
            label="Imię *"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="np. Jan"
          />

          {/* Last Name */}
          <FormField
            label="Nazwisko *"
            value={lastName}
            onChangeText={setLastName}
            placeholder="np. Kowalski"
          />

          {/* Gender */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">Płeć *</Text>
            <View className="flex-row gap-3">
              {(['male', 'female'] as const).map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setGender(g)}
                  className={`flex-1 rounded-lg py-3 items-center ${
                    gender === g ? 'bg-primary' : 'bg-surfaceVariant'
                  }`}
                >
                  <Text className={gender === g ? 'text-white font-semibold' : 'text-foreground'}>
                    {g === 'male' ? 'Mężczyzna' : 'Kobieta'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Birth Year Picker */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">Rok urodzenia</Text>
            <View className="bg-surfaceVariant rounded-lg overflow-hidden">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8 }}
                className="py-2"
              >
                {yearOptions.map((year) => (
                  <Pressable
                    key={year}
                    onPress={() => setBirthYear(year)}
                    className={`px-3 py-2 rounded-lg mx-1 ${
                      birthYear === year ? 'bg-primary' : 'bg-surface'
                    }`}
                  >
                    <Text className={birthYear === year ? 'text-white font-semibold' : 'text-foreground'}>
                      {year}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>

          {/* Check-in Date */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">Data zamelowania *</Text>
            <DatePicker
              value={checkInDate}
              onChange={setCheckInDate}
              placeholder="Wybierz datę"
            />
          </View>

          {/* Work Start Date */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">Data rozpoczęcia pracy</Text>
            <DatePicker
              value={workStartDate}
              onChange={setWorkStartDate}
              placeholder="Wybierz datę (opcjonalnie)"
            />
          </View>

          {/* Monthly Price */}
          <FormField
            label="Cena miesięczna (zł) *"
            value={monthlyPrice}
            onChangeText={setMonthlyPrice}
            placeholder="np. 500"
            keyboardType="decimal-pad"
          />

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className={`rounded-lg py-3 items-center mt-4 ${
              loading ? 'bg-muted' : 'bg-primary'
            }`}
          >
            <Text className="text-white font-semibold">
              {loading ? 'Dodawanie...' : 'Dodaj mieszkańca'}
            </Text>
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
