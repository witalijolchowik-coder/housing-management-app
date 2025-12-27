import { ScrollView, Text, View, FlatList, Pressable, Modal, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, Room, Space } from '@/types';
import { loadData, getDaysRemaining, saveData } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

export default function RoomDetailsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, roomId } = useLocalSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [spaceMenuVisible, setSpaceMenuVisible] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState<Space | undefined>(undefined);

  useEffect(() => {
    loadRoom();
  }, [projectId, addressId, roomId]);

  // Reload data when screen becomes active (after returning from select-tenant, etc.)
  useFocusEffect(
    useCallback(() => {
      loadRoom();
    }, [projectId, addressId, roomId])
  );

  const loadRoom = async () => {
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          setAddress(addr);
          const r = addr.rooms.find((rm) => rm.id === roomId);
          if (r) {
            setRoom(r);
          }
        }
      }
    } catch (error) {
      console.error('Error loading room:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !room || !address) {
    return (
      <ScreenContainer>
        <Text className="text-muted">{t.common.loading}</Text>
      </ScreenContainer>
    );
  }

  const roomTypeLabel = {
    male: `♂ ${t.roomDetails.male}`,
    female: `♀ ${t.roomDetails.female}`,
    couple: `♡ ${t.roomDetails.couple}`,
  };

  const getSpaceStatus = (space: Space): { label: string; color: string; icon: string } => {
    if (space.wypowiedzenie) {
      const daysRemaining = getDaysRemaining(space.wypowiedzenie.endDate);
      if (space.tenant) {
        return {
          label: `Zajęte (${daysRemaining} dni)`,
          color: 'bg-warning',
          icon: 'warning',
        };
      } else {
        return {
          label: `Wypowiedzenie (${daysRemaining} dni)`,
          color: 'bg-warning',
          icon: 'schedule',
        };
      }
    } else if (space.tenant) {
      return {
        label: 'Zajęte',
        color: 'bg-success',
        icon: 'check-circle',
      };
    } else {
      return {
        label: 'Wolne',
        color: 'bg-muted',
        icon: 'circle-outline',
      };
    }
  };

  const handleDeleteSpace = async (space: Space) => {
    setSpaceMenuVisible(false);
    
    if (space.tenant) {
      // Space is occupied - cannot delete without eviction
      Alert.alert(
        'Miejsce zajęte',
        'Miejsce jest zajęte. Zwolnij to miejsce i spróbuj ponownie usunąć.',
        [
          {
            text: 'Anuluj',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Postaw na wypowiedzenie',
            onPress: () => {
              if (selectedSpace) {
                handleToggleWypowiedzenie(selectedSpace, true);
              }
            },
          },
        ]
      );
    } else {
      // Space is empty - offer choice
      Alert.alert(
        'Usunąć miejsce',
        'Czy chcesz usunąć to miejsce lub postawić je na wypowiedzenie?',
        [
          {
            text: 'Anuluj',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Postaw na wypowiedzenie',
            onPress: () => {
              if (selectedSpace) {
                handleToggleWypowiedzenie(selectedSpace, true);
              }
            },
          },
          {
            text: 'Usuń',
            onPress: async () => {
              try {
                const projects = await loadData();
                const project = projects.find((p) => p.id === projectId);
                if (project) {
                  const addr = project.addresses.find((a) => a.id === addressId);
                  if (addr) {
                    const r = addr.rooms.find((rm) => rm.id === roomId);
                    if (r) {
                      r.spaces = r.spaces.filter((s) => s.id !== space.id);
                      await saveData(projects);
                      await loadRoom();
                      setSelectedSpace(undefined);
                    }
                  }
                }
              } catch (error) {
                console.error('Error deleting space:', error);
              }
            },
            style: 'destructive',
          },
        ]
      );
    }
  }

  const handleToggleWypowiedzenie = async (space: Space, putOn: boolean) => {
    try {
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        const addr = project.addresses.find((a) => a.id === addressId);
        if (addr) {
          const r = addr.rooms.find((rm) => rm.id === roomId);
          if (r) {
            const s = r.spaces.find((sp) => sp.id === space.id);
            if (s) {
              if (putOn) {
                const wypowiedzenieDays = 14;
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(endDate.getDate() + wypowiedzenieDays);
                s.status = 'wypowiedzenie';
                s.wypowiedzenie = {
                  startDate: startDate.toISOString().split('T')[0],
                  endDate: endDate.toISOString().split('T')[0],
                  paidUntil: endDate.toISOString().split('T')[0],
                  groupedWithAddress: false,
                };
              } else {
                s.wypowiedzenie = undefined;
                // Restore status based on tenant presence
                s.status = s.tenant ? 'occupied' : 'vacant';
              }
              await saveData(projects);
              await loadRoom();
              setSpaceMenuVisible(false);
              setSelectedSpace(undefined);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error toggling wypowiedzenie:', error);
    }
  };

  const renderSpaceCard = ({ item }: { item: Space }) => {
    const status = getSpaceStatus(item);
    const daysRemaining = item.wypowiedzenie ? getDaysRemaining(item.wypowiedzenie.endDate) : 0;

    return (
      <View>
        <Card className="p-4 mb-3">
          <View className="gap-3">
            {/* Header: Tenant name or "Wolne" with space badge and menu */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1 gap-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-bold text-foreground flex-1">
                    {item.tenant ? `${item.tenant.firstName} ${item.tenant.lastName}` : 'Wolne'}
                  </Text>
                  <Badge
                    variant="default"
                    size="sm"
                    label={`Miejsce ${item.number}`}
                    className=""
                  />
                </View>
                <Badge
                  variant={status.color === 'bg-success' ? 'success' : status.color === 'bg-warning' ? 'warning' : 'default'}
                  size="sm"
                  label={status.label}
                  className=""
                />
              </View>
              <Pressable
                onPress={() => {
                  setSelectedSpace(item);
                  setSpaceMenuVisible(true);
                }}
                className="p-2"
              >
                <MaterialIcons name="more-vert" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Tenant details */}
            {item.tenant && (
              <View className="gap-2 pt-2 border-t border-border">
                <Text className="text-xs text-muted">
                  Zarezerwowane: {item.tenant.checkInDate}
                </Text>
                <Text className="text-sm font-semibold text-foreground">
                  {item.tenant.monthlyPrice} zł/miesiąc
                </Text>
              </View>
            )}

            {/* Eviction info */}
            {item.wypowiedzenie && (
              <View className="gap-2 pt-2 border-t border-border">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-muted">Wypowiedzenie:</Text>
                  <Text className="text-sm font-semibold text-warning">{daysRemaining} dni</Text>
                </View>
                <ProgressBar
                  progress={Math.max(0, (daysRemaining / 14) * 100)}
                  color="bg-warning"
                />
              </View>
            )}
          </View>
        </Card>
      </View>
    );
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-4">
        <Pressable onPress={() => router.back()} className="p-2">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <View className="flex-1">
          <View className="gap-1 mb-1">
            <Text className="text-2xl font-bold text-foreground">{room.name}</Text>
            <Text className="text-sm text-muted">{roomTypeLabel[room.type]}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {room.spaces.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">{t.messages.emptyAddress}</Text>
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

      {/* FAB Button - Add Tenant to Room */}
      <Pressable
        onPress={() => {
          router.push({
            pathname: '/select-tenant',
            params: { projectId, addressId, roomId },
          });
        }}
        className="absolute bottom-20 right-4 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <MaterialIcons name="add" size={28} color={colors.background} />
      </Pressable>

      {/* Space Menu Modal */}
      <Modal
        visible={spaceMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSpaceMenuVisible(false)}
      >
        <Pressable
          onPress={() => setSpaceMenuVisible(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Card className="w-56 p-2 gap-1">
            {selectedSpace && (
              <>
                <Pressable
                  onPress={() => {
                    // TODO: Edit space
                    setSpaceMenuVisible(false);
                  }}
                  className="p-3 flex-row items-center gap-2"
                >
                  <MaterialIcons name="edit" size={20} color={colors.foreground} />
                  <Text className="text-foreground">{t.common.edit}</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (selectedSpace) {
                      handleDeleteSpace(selectedSpace);
                    }
                  }}
                  className="p-3 flex-row items-center gap-2"
                >
                  <MaterialIcons name="delete" size={20} color={colors.error} />
                  <Text className="text-error">{t.common.delete}</Text>
                </Pressable>

                {selectedSpace.wypowiedzenie ? (
                  <Pressable
                    onPress={() => {
                      if (selectedSpace) {
                        handleToggleWypowiedzenie(selectedSpace, false);
                      }
                    }}
                    className="p-3 flex-row items-center gap-2"
                  >
                    <MaterialIcons name="cancel" size={20} color={colors.warning} />
                    <Text className="text-warning">Anuluj wypowiedzenie</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => {
                      if (selectedSpace) {
                        handleToggleWypowiedzenie(selectedSpace, true);
                      }
                    }}
                    className="p-3 flex-row items-center gap-2"
                  >
                    <MaterialIcons name="schedule" size={20} color={colors.warning} />
                    <Text className="text-warning">Postaw na wypowiedzenie</Text>
                  </Pressable>
                )}
              </>
            )}
          </Card>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
