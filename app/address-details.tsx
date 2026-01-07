import { ScrollView, Text, View, FlatList, Pressable, Image, Modal, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { OccupancyProgress } from '@/components/ui/occupancy-progress';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Room, Tenant, Project, EvictionFormData } from '@/types';
import { loadData, calculateRoomStats, getDaysRemaining, saveData } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { EvictionFormModal } from '@/components/eviction-form-modal';
import { GenderIcon } from '@/components/ui/gender-icon';

export default function AddressDetailsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId } = useLocalSearchParams();
  const [address, setAddress] = useState<Address | null>(null);
  const [activeTab, setActiveTab] = useState<'residents' | 'rooms'>('residents');
  const [loading, setLoading] = useState(true);
  const [tenantMenuVisible, setTenantMenuVisible] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | undefined>(undefined);
  const [roomMenuVisible, setRoomMenuVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | undefined>(undefined);
  const [evictionModalVisible, setEvictionModalVisible] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    loadAddress();
  }, [projectId, addressId]);

  // Reload data when screen becomes active (after returning from add-tenant, etc.)
  useFocusEffect(
    useCallback(() => {
      loadAddress();
    }, [projectId, addressId])
  );

  const loadAddress = async () => {
    try {
      const projects = await loadData();
      const proj = projects.find((p) => p.id === projectId);
      if (proj) {
        setProject(proj);
        const addr = proj.addresses.find((a) => a.id === addressId);
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
      <ScreenContainer>
        <Text className="text-muted">{t.common.loading}</Text>
      </ScreenContainer>
    );
  }

  const getRoomName = (spaceId: string | undefined): string => {
    if (!spaceId) return 'Unknown';
    for (const room of address?.rooms || []) {
      const space = room.spaces.find((s) => s.id === spaceId);
      if (space) {
        return room.name;
      }
    }
    return 'Unknown';
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!address) return;
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          // Remove from unassignedTenants if present
          addr.unassignedTenants = addr.unassignedTenants.filter((t) => t.id !== tenant.id);

          // Remove from rooms if assigned
          if (tenant.spaceId) {
            for (const room of addr.rooms) {
              const space = room.spaces.find((s) => s.id === tenant.spaceId);
              if (space && space.tenant) {
                // Clear spaceId from tenant before removing
                space.tenant.spaceId = undefined;
                space.tenant = null;
                space.status = space.wypowiedzenie ? 'wypowiedzenie' : 'vacant';
              }
            }
          }
          await saveData(projects);
          await loadAddress();
          setTenantMenuVisible(false);
          setSelectedTenant(undefined);
        }
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
    }
  };

  const handleDeleteRoom = async (room: Room) => {
    if (!address) return;
    const hasOccupiedSpaces = room.spaces.some((space) => space.tenant);
    if (hasOccupiedSpaces) {
      Alert.alert(
        'Nie można usunąć pokoju',
        'W pokoju znajdują się mieszkańcy. Najpierw wymelduj всех mieszkańców z tego pokoju.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          addr.rooms = addr.rooms.filter((r) => r.id !== room.id);
          await saveData(projects);
          await loadAddress();
          setRoomMenuVisible(false);
          setSelectedRoom(undefined);
        }
      }
    } catch (error) {
      console.error('Error deleting room:', error);
    }
  };

  const renderResidentCard = ({ item }: { item: Tenant }) => (
    <View>
      <Card className="p-4 mb-3 flex-row gap-3 justify-between items-center">
        <Pressable
          onPress={() => router.push({
            pathname: '/tenant-details',
            params: { projectId, addressId, tenantId: item.id },
          })}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
            flex: 1,
          })}
          className="flex-row gap-3 flex-1"
        >
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
            <View className="flex-row items-center gap-2">
              <Text className="font-semibold text-foreground">
                {item.firstName} {item.lastName} <Text className="text-muted">({item.birthYear})</Text>
              </Text>
              <GenderIcon gender={item.gender as any} showCount={false} size={14} />
            </View>
            <Text className="text-xs text-muted">{item.checkInDate}</Text>
          </View>
          <View className="justify-center items-end gap-1">
            <Text className="text-sm font-semibold text-foreground">{item.monthlyPrice} zł</Text>
            {item.spaceId ? (
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="vpn-key" size={12} color={colors.primary} />
                <Text className="text-xs text-muted">{getRoomName(item.spaceId)}</Text>
              </View>
            ) : (
              <Text className="text-xs text-error font-semibold">Bez miejsca</Text>
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            setSelectedTenant(item);
            setTenantMenuVisible(true);
          }}
          className="p-2"
        >
          <MaterialIcons name="more-vert" size={20} color={colors.foreground} />
        </Pressable>
      </Card>
    </View>
  );

  const renderRoomCard = ({ item }: { item: Room }) => {
    const stats = calculateRoomStats(item);
    
    return (
      <View>
        <Pressable
          onPress={() => router.push({
            pathname: '/room-details',
            params: { projectId, addressId, roomId: item.id },
          })}
          style={({ pressed }) => ({
            opacity: pressed ? 0.8 : 1,
          })}
          className="flex-1"
        >
          <Card className="p-3 mb-3">
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground mb-0.5">
                    {item.name}
                  </Text>
                  <GenderIcon gender={item.type as any} showCount={false} size={14} />
                </View>
                <Pressable
                  onPress={() => {
                    setSelectedRoom(item);
                    setRoomMenuVisible(true);
                  }}
                  className="p-2 -mr-2"
                >
                  <MaterialIcons name="more-vert" size={20} color={colors.foreground} />
                </Pressable>
              </View>

              <View className="pt-1">
                <OccupancyProgress occupied={stats.occupied} total={stats.total} size="sm" />
              </View>

              {stats.wypowiedzenie > 0 && (
                <View className="flex-row items-center gap-2 pt-1">
                  <MaterialIcons name="warning" size={14} color={colors.warning} />
                  <Text className="text-xs text-warning">
                    {t.roomDetails.eviction}: {stats.wypowiedzenie}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Pressable>
      </View>
    );
  };

  const assignedTenants = address.rooms.flatMap((room) =>
    room.spaces.filter((space) => space.tenant).map((space) => space.tenant!)
  );
  const residents = [...address.unassignedTenants, ...assignedTenants];

  const handleBackPress = () => {
    if (address.unassignedTenants && address.unassignedTenants.length > 0) {
      const firstTenant = address.unassignedTenants[0];
      const tenantName = `${firstTenant.firstName} ${firstTenant.lastName}`;
      Alert.alert(
        'Niezakończona operacja zaselenia',
        `Mieszkaniec ${tenantName} nie został zakwaterowany do pokoju. Czy na pewno chcesz wyjść?`,
        [
          { text: 'Anuluj', style: 'cancel' },
          { text: 'Wyjdź', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-row items-center px-4 py-4 border-b border-border">
        <Pressable onPress={handleBackPress} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">{address.name}</Text>
          <Text className="text-xs text-muted">{address.fullAddress}</Text>
        </View>
      </View>

      <View className="flex-row p-4 gap-2">
        <Pressable
          onPress={() => setActiveTab('residents')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'residents' ? 'bg-primary' : 'bg-surfaceVariant'}`}
        >
          <Text className={`font-semibold ${activeTab === 'residents' ? 'text-foreground' : 'text-muted'}`}>
            {t.addressDetails.residents} ({residents.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('rooms')}
          className={`flex-1 py-2 rounded-lg items-center ${activeTab === 'rooms' ? 'bg-primary' : 'bg-surfaceVariant'}`}
        >
          <Text className={`font-semibold ${activeTab === 'rooms' ? 'text-foreground' : 'text-muted'}`}>
            {t.addressDetails.rooms} ({address.rooms.length})
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={activeTab === 'residents' ? residents : address.rooms}
        renderItem={activeTab === 'residents' ? renderResidentCard : renderRoomCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-muted">
              {activeTab === 'residents' ? t.messages.emptyResident : t.messages.emptyRoom}
            </Text>
          </View>
        }
      />

      <FAB
        icon="add"
        onPress={() => {
          if (activeTab === 'residents') {
            router.push({
              pathname: '/add-tenant',
              params: { projectId, addressId },
            });
          } else {
            router.push({
              pathname: '/add-room',
              params: { projectId, addressId },
            });
          }
        }}
      />

      <Modal
        visible={tenantMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTenantMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setTenantMenuVisible(false)}
        >
          <View className="bg-surface p-6 rounded-t-3xl gap-4">
            <Text className="text-lg font-bold text-foreground mb-2">
              {selectedTenant?.firstName} {selectedTenant?.lastName}
            </Text>
            <Pressable
              onPress={() => {
                setTenantMenuVisible(false);
                router.push({
                  pathname: '/tenant-details',
                  params: { projectId, addressId, tenantId: selectedTenant?.id },
                });
              }}
              className="flex-row items-center gap-3 py-2"
            >
              <MaterialIcons name="person" size={24} color={colors.primary} />
              <Text className="text-foreground font-medium">{t.common.details}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setTenantMenuVisible(false);
                router.push({
                  pathname: '/add-tenant',
                  params: { projectId, addressId, tenantId: selectedTenant?.id },
                });
              }}
              className="flex-row items-center gap-3 py-2"
            >
              <MaterialIcons name="edit" size={24} color={colors.primary} />
              <Text className="text-foreground font-medium">{t.common.edit}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectedTenant) {
                  Alert.alert(
                    t.common.delete,
                    `Czy na pewno chcesz usunąć mieszkańca ${selectedTenant.firstName} ${selectedTenant.lastName}?`,
                    [
                      { text: t.common.cancel, style: 'cancel' },
                      { text: t.common.delete, style: 'destructive', onPress: () => handleDeleteTenant(selectedTenant) },
                    ]
                  );
                }
              }}
              className="flex-row items-center gap-3 py-2"
            >
              <MaterialIcons name="delete" size={24} color={colors.error} />
              <Text className="text-error font-medium">{t.common.delete}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={roomMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoomMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setRoomMenuVisible(false)}
        >
          <View className="bg-surface p-6 rounded-t-3xl gap-4">
            <Text className="text-lg font-bold text-foreground mb-2">
              {selectedRoom?.name}
            </Text>
            <Pressable
              onPress={() => {
                setRoomMenuVisible(false);
                router.push({
                  pathname: '/room-details',
                  params: { projectId, addressId, roomId: selectedRoom?.id },
                });
              }}
              className="flex-row items-center gap-3 py-2"
            >
              <MaterialIcons name="meeting-room" size={24} color={colors.primary} />
              <Text className="text-foreground font-medium">{t.common.details}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setRoomMenuVisible(false);
                router.push({
                  pathname: '/add-room',
                  params: { projectId, addressId, roomId: selectedRoom?.id },
                });
              }}
              className="flex-row items-center gap-3 py-2"
            >
              <MaterialIcons name="edit" size={24} color={colors.primary} />
              <Text className="text-foreground font-medium">{t.common.edit}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectedRoom) {
                  Alert.alert(
                    t.common.delete,
                    `Czy na pewno chcesz usunąć pokój ${selectedRoom.name}?`,
                    [
                      { text: t.common.cancel, style: 'cancel' },
                      { text: t.common.delete, style: 'destructive', onPress: () => handleDeleteRoom(selectedRoom) },
                    ]
                  );
                }
              }}
              className="flex-row items-center gap-3 py-2"
            >
              <MaterialIcons name="delete" size={24} color={colors.error} />
              <Text className="text-error font-medium">{t.common.delete}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

function FAB({ icon, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-8 right-8 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg"
      style={{ elevation: 5 }}
    >
      <MaterialIcons name={icon} size={30} color="white" />
    </Pressable>
  );
}
