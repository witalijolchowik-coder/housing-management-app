import { ScrollView, Text, View, FlatList, Pressable, SectionList } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Tenant } from '@/types';
import { loadData, saveData } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

interface TenantSection {
  title: string;
  data: (Tenant & { currentRoom?: string })[];
}

export default function SelectTenantScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, roomId } = useLocalSearchParams();
  const [address, setAddress] = useState<Address | null>(null);
  const [sections, setSections] = useState<TenantSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTenants();
  }, [projectId, addressId]);

  const loadTenants = async () => {
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          setAddress(addr);
          
          // Organize tenants into sections
          const withoutRoom: (Tenant & { currentRoom?: string })[] = [];
          const withRoom: (Tenant & { currentRoom?: string })[] = [];

          for (const room of addr.rooms) {
            for (const space of room.spaces) {
              if (space.tenant) {
                const tenantWithRoom = { ...space.tenant, currentRoom: room.name };
                withRoom.push(tenantWithRoom);
              }
            }
          }

          // Find tenants without rooms
          const allTenantsInRooms = new Set(withRoom.map((t) => t.id));
          for (const room of addr.rooms) {
            for (const space of room.spaces) {
              if (space.tenant && !allTenantsInRooms.has(space.tenant.id)) {
                withoutRoom.push(space.tenant);
              }
            }
          }

          // Actually, we need to check all tenants in the address
          // Let's rebuild this logic
          const allTenants = new Map<string, Tenant>();
          const tenantsWithRooms = new Map<string, string>(); // tenantId -> roomName

          for (const room of addr.rooms) {
            for (const space of room.spaces) {
              if (space.tenant) {
                allTenants.set(space.tenant.id, space.tenant);
                tenantsWithRooms.set(space.tenant.id, room.name);
              }
            }
          }

          const withoutRoomList = Array.from(allTenants.values())
            .filter((t) => !tenantsWithRooms.has(t.id))
            .map((t) => ({ ...t }));

          const withRoomList = Array.from(allTenants.values())
            .filter((t) => tenantsWithRooms.has(t.id))
            .map((t) => ({ ...t, currentRoom: tenantsWithRooms.get(t.id) }));

          setSections([
            {
              title: 'Bez komnat',
              data: withoutRoomList,
            },
            {
              title: 'Już zaseleni',
              data: withRoomList,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !address) {
    return (
      <ScreenContainer>
        <Text className="text-muted">{t.common.loading}</Text>
      </ScreenContainer>
    );
  }

  const handleSelectTenant = async (tenant: Tenant) => {
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          const room = addr.rooms.find((r) => r.id === roomId);
          if (room) {
            // First, remove tenant from any other space in this address
            for (const r of addr.rooms) {
              for (const space of r.spaces) {
                if (space.tenant?.id === tenant.id) {
                  space.tenant = null;
                }
              }
            }

            // Then, find the first available space in the target room and assign tenant
            const availableSpace = room.spaces.find((s) => !s.tenant);
            if (availableSpace) {
              availableSpace.tenant = tenant;
              await saveData(projects);
              router.back();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error assigning tenant:', error);
    }
  };

  const renderTenantItem = ({ item }: { item: Tenant & { currentRoom?: string } }) => (
    <Pressable
      onPress={() => handleSelectTenant(item)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Card className="p-4 mb-2 flex-row gap-3 items-center justify-between">
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-foreground">
            {item.firstName} {item.lastName}
          </Text>
          <Text className="text-xs text-muted">
            {item.checkInDate}
          </Text>
          {item.currentRoom && (
            <Text className="text-xs text-primary font-semibold">
              Pokój {item.currentRoom}
            </Text>
          )}
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={colors.primary} />
      </Card>
    </Pressable>
  );

  const renderSectionHeader = ({ section }: { section: TenantSection }) => (
    <View className="bg-surface px-4 py-2 mt-4 mb-2 rounded-lg">
      <Text className="text-sm font-bold text-muted uppercase">{section.title}</Text>
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <Pressable onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground flex-1">Wybierz mieszkańca</Text>
      </View>

      {/* Tenants List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderTenantItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-8">
            <Text className="text-muted">Brak mieszkańców w tym adresie</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
