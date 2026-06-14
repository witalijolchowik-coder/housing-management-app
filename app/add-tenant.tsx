import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, TextInput, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useColors } from '@/hooks/use-colors';
import { Gender, Tenant } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { loadData, saveData } from '@/lib/store';

const generateUUID = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0;
  const v = c === 'x' ? r : (r & 0x3) | 0x8;
  return v.toString(16);
});

export default function AddTenantScreen() {
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, tenantId } = useLocalSearchParams();
  const isEditing = !!tenantId;
  const yearScrollViewRef = useRef<ScrollView>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthYear, setBirthYear] = useState(1995);
  const [checkInDate, setCheckInDate] = useState('');
  const [workStartDate, setWorkStartDate] = useState('');
  const [workEndDate, setWorkEndDate] = useState('');
  const [status, setStatus] = useState<Tenant['status']>('active');
  const [monthlyPrice, setMonthlyPrice] = useState('0');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 100 }, (_, i) => currentYear - 80 + i);

  useEffect(() => {
    if (isEditing) loadTenantData();
  }, [isEditing, tenantId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const index = yearOptions.indexOf(birthYear);
      if (yearScrollViewRef.current && index !== -1) {
        yearScrollViewRef.current.scrollTo({ x: index * 54, animated: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [birthYear]);

  const findTenant = async (): Promise<{ projects: Awaited<ReturnType<typeof loadData>>; tenant?: Tenant }> => {
    const projects = await loadData();
    const project = projects.find((p) => p.id === projectId);
    const address = project?.addresses.find((a) => a.id === addressId);
    if (!address) return { projects };

    const unassigned = address.unassignedTenants.find((tenant) => tenant.id === tenantId);
    if (unassigned) return { projects, tenant: unassigned };

    for (const room of address.rooms) {
      const space = room.spaces.find((item) => item.tenant?.id === tenantId);
      if (space?.tenant) return { projects, tenant: space.tenant };
    }

    return { projects };
  };

  const loadTenantData = async () => {
    try {
      const { tenant } = await findTenant();
      if (!tenant) return;
      setFirstName(tenant.firstName);
      setLastName(tenant.lastName);
      setGender(tenant.gender);
      setBirthYear(tenant.birthYear);
      setCheckInDate(tenant.checkInDate);
      setWorkStartDate(tenant.workStartDate || '');
      setWorkEndDate(tenant.workEndDate || '');
      setStatus(tenant.status || 'active');
      setMonthlyPrice(tenant.monthlyPrice.toString());
      setPhone(tenant.phone || '');
    } catch (error) {
      console.error('Error loading tenant data:', error);
    }
  };

  const tenantPayload = (): Omit<Tenant, 'id'> => ({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    gender,
    birthYear,
    checkInDate,
    workStartDate: workStartDate || undefined,
    workEndDate: workEndDate || undefined,
    status,
    monthlyPrice: parseFloat(monthlyPrice) || 0,
    phone: phone.trim() || undefined,
    residenceHistory: [],
  });

  const handleSubmit = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim() || !checkInDate) {
      Alert.alert('Błąd', 'Wypełnij imię, nazwisko i datę zameldowania.');
      return;
    }

    try {
      setLoading(true);
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      const address = project?.addresses.find((a) => a.id === addressId);

      if (!project || !address) {
        Alert.alert('Błąd', 'Nie znaleziono projektu albo adresu.');
        return;
      }

      if (isEditing) {
        let updated = false;
        const payload = tenantPayload();
        const unassignedIndex = address.unassignedTenants.findIndex((tenant) => tenant.id === tenantId);

        if (unassignedIndex !== -1) {
          address.unassignedTenants[unassignedIndex] = {
            ...address.unassignedTenants[unassignedIndex],
            ...payload,
            residenceHistory: address.unassignedTenants[unassignedIndex].residenceHistory || [],
          };
          updated = true;
        }

        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.tenant?.id === tenantId) {
              space.tenant = {
                ...space.tenant,
                ...payload,
                spaceId: space.id,
                residenceHistory: space.tenant.residenceHistory || [],
              };
              updated = true;
            }
          }
        }

        if (!updated) {
          Alert.alert('Błąd', 'Nie znaleziono mieszkańca.');
          return;
        }

        await saveData(projects);
        Alert.alert('Sukces', 'Dane mieszkańca zostały zapisane.');
      } else {
        address.unassignedTenants.push({
          id: generateUUID(),
          ...tenantPayload(),
        });
        await saveData(projects);
        Alert.alert('Sukces', 'Mieszkaniec został dodany bez przypisanego miejsca.');
      }

      router.back();
    } catch (error) {
      console.error('Error saving tenant:', error);
      Alert.alert('Błąd', 'Nie udało się zapisać mieszkańca.');
    } finally {
      setLoading(false);
    }
  }, [firstName, lastName, gender, birthYear, checkInDate, workStartDate, workEndDate, status, monthlyPrice, phone, projectId, addressId, isEditing, tenantId]);

  const FormField = useCallback(({ label, value, onChangeText, placeholder, keyboardType = 'default' }: any) => (
    <View className="gap-2 mb-4">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        className="bg-surfaceVariant rounded-lg px-4 py-3 text-foreground"
      />
    </View>
  ), [colors]);

  return (
    <ScreenContainer className="p-4 pt-12 pb-20">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-3 mb-6">
            <Pressable onPress={() => router.back()} className="bg-surfaceVariant rounded-full p-2">
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground flex-1">
              {isEditing ? 'Edytuj mieszkańca' : 'Dodaj mieszkańca'}
            </Text>
          </View>

          <Card className="p-6 gap-4">
            <FormField label="Imię *" value={firstName} onChangeText={setFirstName} placeholder="np. Jan" />
            <FormField label="Nazwisko *" value={lastName} onChangeText={setLastName} placeholder="np. Kowalski" />

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Płeć *</Text>
              <View className="flex-row gap-3">
                {(['male', 'female'] as const).map((item) => (
                  <Pressable key={item} onPress={() => setGender(item)} className={`flex-1 rounded-lg py-3 items-center ${gender === item ? 'bg-primary' : 'bg-surfaceVariant'}`}>
                    <Text className={gender === item ? 'text-white font-semibold' : 'text-foreground'}>
                      {item === 'male' ? 'Mężczyzna' : 'Kobieta'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Rok urodzenia</Text>
              <View className="bg-surfaceVariant rounded-lg overflow-hidden">
                <ScrollView ref={yearScrollViewRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }} className="py-2">
                  {yearOptions.map((year) => (
                    <Pressable key={year} onPress={() => setBirthYear(year)} className={`px-3 py-2 rounded-lg mx-1 ${birthYear === year ? 'bg-primary' : 'bg-surface'}`}>
                      <Text className={birthYear === year ? 'text-white font-semibold' : 'text-foreground'}>{year}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <FormField label="Telefon" value={phone} onChangeText={setPhone} placeholder="np. +48 123 456 789" keyboardType="phone-pad" />

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Data zameldowania *</Text>
              <DatePicker value={checkInDate} onChange={setCheckInDate} placeholder="Wybierz datę" />
            </View>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Data rozpoczęcia pracy</Text>
              <DatePicker value={workStartDate} onChange={setWorkStartDate} placeholder="Wybierz datę (opcjonalnie)" />
            </View>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Data zakończenia pracy</Text>
              <DatePicker value={workEndDate} onChange={setWorkEndDate} placeholder="Wybierz datę (opcjonalnie)" />
            </View>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-semibold text-foreground">Status</Text>
              <View className="flex-row gap-3">
                {[
                  { value: 'active' as const, label: 'Aktywny' },
                  { value: 'do_wymeldowania' as const, label: 'Do wymeldowania' },
                ].map((option) => (
                  <Pressable key={option.value} onPress={() => setStatus(option.value)} className={`flex-1 rounded-lg py-3 items-center ${status === option.value ? 'bg-primary' : 'bg-surfaceVariant'}`}>
                    <Text className={status === option.value ? 'text-white font-semibold' : 'text-foreground'}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <FormField label="Cena miesięczna (zł) *" value={monthlyPrice} onChangeText={setMonthlyPrice} placeholder="np. 500" keyboardType="decimal-pad" />

            <Pressable onPress={handleSubmit} disabled={loading} className={`rounded-lg py-3 items-center mt-4 ${loading ? 'bg-muted' : 'bg-primary'}`}>
              <Text className="text-white font-semibold">
                {loading ? 'Zapisywanie...' : (isEditing ? 'Zapisz zmiany' : 'Dodaj mieszkańca')}
              </Text>
            </Pressable>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
