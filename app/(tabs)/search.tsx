import { View, Text, TextInput, Pressable, FlatList, ScrollView, Alert } from 'react-native';
import { useState, useCallback, useMemo } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useColors } from '@/hooks/use-colors';
import { Project, Tenant, AddressEvent } from '@/types';
import { generateId, loadAddressEvents, loadData, loadEvictionArchive, restoreTenantFromArchive } from '@/lib/store';
import { RestoreTenantDialog } from '@/components/restore-tenant-dialog';
import { getEvictionReasonLabel } from '@/lib/eviction-reasons';
import { MaterialIcons } from '@expo/vector-icons';
import { GenderIcon } from '@/components/ui/gender-icon';

interface TenantCard extends Tenant {
  projectId?: string;
  projectName: string;
  addressId?: string;
  addressName: string;
  currentAddress: string;
  currentRoom: string;
  isArchived?: boolean;
  evictionDate?: string;
  evictionReason?: string;
}

interface AddressCard {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  fullAddress: string;
  supplierName?: string;
  events: AddressEvent[];
}

export default function SearchScreen() {
  const colors = useColors();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<AddressEvent[]>([]);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tenants' | 'addresses'>('tenants');
  const [searchInArchive, setSearchInArchive] = useState(false);
  const [archiveTenants, setArchiveTenants] = useState<TenantCard[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantCard | null>(null);
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [archiveEntryId, setArchiveEntryId] = useState('');

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadData(), loadAddressEvents()])
        .then(([loadedProjects, loadedEvents]) => {
          setProjects(loadedProjects);
          setEvents(loadedEvents);
        })
        .catch((error) => console.error('Error loading search data:', error));
    }, [])
  );

  const tenantCards = useMemo(() => {
    const cards: TenantCard[] = [];
    for (const project of projects) {
      for (const address of project.addresses) {
        for (const tenant of address.unassignedTenants || []) {
          cards.push({
            ...tenant,
            projectId: project.id,
            projectName: project.name,
            addressId: address.id,
            addressName: address.name,
            currentAddress: `${address.name}, ${address.fullAddress}`,
            currentRoom: 'Bez miejsca',
          });
        }
        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.tenant) {
              cards.push({
                ...space.tenant,
                projectId: project.id,
                projectName: project.name,
                addressId: address.id,
                addressName: address.name,
                currentAddress: `${address.name}, ${address.fullAddress}`,
                currentRoom: `${room.name}, miejsce ${space.number}`,
              });
            }
          }
        }
      }
    }
    return cards;
  }, [projects]);

  const addressCards = useMemo(() => {
    const cards: AddressCard[] = [];
    for (const project of projects) {
      for (const address of project.addresses) {
        cards.push({
          id: address.id,
          projectId: project.id,
          projectName: project.name,
          name: address.name,
          fullAddress: address.fullAddress,
          supplierName: address.supplierName,
          events: events.filter((event) => event.addressId === address.id),
        });
      }
    }
    return cards;
  }, [projects, events]);

  const filteredTenants = useMemo(() => {
    const source = searchInArchive ? [...tenantCards, ...archiveTenants] : tenantCards;
    const normalized = query.toLowerCase().trim();
    if (!normalized) return source;
    return source.filter((tenant) =>
      `${tenant.firstName} ${tenant.lastName} ${tenant.projectName} ${tenant.addressName} ${tenant.phone || ''}`.toLowerCase().includes(normalized)
    );
  }, [tenantCards, archiveTenants, searchInArchive, query]);

  const filteredAddresses = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return addressCards;
    return addressCards.filter((address) =>
      `${address.name} ${address.fullAddress} ${address.projectName} ${address.supplierName || ''}`.toLowerCase().includes(normalized)
    );
  }, [addressCards, query]);

  const handleLoadArchive = async () => {
    const archive = await loadEvictionArchive();
    const archived = archive.map((entry): TenantCard => ({
      id: entry.id || generateId(),
      firstName: entry.firstName || 'Nieznany',
      lastName: entry.lastName || 'Mieszkaniec',
      gender: entry.gender || 'male',
      birthYear: entry.birthYear || 1995,
      checkInDate: entry.checkInDate || '-',
      monthlyPrice: entry.monthlyPrice || 0,
      phone: entry.phone,
      projectId: entry.projectId,
      projectName: entry.projectName || '-',
      addressId: entry.addressId,
      addressName: entry.addressName || '-',
      currentAddress: 'Archiwum',
      currentRoom: entry.roomName || '-',
      isArchived: true,
      evictionDate: entry.checkOutDate,
      evictionReason: entry.reason,
    }));
    return archived;
  };

  const handleRestoreTenant = async (projectId: string, addressId: string) => {
    try {
      await restoreTenantFromArchive(archiveEntryId, projectId, addressId);
      setRestoreDialogVisible(false);
      setSelectedTenant(null);
      Alert.alert('Sukces', 'Mieszkaniec został przywrócony do projektu.');
      const data = await loadData();
      setProjects(data);
    } catch (error) {
      console.error('Error restoring tenant:', error);
      Alert.alert('Błąd', 'Nie udało się przywrócić mieszkańca.');
    }
  };

  const renderTenant = ({ item }: { item: TenantCard }) => (
    <Pressable onPress={() => setSelectedTenant(item)}>
      <Card className="p-4 mb-3">
        <View className="gap-2">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-lg font-bold text-foreground">{item.firstName} {item.lastName}</Text>
                <GenderIcon gender={item.gender as any} showCount={false} size={14} />
              </View>
              <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
            </View>
            <View className="flex-row flex-wrap gap-2 justify-end">
              {item.status === 'do_wymeldowania' && <Badge variant="warning" size="sm" label="Do wymeldowania" />}
              {item.isArchived && <Badge variant="default" size="sm" label="Archiwum" />}
            </View>
          </View>
          <Text className="text-xs text-muted">{item.currentAddress}</Text>
          <Text className="text-xs text-muted">{item.currentRoom}</Text>
        </View>
      </Card>
    </Pressable>
  );

  const renderAddress = ({ item }: { item: AddressCard }) => (
    <Pressable onPress={() => router.push({ pathname: '/address-details', params: { projectId: item.projectId, addressId: item.id } })}>
      <Card className="p-4 mb-3">
        <View className="gap-2">
          <View className="flex-row justify-between items-start gap-3">
            <View className="flex-1">
              <Text className="text-lg font-bold text-foreground">{item.name}</Text>
              <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
            </View>
            {!!item.supplierName && <Badge variant="supplier" size="sm" label={item.supplierName} />}
          </View>
          <Text className="text-xs text-muted">{item.fullAddress}</Text>
          <Text className="text-xs text-muted">Zdarzenia: {item.events.length}</Text>
        </View>
      </Card>
    </Pressable>
  );

  if (selectedTenant) {
    const history = [
      ...(selectedTenant.residenceHistory || []).map((entry) => ({
        title: entry.addressName,
        date: `${entry.checkInDate} - ${entry.checkOutDate}`,
        subtitle: entry.projectName,
      })),
      {
        title: selectedTenant.currentAddress,
        date: selectedTenant.isArchived ? `Wymeldowanie: ${selectedTenant.evictionDate}` : `Od: ${selectedTenant.checkInDate}`,
        subtitle: selectedTenant.currentRoom,
      },
    ];

    return (
      <ScreenContainer className="p-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center gap-3 mb-6">
            <Pressable onPress={() => setSelectedTenant(null)} className="bg-surfaceVariant rounded-full p-2">
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">{selectedTenant.firstName} {selectedTenant.lastName}</Text>
              <Text className="text-sm text-muted mt-1">{selectedTenant.projectName}</Text>
            </View>
          </View>

          {selectedTenant.isArchived && (
            <Card className="p-4 mb-4 bg-warning/10 border-warning">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-warning font-bold">Mieszkaniec w archiwum</Text>
                  <Text className="text-xs text-muted mt-1">Powód: {getEvictionReasonLabel(selectedTenant.evictionReason as any)}</Text>
                </View>
                <Pressable onPress={() => { setArchiveEntryId(selectedTenant.id); setRestoreDialogVisible(true); }} className="bg-warning px-3 py-2 rounded-lg">
                  <Text className="text-white text-xs font-bold">Przywróć</Text>
                </Pressable>
              </View>
            </Card>
          )}

          <Card className="p-4 mb-4">
            <Text className="text-lg font-bold text-foreground mb-4">Informacje</Text>
            <View className="gap-3">
              <Text className="text-muted">Adres: <Text className="text-foreground">{selectedTenant.currentAddress}</Text></Text>
              <Text className="text-muted">Pokój: <Text className="text-foreground">{selectedTenant.currentRoom}</Text></Text>
              <Text className="text-muted">Telefon: <Text className="text-foreground">{selectedTenant.phone || '-'}</Text></Text>
              <Text className="text-muted">Stawka: <Text className="text-foreground">{selectedTenant.monthlyPrice} zł</Text></Text>
            </View>
          </Card>

          <Text className="text-lg font-bold text-foreground mb-3">Historia mieszkańca</Text>
          {history.map((entry, index) => (
            <Card key={`${entry.title}-${index}`} className="p-4 mb-3">
              <Text className="font-bold text-foreground">{entry.title}</Text>
              <Text className="text-xs text-muted mt-1">{entry.subtitle}</Text>
              <Text className="text-xs text-muted mt-1">{entry.date}</Text>
            </Card>
          ))}
        </ScrollView>
        <RestoreTenantDialog visible={restoreDialogVisible} projects={projects} onClose={() => setRestoreDialogVisible(false)} onRestore={handleRestoreTenant} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <Text className="text-3xl font-bold text-foreground mb-4">Szukaj</Text>

      <View className="flex-row gap-2 mb-4">
        {[
          { value: 'tenants' as const, label: 'Mieszkańcy' },
          { value: 'addresses' as const, label: 'Adresy' },
        ].map((tab) => (
          <Pressable key={tab.value} onPress={() => setActiveTab(tab.value)} className={`flex-1 py-2 rounded-lg items-center ${activeTab === tab.value ? 'bg-primary' : 'bg-surfaceVariant'}`}>
            <Text className={`font-semibold ${activeTab === tab.value ? 'text-white' : 'text-muted'}`}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-row items-center bg-surface border border-border rounded-xl px-4 mb-4">
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput className="flex-1 h-12 text-foreground ml-2" placeholder={activeTab === 'tenants' ? 'Imię, nazwisko, telefon...' : 'Adres, projekt, dostawca...'} placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <MaterialIcons name="cancel" size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {activeTab === 'tenants' && (
        <Pressable
          onPress={async () => {
            const next = !searchInArchive;
            setSearchInArchive(next);
            if (next) {
              const archived = await handleLoadArchive();
              setArchiveTenants(archived);
            } else {
              setArchiveTenants([]);
            }
          }}
          className="flex-row items-center gap-2 mb-4 px-1"
        >
          <View className={`w-5 h-5 rounded border items-center justify-center ${searchInArchive ? 'bg-primary border-primary' : 'border-muted'}`}>
            {searchInArchive && <MaterialIcons name="check" size={14} color="white" />}
          </View>
          <Text className="text-foreground font-medium">Uwzględnij archiwum</Text>
        </Pressable>
      )}

      <FlatList
        data={activeTab === 'tenants' ? filteredTenants : filteredAddresses}
        renderItem={activeTab === 'tenants' ? renderTenant as any : renderAddress as any}
        keyExtractor={(item: any, index) => `${item.id}-${index}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <MaterialIcons name={activeTab === 'tenants' ? 'person-search' : 'home-work'} size={64} color={colors.border} />
            <Text className="text-muted mt-4">Brak wyników</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
