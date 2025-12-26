import { View, Text, ScrollView, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function SearchScreen() {
  const t = useTranslations();
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ScreenContainer className="p-4">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-4">
          <Text className="text-2xl font-bold text-foreground">{t.search.title}</Text>
          
          {/* Search Input */}
          <View className="flex-row items-center bg-surfaceVariant rounded-full px-4 py-3 gap-2">
            <MaterialIcons name="search" size={20} color={colors.muted} />
            <TextInput
              placeholder={t.search.placeholder}
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 text-foreground"
            />
          </View>

          {/* Results Placeholder */}
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted">
              {searchQuery ? t.search.noResults : t.common.loading}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
