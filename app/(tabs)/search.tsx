import { View, Text, TextInput, Pressable, FlatList, ScrollView, Alert } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, Tenant } from '@/types';
import { loadData } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';

interface TenantWithHistory extends Tenant {
  projectName: string;
  addressName: string;
  roomNumber: number | string;
  currentAddress: string;
  currentRoom: string;
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

    // Add current residence
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

    // Eviction history is handled through the archive system
    // which is stored separately in AsyncStorage

    // Sort by date (newest first)
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const query = searchQuery.toLowerCase().trim();
      const results: TenantWithHistory[] = [];

      for (const project of projects) {
        for (const address of project.addresses) {
          for (const room of address.rooms) {
            for (const space of room.spaces) {
              if (space.tenant) {
                const firstName = space.tenant.firstName.toLowerCase();
                const lastName = space.tenant.lastName.toLowerCase();
                const fullName = `${firstName} ${lastName}`;

                if (
                  firstName.includes(query) ||
                  lastName.includes(query) ||
                  fullName.includes(query)
                ) {
                  const tenant = buildTenantHistory(space.tenant);
                  tenant.projectName = project.name;
                  tenant.addressName = address.name;
                  tenant.roomNumber = space.number;
                  tenant.currentAddress = `${address.name}, ${address.fullAddress}`;
                  tenant.currentRoom = room.name;

                  // Avoid duplicates
                  if (!results.some((r) => r.id === tenant.id)) {
                    results.push(tenant);
                  }
                }
              }
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
              <Text className="text-lg font-bold text-foreground">
                {item.firstName} {item.lastName} <Text className="text-muted">({item.birthYear})</Text>
              </Text>
              <Text className="text-sm text-muted mt-1">{item.projectName}</Text>
            </View>
            <Badge
              variant={item.gender === 'male' ? 'info' : 'warning'}
              size="sm"
              label={item.gender === 'male' ? '♂' : '♀'}
            />
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
          {/* Header */}
          <View className="flex-row items-center gap-3 mb-6">
            <Pressable
              onPress={() => setSelectedTenant(null)}
              className="bg-surfaceVariant rounded-full p-2"
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
            </Pressable>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">
                {selectedTenant.firstName} {selectedTenant.lastName} <Text className="text-muted">({selectedTenant.birthYear})</Text>
              </Text>
              <Text className="text-sm text-muted mt-1">{selectedTenant.projectName}</Text>
            </View>
          </View>

          {/* Basic Info */}
          <Card className="p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">Dane osobowe</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Płeć</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {selectedTenant.gender === 'male' ? 'Mężczyzna' : 'Kobieta'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted">Rok urodzenia</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedTenant.birthYear}</Text>
              </View>
            </View>
          </Card>

          {/* Current Residence */}
          <Card className="p-4 mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">Obecne zameldowanie</Text>
            <View className="gap-2">
              <View>
                <Text className="text-xs text-muted">Projekt</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedTenant.projectName}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted">Adres</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedTenant.currentAddress}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted">Pokój</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedTenant.currentRoom}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted">Data zameldowania</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedTenant.checkInDate}</Text>
              </View>
              <View>
                <Text className="text-xs text-muted">Cena miesięczna</Text>
                <Text className="text-sm font-semibold text-foreground">{selectedTenant.monthlyPrice} PLN</Text>
              </View>
            </View>
          </Card>

          {/* History */}
          {selectedTenant.history.length > 0 && (
            <Card className="p-4 mb-4">
              <Text className="text-sm font-semibold text-foreground mb-3">Historia zameldowań</Text>
              <View className="gap-3">
                {selectedTenant.history.map((item, index) => (
                  <View key={index.toString()} className="pb-3 border-b border-border last:border-b-0">
                    <View className="gap-1">
                      <Text className="text-sm font-semibold text-foreground">{item.projectName}</Text>
                      <Text className="text-xs text-muted">{item.addressName}</Text>
                      <Text className="text-xs text-muted">
                        Od: {item.checkInDate}
                        {item.checkOutDate && ` Do: ${item.checkOutDate}`}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <Text className="text-2xl font-bold text-foreground mb-6">{t.search.title}</Text>

      {/* Search Bar */}
      <View className="flex-row gap-2 mb-6">
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Imię lub nazwisko..."
          placeholderTextColor={colors.muted}
          className="flex-1 bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
        />
        <Pressable
          onPress={handleSearch}
          disabled={loading}
          className="bg-primary rounded-lg px-4 py-3 items-center justify-center"
        >
          <MaterialIcons name="search" size={24} color="white" />
        </Pressable>
      </View>

      {/* Clear Results Button */}
      {searchResults.length > 0 && (
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-sm font-semibold text-foreground">
            Znaleziono: {searchResults.length}
          </Text>
          <Pressable
            onPress={handleClearResults}
            className="flex-row items-center gap-1 bg-surfaceVariant rounded-lg px-3 py-2"
          >
            <MaterialIcons name="close" size={16} color={colors.muted} />
            <Text className="text-xs text-muted">Wyczyść</Text>
          </Pressable>
        </View>
      )}

      {/* Search Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : searchResults.length === 0 && searchQuery ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Nie znaleziono wyników</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenContainer>
  );
}
