import { View, Text, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';

export default function CalendarScreen() {
  const t = useTranslations();
  const colors = useColors();

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <Text className="text-2xl font-bold text-foreground">{t.calendar.title}</Text>
          
          {/* Placeholder */}
          <View className="flex-1 items-center justify-center bg-surfaceVariant rounded-2xl p-8">
            <Text className="text-muted text-center">
              {t.common.loading}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
