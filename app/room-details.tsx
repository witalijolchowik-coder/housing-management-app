import { ScrollView, Text, View, FlatList, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Room, Space } from '@/types';
import { loadData, getDaysRemaining, isOverdue } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

export default function RoomDetailsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, roomId } = useLocalSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoom();
  }, [projectId, addressId, roomId]);

  const loadRoom = async () => {
    try {
      setLoading(true);
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const address = project.addresses.find((a) => a.id === addressId);
        if (address) {
          const foundRoom = address.rooms.find((r) => r.id === roomId);
          if (foundRoom) {
            setRoom(foundRoom);
          }
        }
      }
    } catch (error) {
      console.error('Error loading room:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !room) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      </ScreenContainer>
    );
  }

  const roomTypeLabel = {
    male: `♂ ${t.roomDetails.male}`,
    female: `♀ ${t.roomDetails.female}`,
    couple: `♡ ${t.roomDetails.couple}`,
  };

  const getSpaceStatusColor = (space: Space) => {
    switch (space.status) {
      case 'vacant':
        return colors.success;
      case 'occupied':
        return colors.occupied;
      case 'wypowiedzenie':
        return colors.warning;
      case 'conflict':
      case 'overdue':
        return colors.error;
      default:
        return colors.muted;
    }
  };

  const renderSpaceCard = ({ item }: { item: Space }) => {
    const getSpaceContent = () => {
      if (item.status === 'vacant') {
        return {
          title: t.roomDetails.vacant,
          subtitle: '',
          badge: 'success',
        };
      }

      if (item.status === 'occupied' && item.tenant) {
        return {
          title: `${item.tenant.firstName} ${item.tenant.lastName}`,
          subtitle: item.tenant.checkInDate,
          badge: 'info',
        };
      }

      if (item.status === 'wypowiedzenie' && item.wypowiedzenie) {
        const daysLeft = getDaysRemaining(item.wypowiedzenie.endDate);
        return {
          title: item.tenant
            ? `${item.tenant.firstName} ${item.tenant.lastName}`
            : t.roomDetails.vacant,
          subtitle: `${t.checkout.daysRemaining}: ${daysLeft}`,
          badge: 'warning',
          progress: true,
          progressValue: Math.max(0, (daysLeft / 14) * 100),
        };
      }

      if (item.status === 'conflict') {
        return {
          title: `KONFLIKT: ${item.tenant?.firstName || ''}`,
          subtitle: t.roomDetails.conflict,
          badge: 'error',
        };
      }

      if (item.status === 'overdue') {
        return {
          title: item.tenant
            ? `${item.tenant.firstName} ${item.tenant.lastName}`
            : t.roomDetails.vacant,
          subtitle: t.roomDetails.overdue,
          badge: 'error',
        };
      }

      return {
        title: t.common.loading,
        subtitle: '',
        badge: 'default',
      };
    };

    const content = getSpaceContent();

    return (
      <Card className="p-4 mb-3">
        <View className="gap-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">{content.title}</Text>
              {content.subtitle && (
                <Text className="text-sm text-muted mt-1">{content.subtitle}</Text>
              )}
            </View>
            <Badge variant={content.badge as any} size="sm" label={`${t.roomDetails.title} ${item.number}`} />
          </View>

          {content.progress && (
            <ProgressBar progress={content.progressValue || 0} color="bg-warning" />
          )}

          {item.status === 'conflict' && (
            <Pressable className="bg-error rounded-lg px-4 py-2 items-center">
              <Text className="text-foreground font-semibold text-sm">{t.roomDetails.checkout}</Text>
            </Pressable>
          )}
        </View>
      </Card>
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
        <View className="flex-1">
          <Text className="text-2xl font-bold text-foreground">
            {t.roomDetails.title} {room.number}
          </Text>
          <Text className="text-sm text-muted mt-1">{roomTypeLabel[room.type]}</Text>
        </View>
      </View>

      {/* Spaces List */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {room.spaces.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">{t.messages.emptyRoom}</Text>
          </View>
        ) : (
          <FlatList
            data={room.spaces}
            renderItem={renderSpaceCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
