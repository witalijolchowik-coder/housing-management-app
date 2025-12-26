import { ScrollView, Text, View, FlatList, Pressable, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Room, Tenant } from '@/types';
import { loadData, calculateRoomStats, getDaysRemaining } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

export default function AddressDetailsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId } = useLocalSearchParams();
  const [address, setAddress] = useState<Address | null>(null);
  const [activeTab, setActiveTab] = useState<'residents' | 'rooms'>('residents');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddress();
  }, [projectId, addressId]);

  const loadAddress = async () => {
    try {
      setLoading(true);
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          setAddress(addr);
        }
      }
    } catch (error) {
      console.error('Error loading address:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !address) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const renderResidentCard = ({ item }: { item: Tenant }) => (
    <Pressable
      onPress={() => router.push({
        pathname: '/room-details',
        params: { projectId, addressId, roomId: item.spaceId },
      })}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Card className="p-4 mb-3 flex-row gap-3">
        <View className="w-12 h-12 rounded-full bg-primary items-center justify-center">
          {item.photo ? (
            <Image source={{ uri: item.photo }} className="w-full h-full rounded-full" />
          ) : (
            <Text className="text-foreground font-bold">
              {item.firstName.charAt(0)}{item.lastName.charAt(0)}
            </Text>
          )}
        </View>
        <View className="flex-1 justify-center gap-1">
          <Text className="font-semibold text-foreground">
            {item.firstName} {item.lastName}
          </Text>
          <Text className="text-xs text-muted">{item.checkInDate}</Text>
        </View>
        <View className="justify-center items-end gap-1">
          <Text className="text-sm font-semibold text-foreground">{item.monthlyPrice} zł</Text>
          <Text className="text-xs text-muted">Pokój {item.spaceId}</Text>
        </View>
      </Card>
    </Pressable>
  );

  const renderRoomCard = ({ item }: { item: Room }) => {
    const stats = calculateRoomStats(item);
    const occupancyPercent = stats.total > 0
      ? Math.round(((stats.occupied + stats.wypowiedzenie) / stats.total) * 100)
      : 0;

    const roomTypeLabel = {
      male: `♂ ${t.roomDetails.male}`,
      female: `♀ ${t.roomDetails.female}`,
      couple: `♡ ${t.roomDetails.couple}`,
    };

    return (
      <Pressable
        onPress={() => router.push({
          pathname: '/room-details',
          params: { projectId, addressId, roomId: item.id },
        })}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Card className="p-4 mb-3">
          <View className="gap-3">
            <View className="flex-row justify-between items-start">
              <View>
                <Text className="text-lg font-bold text-foreground">
                  {t.roomDetails.title} {item.name}
                </Text>
                <Badge
                  variant="info"
                  size="sm"
                  label={roomTypeLabel[item.type]}
                  className="mt-2"
                />
              </View>
              <Text className="text-sm text-muted">
                {stats.occupied}/{stats.total}
              </Text>
            </View>

            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-muted">{t.addressList.occupied}</Text>
                <Text className="text-sm font-semibold text-occupied">{stats.occupied}</Text>
              </View>
              <ProgressBar progress={(stats.occupied / stats.total) * 100} color="bg-occupied" />
            </View>

            {stats.wypowiedzenie > 0 && (
              <View className="gap-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-muted">{t.roomDetails.eviction}</Text>
                  <Text className="text-sm font-semibold text-warning">{stats.wypowiedzenie}</Text>
                </View>
                <ProgressBar progress={(stats.wypowiedzenie / stats.total) * 100} color="bg-warning" />
              </View>
            )}


          </View>
        </Card>
      </Pressable>
    );
  };

  const residents = address.rooms.flatMap((room) =>
    room.spaces.filter((space) => space.tenant).map((space) => space.tenant!)
  );

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
        <Text className="text-2xl font-bold text-foreground flex-1">{address.name}</Text>
      </View>

      {/* Tab Bar */}
      <View className="flex-row gap-2 mb-6">
        <Pressable
          onPress={() => setActiveTab('residents')}
          className={`flex-1 py-3 px-4 rounded-full ${
            activeTab === 'residents' ? 'bg-primary' : 'bg-surfaceVariant'
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === 'residents' ? 'text-foreground' : 'text-muted'
            }`}
          >
            {t.addressDetails.residents}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('rooms')}
          className={`flex-1 py-3 px-4 rounded-full ${
            activeTab === 'rooms' ? 'bg-primary' : 'bg-surfaceVariant'
          }`}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === 'rooms' ? 'text-foreground' : 'text-muted'
            }`}
          >
            {t.addressDetails.rooms}
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {activeTab === 'residents' ? (
          <View>
            {residents.length === 0 ? (
              <View className="items-center justify-center py-8">
                <Text className="text-muted">{t.messages.emptyAddress}</Text>
              </View>
            ) : (
              <FlatList
                data={residents}
                renderItem={renderResidentCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : (
          <View>
            {address.rooms.length === 0 ? (
              <View className="items-center justify-center py-8">
                <Text className="text-muted">{t.messages.emptyRoom}</Text>
              </View>
            ) : (
              <FlatList
                data={address.rooms}
                renderItem={renderRoomCard}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
