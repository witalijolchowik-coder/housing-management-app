import { ScrollView, Text, View, FlatList, Pressable, Image, Modal, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Room, Tenant } from '@/types';
import { loadData, calculateRoomStats, getDaysRemaining, saveData } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

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

  useEffect(() => {
    loadAddress();
  }, [projectId, addressId]);

  const loadAddress = async () => {
    try {
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
              if (space) {
                space.tenant = null;
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
      alert('Nie mozna usunac pokoju z zamelowanymi mieszkancami');
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
            pathname: '/room-details',
            params: { projectId, addressId, roomId: item.spaceId },
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
            <Text className="font-semibold text-foreground">
              {item.firstName} {item.lastName}
            </Text>
            <Text className="text-xs text-muted">{item.checkInDate}</Text>
          </View>
          <View className="justify-center items-end gap-1">
            <Text className="text-sm font-semibold text-foreground">{item.monthlyPrice} zł</Text>
            {item.spaceId ? (
              <Text className="text-xs text-muted">Pokój {getRoomName(item.spaceId)}</Text>
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
    const occupancyPercent = stats.total > 0
      ? Math.round(((stats.occupied + stats.wypowiedzenie) / stats.total) * 100)
      : 0;

    const roomTypeLabel = {
      male: `♂ ${t.roomDetails.male}`,
      female: `♀ ${t.roomDetails.female}`,
      couple: `♡ ${t.roomDetails.couple}`,
    };

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
          <Card className="p-4 mb-3">
            <View className="gap-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground">
                    {t.roomDetails.title} {item.name}
                  </Text>
                  <Badge
                    variant="info"
                    size="lg"
                    label={roomTypeLabel[item.type]}
                    className="mt-2"
                  />
                </View>
                <View className="flex-row gap-2 items-center">
                  <Text className="text-sm text-muted">
                    {stats.occupied}/{stats.total}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSelectedRoom(item);
                      setRoomMenuVisible(true);
                    }}
                    className="p-2"
                  >
                    <MaterialIcons name="more-vert" size={20} color={colors.foreground} />
                  </Pressable>
                </View>
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
      </View>
    );
  };

  // Combine assigned tenants (from rooms) and unassigned tenants
  const assignedTenants = address.rooms.flatMap((room) =>
    room.spaces.filter((space) => space.tenant).map((space) => space.tenant!)
  );
  const residents = [...address.unassignedTenants, ...assignedTenants];

  const handleBackPress = () => {
    // Check if there are unassigned tenants
    if (address.unassignedTenants && address.unassignedTenants.length > 0) {
      const firstTenant = address.unassignedTenants[0];
      const tenantName = `${firstTenant.firstName} ${firstTenant.lastName}`;
      Alert.alert(
        'Niezakończona operacja zaselenia',
        `Mieszkaniec ${tenantName} nie ma przydzielonego miejsca. Przejdź do karty Pokoje i wybierz dla niego pokój, lub usuń go, jeśli został dodany przez pomyłkę.`,
        [
          {
            text: 'Anuluj',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Usuń mieszkańca',
            onPress: () => handleDeleteTenant(firstTenant),
            style: 'destructive',
          },
          {
            text: 'Przejdź do Pokojów',
            onPress: () => {
              setActiveTab('rooms');
            },
          },
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center gap-2 mb-4">
        <Pressable onPress={handleBackPress} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground flex-1">{address.name}</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 mb-4">
        <Pressable
          onPress={() => setActiveTab('residents')}
          className={`flex-1 py-3 px-4 rounded-full ${activeTab === 'residents' ? 'bg-primary' : 'bg-surface'}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'residents' ? 'text-background' : 'text-foreground'}`}>
            Mieszkańcy
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('rooms')}
          className={`flex-1 py-3 px-4 rounded-full ${activeTab === 'rooms' ? 'bg-primary' : 'bg-surface'}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'rooms' ? 'text-background' : 'text-foreground'}`}>
            Pokoje
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
                <Text className="text-muted">{t.messages.emptyAddress}</Text>
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

      {/* FAB Button */}
      <Pressable
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
        className="absolute bottom-20 right-4 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <MaterialIcons name="add" size={28} color={colors.background} />
      </Pressable>

      {/* Tenant Menu Modal */}
      <Modal
        visible={tenantMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTenantMenuVisible(false)}
      >
        <Pressable
          onPress={() => setTenantMenuVisible(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Card className="w-48 p-2 gap-1">
            <Pressable
              onPress={() => {
                if (selectedTenant) {
                  router.push({
                    pathname: '/add-tenant',
                    params: { projectId, addressId, tenantId: selectedTenant.id },
                  });
                }
                setTenantMenuVisible(false);
              }}
              className="p-3 flex-row items-center gap-2"
            >
              <MaterialIcons name="edit" size={20} color={colors.foreground} />
              <Text className="text-foreground">{t.common.edit}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectedTenant) {
                  router.push({
                    pathname: '/room-details',
                    params: { projectId, addressId, roomId: selectedTenant.spaceId, action: 'evict' },
                  });
                }
                setTenantMenuVisible(false);
              }}
              className="p-3 flex-row items-center gap-2"
            >
              <MaterialIcons name="logout" size={20} color={colors.error} />
              <Text className="text-error">{t.common.evict}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectedTenant) {
                  handleDeleteTenant(selectedTenant);
                }
              }}
              className="p-3 flex-row items-center gap-2"
            >
              <MaterialIcons name="delete" size={20} color={colors.error} />
              <Text className="text-error">{t.common.delete}</Text>
            </Pressable>
          </Card>
        </Pressable>
      </Modal>

      {/* Room Menu Modal */}
      <Modal
        visible={roomMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoomMenuVisible(false)}
      >
        <Pressable
          onPress={() => setRoomMenuVisible(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Card className="w-48 p-2 gap-1">
            <Pressable
              onPress={() => {
                if (selectedRoom) {
                  router.push({
                    pathname: '/edit-room',
                    params: { projectId, addressId, roomId: selectedRoom.id },
                  });
                }
                setRoomMenuVisible(false);
              }}
              className="p-3 flex-row items-center gap-2"
            >
              <MaterialIcons name="edit" size={20} color={colors.foreground} />
              <Text className="text-foreground">{t.common.edit}</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (selectedRoom) {
                  handleDeleteRoom(selectedRoom);
                }
              }}
              className="p-3 flex-row items-center gap-2"
            >
              <MaterialIcons name="delete" size={20} color={colors.error} />
              <Text className="text-error">{t.common.delete}</Text>
            </Pressable>
          </Card>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
