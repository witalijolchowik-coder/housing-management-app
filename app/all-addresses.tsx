import { View, Text, ScrollView, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { loadData } from '@/lib/store';
import { Project, Address } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { GenderIcon } from '@/components/ui/gender-icon';

interface AddressWithProject extends Address {
  projectName: string;
  projectId: string;
}

export default function AllAddressesScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const [groupedAddresses, setGroupedAddresses] = useState<Record<string, AddressWithProject[]>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadAllAddresses();
    }, [])
  );

  const loadAllAddresses = async () => {
    try {
      setLoading(true);
      const projects = await loadData();
      const all: AddressWithProject[] = [];
      
      projects.forEach(project => {
        project.addresses.forEach(address => {
          all.push({
            ...address,
            projectName: project.name,
            projectId: project.id
          });
        });
      });

      // Group by city and sort alphabetically
      const grouped = all.reduce((acc, addr) => {
        const city = addr.city || 'Inne';
        if (!acc[city]) acc[city] = [];
        acc[city].push(addr);
        return acc;
      }, {} as Record<string, AddressWithProject[]>);

      setGroupedAddresses(grouped);
    } catch (error) {
      console.error('Error loading all addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyStats = (address: Address) => {
    let male = 0;
    let female = 0;
    let couples = 0; // Changed from 'pairs' to 'couples' for clarity

    address.rooms.forEach(room => {
      if (room.type === 'couple') {
        // A couple room counts as one couple if both spaces are occupied
        const occupiedSpacesInCoupleRoom = room.spaces.filter(space => space.tenant).length;
        if (occupiedSpacesInCoupleRoom === room.totalSpaces && room.totalSpaces > 0) {
          couples++;
        }
      } else {
        room.spaces.forEach(space => {
          if (space.tenant) {
            if (space.tenant.gender === 'male') {
              male++;
            } else {
              female++;
            }
          }
        });
      }
    });

    return { male, female, couples };
  };

  const sortedCities = Object.keys(groupedAddresses).sort((a, b) => a.localeCompare(b));

  const getOperatorLabel = (operator?: string) => {
    switch (operator) {
      case 'rent_planet': return 'Rent Planet';
      case 'e_port': return 'E-Port';
      case 'other': return 'Inne';
      default: return operator || '-';
    }
  };

  return (
    <ScreenContainer className="p-4">
      <View className="flex-row items-center gap-3 mb-6">
        <Pressable
          onPress={() => router.back()}
          className="bg-surfaceVariant rounded-full p-2"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground">Wszystkie Lokale</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? (
          <View className="py-20 items-center">
            <Text className="text-muted">{t.common.loading}</Text>
          </View>
        ) : sortedCities.length === 0 ? (
          <View className="py-20 items-center">
            <Text className="text-muted">Brak dodanych lokali</Text>
          </View>
        ) : (
          sortedCities.map(city => (
            <View key={city} className="mb-6">
              <View className="flex-row items-center gap-2 mb-3 px-1">
                <MaterialIcons name="location-city" size={20} color={colors.primary} />
                <Text className="text-lg font-bold text-foreground">{city}</Text>
                <View className="h-[1px] flex-1 bg-border/30 ml-2" />
              </View>

              {groupedAddresses[city].map(address => {
                const stats = getOccupancyStats(address);
                return (
                  <Pressable 
                    key={address.id} 
                    onPress={() => router.push({
                      pathname: '/address-details',
                      params: { projectId: address.projectId, addressId: address.id }
                    })}
                    className="mb-3"
                  >
                    <Card className="p-4">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-foreground">{address.name}</Text>
                          <Text className="text-xs text-muted mt-0.5">
                            Projekt: <Text className="text-foreground/70">{address.projectName}</Text>
                          </Text>
                        </View>
                        <View className="px-2 py-0.5 rounded-full border border-border/50 bg-surfaceVariant/30">
                          <Text className="text-[10px] font-medium text-muted-foreground">{getOperatorLabel(address.operator)}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-4 mt-2 pt-2 border-t border-border/20">
                        <GenderIcon gender="male" count={stats.male} size={14} showCount={true} />
                        <GenderIcon gender="female" count={stats.female} size={14} showCount={true} />
                        <GenderIcon gender="couple" count={stats.couples} size={14} showCount={true} />
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
