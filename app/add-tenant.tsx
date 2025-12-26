import { ScrollView, Text, View, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Gender } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddTenantScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, roomId } = useLocalSearchParams();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthYear, setBirthYear] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [workStartDate, setWorkStartDate] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState('');

  const handleSubmit = async () => {
    if (!firstName || !lastName || !checkInDate || !monthlyPrice) {
      alert(t.messages.savingError);
      return;
    }

    try {
      // TODO: Implement tenant check-in logic
      console.log('Check-in tenant:', {
        firstName,
        lastName,
        gender,
        birthYear,
        checkInDate,
        workStartDate,
        monthlyPrice,
      });
      router.back();
    } catch (error) {
      console.error('Error checking in tenant:', error);
      alert(t.messages.savingError);
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
          <Text className="text-2xl font-bold text-foreground flex-1">{t.forms.addTenant}</Text>
        </View>

        {/* Form */}
        <Card className="p-6 gap-4">
          {/* Name Fields */}
          <FormField
            label={t.resident.firstName}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t.resident.firstName}
          />
          <FormField
            label={t.resident.lastName}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t.resident.lastName}
          />

          {/* Gender Selection */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">{t.resident.gender}</Text>
            <View className="flex-row gap-2">
              <Chip
                label="♂"
                selected={gender === 'male'}
                onPress={() => setGender('male')}
              />
              <Chip
                label="♀"
                selected={gender === 'female'}
                onPress={() => setGender('female')}
              />
              <Chip
                label={t.resident.other}
                selected={gender === 'other'}
                onPress={() => setGender('other')}
              />
            </View>
          </View>

          {/* Birth Year */}
          <FormField
            label={t.resident.birthYear}
            value={birthYear}
            onChangeText={setBirthYear}
            placeholder="1990"
          />

          {/* Check-in Date */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">{t.resident.checkInDate}</Text>
            <Pressable className="bg-surfaceVariant rounded-lg px-4 py-3 flex-row items-center justify-between">
              <Text className="text-foreground">{checkInDate || t.common.loading}</Text>
              <MaterialIcons name="calendar-month" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {/* Work Start Date (Optional) */}
          <View className="gap-2 mb-4">
            <Text className="text-sm font-semibold text-foreground">{t.resident.workStartDate}</Text>
            <Pressable className="bg-surfaceVariant rounded-lg px-4 py-3 flex-row items-center justify-between">
              <Text className="text-muted">{workStartDate || t.common.loading}</Text>
              <MaterialIcons name="calendar-month" size={20} color={colors.primary} />
            </Pressable>
          </View>

          {/* Monthly Price */}
          <FormField
            label={t.resident.monthlyPrice}
            value={monthlyPrice}
            onChangeText={setMonthlyPrice}
            placeholder="500"
          />

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => ({
              opacity: pressed ? 0.9 : 1,
            })}
            className="bg-primary rounded-lg px-6 py-4 items-center mt-4"
          >
            <Text className="text-foreground font-semibold text-base">{t.resident.checkIn}</Text>
          </Pressable>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}
