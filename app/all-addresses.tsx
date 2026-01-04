import { View, Text, ScrollView, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { loadData } from '@/lib/store';
import { Project, Address } from '@/types';
import { useRouter } from 'expo-router';

interface AddressWithProject extends Address {
  projectName: string;
  projectId: string;
}

export default function AllAddressesScreen() {
  const colors = useColors();
  const t = useTranslations();
  const router = useRouter();
  const [groupedAddresses, setGroupedAddresses] = useState<Record<string, AddressWithProject[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllAddresses();
  }, []);

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

      // Group by city
      const grouped = all.reduce((acc, addr) => {
        const city = addr.fullAddress.split(',')[0].trim() || 'Inne';
        if (!acc[city]) acc[city] = [];
        acc[city].push(addr);
        return acc;
      }, {} as Record<string, AddressWithProject[]>);

      setGroupedAddresses(grouped);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOccupancyStats = (address: Address) => {
    let males = 0;
    let females = 0;
    let couples = 0;

    address.rooms.forEach(room => {
      room.spaces.forEach(space => {
        if (space.tenant) {
          if (room.type === 'couple') {
            couples++;
          } else if (space.tenant.gender === 'male') {
            males++;
          } else if (space.tenant.gender === 'female') {
            females++;
          }
        }
      });
    });

    // Couples are counted as pairs, so divide by 2 for number of pairs if needed, 
    // but usually "miejsca dla par" means 2 people.
    return { males, females, couples: Math.floor(couples / 2) };
  };

  return (
    <ScreenContainer>
      <View className="flex-row items-center px-4 py-4 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-4">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-xl font-bold text-foreground">Wszystkie Lokale</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {loading ? (
          <Text className="text-muted text-center mt-10">{t.common.loading}</Text>
        ) : Object.keys(groupedAddresses).length === 0 ? (
          <Text className="text-muted text-center mt-10">Brak adresów</Text>
        ) : (
          Object.entries(groupedAddresses).sort().map(([city, addresses]) => (
            <View key={city} className="mb-6">
              <Text className="text-lg font-bold text-primary mb-3 px-1">{city}</Text>
              {addresses.map((address) => {
                const stats = getOccupancyStats(address);
                return (
                  <Pressable 
                    key={address.id}
                    onPress={() => router.push({
                      pathname: '/address-list',
                      params: { projectId: address.projectId, initialAddressId: address.id }
                    })}
                  >
                    <Card className="p-4 mb-3">
                      <View className="flex-row justify-between items-start mb-2">
                        <View className="flex-1">
                          <Text className="text-base font-bold text-foreground">{address.name}</Text>
                          <Text className="text-xs text-muted mt-0.5">{address.fullAddress}</Text>
                        </View>
                        <Badge variant="outline" label={address.projectName} size="sm" />
                      </View>

                      <View className="flex-row items-center gap-4 mt-2 pt-2 border-t border-border/30">
                        <View className="flex-row items-center gap-1">
                          <MaterialIcons name="business" size={14} color={colors.muted} />
                          <Text className="text-xs text-muted">
                            {address.operator === 'rent_planet' ? 'Rent Planet' : 
                             address.operator === 'e_port' ? 'E-Port' : 
                             address.operatorName || 'Inny'}
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center gap-3 ml-auto">
                          <View className="flex-row items-center gap-1">
                            <MaterialIcons name="male" size={14} color="#3b82f6" />
                            <Text className="text-xs font-medium text-foreground">{stats.males}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <MaterialIcons name="female" size={14} color="#ec4899" />
                            <Text className="text-xs font-medium text-foreground">{stats.females}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <MaterialIcons name="people" size={14} color="#8b5cf6" />
                            <Text className="text-xs font-medium text-foreground">{stats.couples}</Text>
                          </View>
                        </View>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))
        )}
        <View className="h-10" />
      </ScrollView>
    </ScreenContainer>
  );
}
