import { ScrollView, Text, View, FlatList, Pressable, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FAB } from '@/components/ui/fab';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, SpaceStats } from '@/types';
import { loadData, calculateAddressStats } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddressListScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, [projectId]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setAddresses(project.addresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAddressCard = ({ item }: { item: Address }) => {
    const stats = calculateAddressStats(item);
    const occupancyPercent = stats.total > 0 
      ? Math.round(((stats.occupied + stats.wypowiedzenie) / stats.total) * 100)
      : 0;
    const hasEvictions = stats.wypowiedzenie > 0;
    const hasConflicts = stats.conflict > 0;
    const hasOverdue = stats.overdue > 0;

    return (
      <Pressable
        onPress={() => router.push({
          pathname: '/address-details',
          params: { projectId, addressId: item.id },
        })}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Card className="p-4 mb-4 overflow-hidden">
          <View className="gap-3">
            {/* Photo and Header */}
            <View className="flex-row gap-3">
              <View className="w-20 h-20 rounded-lg bg-surfaceVariant items-center justify-center">
                {item.photos && item.photos.length > 0 ? (
                  <Image
                    source={{ uri: item.photos[0] }}
                    className="w-full h-full rounded-lg"
                  />
                ) : (
                  <MaterialIcons name="image" size={32} color={colors.muted} />
                )}
              </View>
              <View className="flex-1 justify-between">
                <View>
                  <Text className="text-base font-bold text-foreground">{item.name}</Text>
                  <Text className="text-xs text-muted mt-1">{item.fullAddress}</Text>
                </View>
                <View className="flex-row gap-1">
                  {item.coupleRooms > 0 && (
                    <Badge variant="info" size="sm" label={`${item.coupleRooms} ♡`} />
                  )}
                </View>
              </View>
            </View>

            {/* Statistics */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">
                  {stats.occupied + stats.wypowiedzenie}/{stats.total} {t.addressList.occupied}
                </Text>
                <Text className="text-sm font-semibold text-primary">{occupancyPercent}%</Text>
              </View>
              <ProgressBar progress={occupancyPercent} />
            </View>

            {/* Badges */}
            <View className="flex-row flex-wrap gap-2">
              {hasEvictions && (
                <Badge variant="warning" size="sm" label={`${stats.wypowiedzenie} ${t.roomDetails.eviction}`} />
              )}
              {hasConflicts && (
                <Badge variant="error" size="sm" label={`${stats.conflict} ${t.roomDetails.conflict}`} />
              )}
              {hasOverdue && (
                <Badge variant="error" size="sm" label={`${stats.overdue} ${t.roomDetails.overdue}`} />
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-6">
        <Pressable
          onPress={() => router.back()}
          className="bg-surfaceVariant rounded-full p-2"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground flex-1">{t.addressList.title}</Text>
        <Pressable className="bg-surfaceVariant rounded-full p-2">
          <MaterialIcons name="more-vert" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <Pressable className="bg-surfaceVariant rounded-full px-4 py-3 mb-6 flex-row items-center gap-2">
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <Text className="text-muted text-sm">{t.common.search}</Text>
      </Pressable>

      {/* Addresses List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.messages.emptyAddress}</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* FAB */}
      <FAB icon="add" onPress={() => router.push('/address-list')} />
    </ScreenContainer>
  );
}
