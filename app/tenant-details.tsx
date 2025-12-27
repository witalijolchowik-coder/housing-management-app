import { ScrollView, Text, View, Pressable, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Tenant, Project, Address, Room } from '@/types';
import { MaterialIcons } from '@expo/vector-icons';
import { loadData } from '@/lib/store';

interface TenantLocation {
  projectId: string;
  projectName: string;
  addressId: string;
  addressName: string;
  roomId?: string;
  roomName?: string;
  spaceNumber?: number;
  checkInDate: string;
  checkOutDate?: string;
  isCurrent: boolean;
}

export default function TenantDetailsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId, addressId, tenantId } = useLocalSearchParams();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [locations, setLocations] = useState<TenantLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<TenantLocation | null>(null);

  useEffect(() => {
    const loadTenantData = async () => {
      try {
        const projects = await loadData();

        // Find current tenant
        let foundTenant: Tenant | null = null;
        let foundLocations: TenantLocation[] = [];
        let foundCurrentLocation: TenantLocation | null = null;

        // Search through all projects
        for (const project of projects) {
          for (const addr of project.addresses) {
            // Check unassigned tenants
            const unassignedTenant = addr.unassignedTenants?.find((t) => t.id === tenantId);
            if (unassignedTenant) {
              foundTenant = unassignedTenant;
              if (projectId === project.id && addressId === addr.id) {
                foundCurrentLocation = {
                  projectId: project.id,
                  projectName: project.name,
                  addressId: addr.id,
                  addressName: addr.name,
                  checkInDate: unassignedTenant.checkInDate,
                  isCurrent: true,
                };
              }
            }

            // Check assigned tenants in rooms
            for (const room of addr.rooms) {
              for (const space of room.spaces) {
                if (space.tenant?.id === tenantId) {
                  foundTenant = space.tenant;

                  const location: TenantLocation = {
                    projectId: project.id,
                    projectName: project.name,
                    addressId: addr.id,
                    addressName: addr.name,
                    roomId: room.id,
                    roomName: room.name,
                    spaceNumber: space.number,
                    checkInDate: space.tenant.checkInDate,
                    isCurrent: projectId === project.id && addressId === addr.id,
                  };

                  if (location.isCurrent) {
                    foundCurrentLocation = location;
                  }

                  foundLocations.push(location);
                }
              }
            }
          }
        }

        setTenant(foundTenant || null);
        setCurrentLocation(foundCurrentLocation || null);
        setLocations(foundLocations);
      } catch (error) {
        console.error('Error loading tenant data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, [projectId, addressId, tenantId]);

  if (loading) {
    return (
      <ScreenContainer className="p-4 pt-12 pb-20 items-center justify-center">
        <Text className="text-foreground">{t.common.loading}</Text>
      </ScreenContainer>
    );
  }

  if (!tenant) {
    return (
      <ScreenContainer className="p-4 pt-12 pb-20 items-center justify-center">
        <Text className="text-foreground">{t.common.noData}</Text>
      </ScreenContainer>
    );
  }

  const genderLabel = {
    male: t.resident.male,
    female: t.resident.female,
    other: t.resident.other,
  };

  return (
    <ScreenContainer className="p-4 pt-12 pb-20">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable
            onPress={() => router.back()}
            className="bg-surfaceVariant rounded-full p-2"
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-2xl font-bold text-foreground flex-1">Profil mieszkańca</Text>
        </View>

        {/* Profile Header */}
        <Card className="p-6 gap-4 mb-6 items-center">
          <View className="w-20 h-20 rounded-full bg-primary items-center justify-center">
            {tenant.photo ? (
              <Image source={{ uri: tenant.photo }} className="w-full h-full rounded-full" />
            ) : (
              <Text className="text-2xl font-bold text-background">
                {tenant.firstName.charAt(0)}{tenant.lastName.charAt(0)}
              </Text>
            )}
          </View>
          <View className="items-center gap-1">
            <Text className="text-2xl font-bold text-foreground">
              {tenant.firstName} {tenant.lastName}
            </Text>
            <Badge
              variant="info"
              size="sm"
              label={genderLabel[tenant.gender as keyof typeof genderLabel]}
            />
          </View>
        </Card>

        {/* Personal Information */}
        <Text className="text-lg font-bold text-foreground mb-3">Dane osobowe</Text>
        <Card className="p-4 gap-3 mb-6">
          <View className="flex-row justify-between items-center py-2 border-b border-border">
            <Text className="text-sm text-muted">Rok urodzenia</Text>
            <Text className="text-sm font-semibold text-foreground">{tenant.birthYear}</Text>
          </View>
          <View className="flex-row justify-between items-center py-2 border-b border-border">
            <Text className="text-sm text-muted">Płeć</Text>
            <Text className="text-sm font-semibold text-foreground">
              {genderLabel[tenant.gender as keyof typeof genderLabel]}
            </Text>
          </View>
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-sm text-muted">Cena miesięczna</Text>
            <Text className="text-sm font-semibold text-foreground">{tenant.monthlyPrice} zł</Text>
          </View>
        </Card>

        {/* Current Location */}
        {currentLocation && (
          <>
            <Text className="text-lg font-bold text-foreground mb-3">Obecne miejsce</Text>
            <Card className="p-4 gap-3 mb-6 border-l-4 border-primary">
              <View className="gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {currentLocation.projectName}
                </Text>
                <Text className="text-sm text-muted">{currentLocation.addressName}</Text>
                {currentLocation.roomName && (
                  <View className="flex-row items-center gap-2 mt-2">
                    <MaterialIcons name="door-back" size={16} color={colors.primary} />
                    <Text className="text-sm text-foreground">
                      {currentLocation.roomName}, miejsce {currentLocation.spaceNumber}
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center gap-2 mt-2">
                  <MaterialIcons name="calendar-today" size={16} color={colors.primary} />
                  <Text className="text-xs text-muted">
                    Od {currentLocation.checkInDate}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Settlement History */}
        {locations.length > 0 && (
          <>
            <Text className="text-lg font-bold text-foreground mb-3">Historia poselenia</Text>
            <View className="gap-3">
              {locations.map((location, index) => (
                <Card key={`${location.projectId}-${location.addressId}-${index}`} className="p-4 gap-2">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-foreground">
                        {location.projectName}
                      </Text>
                      <Text className="text-xs text-muted mt-1">{location.addressName}</Text>
                      {location.roomName && (
                        <Text className="text-xs text-muted mt-1">
                          {location.roomName}, miejsce {location.spaceNumber}
                        </Text>
                      )}
                    </View>
                    {location.isCurrent && (
                      <Badge variant="success" size="sm" label="Obecnie" />
                    )}
                  </View>
                  <View className="flex-row items-center gap-2 mt-2 pt-2 border-t border-border">
                    <MaterialIcons name="calendar-today" size={14} color={colors.muted} />
                    <Text className="text-xs text-muted">
                      {location.checkInDate}
                      {location.checkOutDate && ` - ${location.checkOutDate}`}
                    </Text>
                  </View>
                </Card>
              ))}
            </View>
          </>
        )}

        {/* No History */}
        {locations.length === 0 && !currentLocation && (
          <Card className="p-4 items-center">
            <Text className="text-sm text-muted">Brak historii poselenia</Text>
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
