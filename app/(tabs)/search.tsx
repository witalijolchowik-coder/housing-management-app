import { View, Text, TextInput, Pressable, FlatList, ScrollView, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, Tenant } from '@/types';
import { loadData, loadEvictionArchive, restoreTenantFromArchive, generateId } from '@/lib/store';
import { RestoreTenantDialog } from '@/components/restore-tenant-dialog';
import { getEvictionReasonLabel } from '@/lib/eviction-reasons';
import { MaterialIcons } from '@expo/vector-icons';
import { GenderIcon } from '@/components/ui/gender-icon';

interface TenantWithHistory extends Tenant {
  projectName: string;
  addressName: string;
  roomNumber: number | string;
  currentAddress: string;
  currentRoom: string;
  isArchived?: boolean;
  evictionDate?: string;
  evictionReason?: string;
  history: Array<{
    projectName: string;
    addressName: string;
    checkInDate: string;
    checkOutDate?: string;
  }>;
}

export default function SearchScreen() {
  const t = useTranslations();
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TenantWithHistory[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantWithHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchInArchive, setSearchInArchive] = useState(false);
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [archiveEntryId, setArchiveEntryId] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      loadSearchData();
    }, [])
  );

  const loadSearchData = async () => {
    try {
      const data = await loadData();
      setProjects(data);
    } catch (error) {
      console.error('Error loading search data:', error);
    }
  };

  const buildTenantHistory = (tenant: Tenant): TenantWithHistory => {
    const history: Array<{
      projectName: string;
      addressName: string;
      checkInDate: string;
      checkOutDate?: string;
    }> = [];

    for (const project of projects) {
      for (const address of project.addresses) {
        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.tenant?.id === tenant.id) {
              history.push({
                projectName: project.name,
                addressName: address.name,
                checkInDate: tenant.checkInDate,
              });
            }
          }
        }
      }
    }

    history.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

    return {
      ...tenant,
      projectName: '',
      addressName: '',
      roomNumber: 0,
      currentAddress: '',
      currentRoom: '',
      history,
    };
  };

  const handleSearch = async (queryOverride?: string, archiveOverride?: boolean) => {
    const query = (queryOverride !== undefined ? queryOverride : searchQuery).toLowerCase().trim();
    const searchArchive = archiveOverride !== undefined ? archiveOverride : searchInArchive;

    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const results: TenantWithHistory[] = [];

      for (const project of projects) {
        for (const address of project.addresses) {
          // Check unassigned tenants
          for (const tenant of address.unassignedTenants || []) {
            const firstName = tenant.firstName.toLowerCase();
            const lastName = tenant.lastName.toLowerCase();
            const fullName = `${firstName} ${lastName}`;

            if (firstName.includes(query) || lastName.includes(query) || fullName.includes(query)) {
              const tWithHistory = buildTenantHistory(tenant);
              tWithHistory.projectName = project.name;
              tWithHistory.addressName = address.name;
              tWithHistory.currentAddress = `${address.name}, ${address.fullAddress}`;
              tWithHistory.currentRoom = 'Bez miejsca';
              results.push(tWithHistory);
            }
          }

          // Check assigned tenants
          for (const room of address.rooms) {
            for (const space of room.spaces) {
              if (space.tenant) {
                const firstName = space.tenant.firstName.toLowerCase();
                const lastName = space.tenant.lastName.toLowerCase();
                const fullName = `${firstName} ${lastName}`;

                if (firstName.includes(query) || lastName.includes(query) || fullName.includes(query)) {
                  const tenant = buildTenantHistory(space.tenant);
                  tenant.projectName = project.name;
                  tenant.addressName = address.name;
                  tenant.roomNumber = space.number;
                  tenant.currentAddress = `${address.name}, ${address.fullAddress}`;
                  tenant.currentRoom = room.name;

                  if (!results.some((r) => r.id === tenant.id)) {
                    results.push(tenant);
                  }
                }
              }
            }
          }
        }
      }

      if (searchArchive) {
        const archive = await loadEvictionArchive();
        for (const entry of archive) {
          const firstName = entry.firstName.toLowerCase();
          const lastName = entry.lastName.toLowerCase();
          const fullName = `${firstName} ${lastName}`;

          if (firstName.includes(query) || lastName.includes(query) || fullName.includes(query)) {
            const archivedTenant: TenantWithHistory = {
              id: entry.tenantId || generateId(),
              firstName: entry.firstName || 'Nieznany',
              lastName: entry.lastName || 'Mieszkaniec',
              gender: entry.gender || 'male',
              birthYear: entry.birthYear || 1995,
              checkInDate: entry.checkInDate || '-',
              monthlyPrice: entry.monthlyPrice || 0,
              phone: entry.phone,
              projectName: entry.projectName || '-',
              addressName: entry.addressName || '-',
              roomNumber: entry.roomName || '-',
              currentAddress: 'Archiwum',
              currentRoom: entry.roomName || '-',
              isArchived: true,
              evictionDate: entry.checkOutDate,
              evictionReason: entry.reason,
              history: [{
                projectName: entry.projectName || '-',
                addressName: entry.addressName || '-',
                checkInDate: entry.checkInDate || '-',
                checkOutDate: entry.checkOutDate,
              }],
            };

            if (!results.some((r) => r.id === archivedTenant.id && r.isArchived)) {
              results.push(archivedTenant);
            }
          }
        }
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
      Alert.alert('Błąd', 'Nie udało się wyszukać');
    } finally {
      setLoading(false);
    }
  };

  const handleClearResults = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedTenant(null);
  };

  const handleRestoreTenant = async (projectId: string, addressId: string) => {
    try {
      await restoreTenantFromArchive(archiveEntryId, projectId, addressId);
      setRestoreDialogVisible(false);
      setSelectedTenant(null);
      Alert.alert('Sukces', 'Mieszkaniec został przywrócony do projektu');
      await loadSearchData();
      handleClearResults();
    } catch (error) {
      console.error('Error restoring tenant:', error);
      Alert.alert('Błąd', 'Nie udało się przywrócić mieszkańca');
    }
  };

  const renderSearchResult = ({ item }: { item: TenantWithHistory }) => (
    <Pressable
      onPress={() => setSelectedTenant(item)}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Card className="p-4 mb-3">
        <View className="gap-2">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-foreground">
                  {item.firstName} {item.lastName}
                </Text>
                <GenderIcon gender={item.gender as any} showCount={false} size={14} />
              </View>
              <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
            </View>
            <View className="flex-row gap-2">
              {item.isArchived && (
                <Badge
                  variant="warning"
                  size="sm"
                  label="Archiwum"
                />
              )}
            </View>
          </View>
          <Text className="text-xs text-muted">Rok urodzenia: {item.birthYear}</Text>
          <Text className="text-xs text-muted">Zameldowany: {item.checkInDate}</Text>
        </View>
      </Card>
    </Pressable>
  );

  if (selectedTenant) {
    return (
      <ScreenContainer className="p-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-3 mb-6">
            <Pressable
              onPress={() => setSelectedTenant(null)}
              className="bg-surfaceVariant rounded-full p-2"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-2xl font-bold text-foreground">
                  {selectedTenant.firstName} {selectedTenant.lastName}
                </Text>
                <GenderIcon gender={selectedTenant.gender as any} showCount={false} size={20} />
              </View>
              <Text className="text-sm text-muted mt-1">{selectedTenant.projectName}</Text>
            </View>
          </View>

          {selectedTenant.isArchived && (
            <Card className="p-4 mb-4 bg-warning/10 border-warning">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-2">
                  <MaterialIcons name="archive" size={20} color={colors.warning} />
                  <Text className="text-warning font-bold">Mieszkaniec w archiwum</Text>
                </View>
                <Pressable
                  onPress={() => {
                    setArchiveEntryId(selectedTenant.id);
                    setRestoreDialogVisible(true);
                  }}
                  className="bg-warning px-3 py-1.5 rounded-lg"
                >
                  <Text className="text-white text-xs font-bold">Przywróć</Text>
                </Pressable>
              </View>
              <View className="gap-1">
                <Text className="text-xs text-warning-foreground">Data wymeldowania: {selectedTenant.evictionDate}</Text>
                <Text className="text-xs text-warning-foreground">Powód: {getEvictionReasonLabel(selectedTenant.evictionReason as any)}</Text>
              </View>
            </Card>
          )}

          <Card className="p-4 mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">Informacje</Text>
            <View className="gap-3">
              <View className="flex-row justify-between">
                <Text className="text-muted">Rok urodzenia</Text>
                <Text className="text-foreground font-medium">{selectedTenant.birthYear}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Płeć</Text>
                <Text className="text-foreground font-medium">{selectedTenant.gender === 'male' ? 'Mężczyzna' : 'Kobieta'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Telefon</Text>
                <Text className="text-foreground font-medium">{selectedTenant.phone || '-'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Obecny adres</Text>
                <Text className="text-foreground font-medium text-right flex-1 ml-4">{selectedTenant.currentAddress}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-muted">Pokój</Text>
                <Text className="text-foreground font-medium">{selectedTenant.currentRoom}</Text>
              </View>
            </View>
          </Card>

          <Text className="text-lg font-bold text-foreground mb-3 px-1">Historia zameldowania</Text>
          {selectedTenant.history.map((h, i) => (
            <Card key={i} className="p-4 mb-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-bold text-foreground">{h.addressName}</Text>
                  <Text className="text-xs text-muted mt-1">{h.projectName}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-muted">Od: {h.checkInDate}</Text>
                  {h.checkOutDate && <Text className="text-xs text-muted">Do: {h.checkOutDate}</Text>}
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>

        <RestoreTenantDialog
          visible={restoreDialogVisible}
          projects={projects}
          onClose={() => setRestoreDialogVisible(false)}
          onRestore={handleRestoreTenant}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <Text className="text-3xl font-bold text-foreground mb-6">{t.search.title}</Text>

      <View className="flex-row gap-2 mb-4">
        <View className="flex-1 flex-row items-center bg-surface border border-border rounded-xl px-4">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 h-12 text-foreground ml-2"
            placeholder={t.search.placeholder}
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearResults}>
              <MaterialIcons name="cancel" size={20} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        onPress={() => {
          const newValue = !searchInArchive;
          setSearchInArchive(newValue);
          handleSearch(searchQuery, newValue);
        }}
        className="flex-row items-center gap-2 mb-6 px-1"
      >
        <View className={`w-5 h-5 rounded border items-center justify-center ${searchInArchive ? 'bg-primary border-primary' : 'border-muted'}`}>
          {searchInArchive && <MaterialIcons name="check" size={14} color="white" />}
        </View>
        <Text className="text-foreground font-medium">Szukaj w archiwum</Text>
      </Pressable>

      <FlatList
        data={searchResults}
        renderItem={renderSearchResult}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          searchQuery.length > 0 ? (
            <View className="py-20 items-center">
              <Text className="text-muted">Nie znaleziono mieszkańców</Text>
            </View>
          ) : (
            <View className="py-20 items-center">
              <MaterialIcons name="person-search" size={64} color={colors.border} />
              <Text className="text-muted mt-4">Wpisz imię lub nazwisko</Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}
