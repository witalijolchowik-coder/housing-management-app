import { Text, View, FlatList, Pressable, Image, Alert, Modal } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FAB } from '@/components/ui/fab';
import { AddressMenuModal } from '@/components/address-menu-modal';
import { AddressFormModal } from '@/components/address-form-modal';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Address, AddAddressFormData, OperatorType, Room } from '@/types';
import { loadData, calculateAddressStats, addAddress, updateAddress, deleteAddress, putAddressOnWypowiedzenie, removeAddressFromWypowiedzenie, updateAddressWypowiedzenieDates, isSpacePaid } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { DatePicker } from '@/components/ui/date-picker';

export default function AddressListScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const { projectId } = useLocalSearchParams();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | undefined>();
  const [wypowiedzenieDatesVisible, setWypowiedzenieDatesVisible] = useState(false);
  const [addressNoticeStartDate, setAddressNoticeStartDate] = useState('');
  const [addressNoticeEndDate, setAddressNoticeEndDate] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [projectId])
  );

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const projects = await loadData();
      const project = projects.find((p) => p.id === projectId);
      if (project) {
        setAddresses(project.addresses);
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressPress = (addressId: string) => {
    router.push({
      pathname: '/address-details',
      params: { projectId, addressId },
    });
  };

  const handleAddressMenu = (address: Address) => {
    setSelectedAddress(address);
    setMenuVisible(true);
  };

  const handleEditAddress = () => {
    if (selectedAddress) {
      setEditingAddress(selectedAddress);
      setFormVisible(true);
    }
  };

  const handleDeleteAddress = async () => {
    if (selectedAddress) {
      Alert.alert(
        t.common.delete,
        t.messages.confirmDelete,
        [
          { text: t.common.cancel, onPress: () => {} },
          {
            text: t.common.delete,
            onPress: async () => {
              try {
                await deleteAddress(projectId as string, selectedAddress.id);
                await loadAddresses();
              } catch (error: any) {
                if (error.message === 'HAS_RESIDENTS') {
                  Alert.alert(
                    'Błąd',
                    'Na adresie są mieszkańcy. Najpierw wymelduj ich albo przenieś, a dopiero potem usuń adres.'
                  );
                } else if (error.message === 'HAS_ACTIVE_NOTICE') {
                  Alert.alert(
                    'Nie mozna usunac adresu',
                    'Adres ma aktywne wypowiedzenie. Do konca tego okresu miejsca nadal sa oplacane.'
                  );
                } else {
                  console.error('Error deleting address:', error);
                }
              }
            },
            style: 'destructive',
          },
        ]
      );
    }
  };

  const handleWypowiedzenie = async () => {
    if (selectedAddress) {
      try {
        await putAddressOnWypowiedzenie(projectId as string, selectedAddress.id);
        await loadAddresses();
      } catch (error) {
        console.error('Error putting address on wypowiedzenie:', error);
      }
    }
  };

  const handleRemoveWypowiedzenie = async () => {
    if (selectedAddress) {
      try {
        await removeAddressFromWypowiedzenie(projectId as string, selectedAddress.id);
        await loadAddresses();
      } catch (error) {
        console.error('Error removing address from wypowiedzenie:', error);
      }
    }
  };

  const handleOpenAddressWypowiedzenieDates = () => {
    if (!selectedAddress) return;
    const noticeSpace = selectedAddress.rooms
      .flatMap((room) => room.spaces)
      .find((space) => space.wypowiedzenie?.groupedWithAddress || space.wypowiedzenie);
    setAddressNoticeStartDate(selectedAddress.addressWypowiedzienieStart || noticeSpace?.wypowiedzenie?.startDate || '');
    setAddressNoticeEndDate(selectedAddress.addressWypowiedzenieEnd || noticeSpace?.wypowiedzenie?.endDate || '');
    setWypowiedzenieDatesVisible(true);
  };

  const handleSaveAddressWypowiedzenieDates = async () => {
    if (!selectedAddress) return;
    try {
      await updateAddressWypowiedzenieDates(
        projectId as string,
        selectedAddress.id,
        addressNoticeStartDate,
        addressNoticeEndDate,
      );
      setWypowiedzenieDatesVisible(false);
      setSelectedAddress(null);
      await loadAddresses();
    } catch (error: any) {
      Alert.alert('Błąd', error.message || 'Nie udało się zapisać dat wypowiedzenia.');
    }
  };

  const handleSaveAddress = async (data: AddAddressFormData) => {
    try {
      if (editingAddress) {
        await updateAddress(projectId as string, editingAddress.id, data);
      } else {
        await addAddress(projectId as string, {
          ...data,
          photos: [],
          unassignedTenants: [],
        });
      }
      setEditingAddress(undefined);
      await loadAddresses();
    } catch (error) {
      console.error('Error saving address:', error);
      throw error;
    }
  };

  const renderAddressCard = ({ item }: { item: Address }) => {
    const stats = calculateAddressStats(item);
    const occupancyPercent = stats.paid > 0 ? Math.round((stats.occupied / stats.paid) * 100) : 0;
    const hasEvictions = stats.wypowiedzenie > 0;
    
    // Count actual tenants (not spaces)
    let tenantCount = 0;
    for (const room of item.rooms) {
      for (const space of room.spaces) {
        if (space.tenant) tenantCount++;
      }
    }
    
    // Calculate gender-based stats
    const genderStats = {
      male: { vacantPaid: 0, vacantTotal: 0 },
      female: { vacantPaid: 0, vacantTotal: 0 },
      couple: { vacantPaid: 0, vacantTotal: 0 },
      other: { vacantPaid: 0, vacantTotal: 0 },
    };

    for (const room of item.rooms) {
      const roomType = room.type || 'other';
      const bucket = roomType === 'male' || roomType === 'female' || roomType === 'couple' ? roomType : 'other';

      for (const space of room.spaces) {
        if (space.tenant || space.status === 'inactive') continue;
        genderStats[bucket].vacantTotal++;
        if (isSpacePaid(space)) {
          genderStats[bucket].vacantPaid++;
        }
      }
    }

    // Get operator name
    const getOperatorName = () => {
      if (item.supplierName) return item.supplierName;
      if (item.operator === 'rent_planet') return 'Rent Planet';
      if (item.operator === 'e_port') return 'E-Port';
      if (item.operator === 'other' && item.operatorName) return item.operatorName;
      return 'Brak operatora';
    };

    return (
      <Pressable
        onPress={() => handleAddressPress(item.id)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Card className="p-5 mb-4 overflow-hidden">
          <View className="gap-4">
            {/* Photo and Header */}
            <View className="flex-row gap-4">
              <View className="w-24 h-24 rounded-2xl bg-surfaceVariant items-center justify-center overflow-hidden">
                {item.photos && item.photos.length > 0 ? (
                  <Image
                    source={{ uri: item.photos[0] }}
                    className="w-full h-full rounded-lg"
                  />
                ) : (
                  <Image 
                    source={require('@/assets/images/address-placeholder.png')} 
                    style={{ width: 64, height: 64 }}
                    resizeMode="contain"
                  />
                )}
              </View>
              <View className="flex-1 justify-between">
                <View>
                  {/* Name and Operator Tag in one row */}
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-2 flex-wrap">
                        <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                        {(item.supplierName || (item.operator && item.operator !== 'other')) && (
                          <Badge variant="supplier" size="sm" label={getOperatorName()} />
                        )}
                        {!item.supplierName && item.operator === 'other' && item.operatorName && (
                          <Badge variant="supplier" size="sm" label={item.operatorName} />
                        )}
                      </View>
                      {/* Full Address on next row */}
                      <Text className="text-sm text-muted mt-1">{item.fullAddress}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleAddressMenu(item)}
                      className="bg-surfaceVariant/60 rounded-full p-2"
                    >
                      <MaterialIcons name="more-vert" size={20} color={colors.muted} />
                    </Pressable>
                  </View>
                </View>
                
                <View className="flex-col gap-2">
                  <View className="flex-row items-center gap-2">
                    <MaterialIcons name="person" size={16} color={colors.success} />
                    <Text className="text-sm font-semibold text-foreground">{tenantCount}</Text>
                  </View>
                  {item.status === 'wypowiedzenie' && (
                    <Badge variant="warning" size="sm" label="Wypowiedzenie" />
                  )}
                </View>
              </View>
            </View>

            {/* Gender-based Stats */}
            <View className="pt-2 border-t border-border/30">
              <Text className="text-xs font-bold text-muted mb-2 uppercase tracking-wider">Wolne miejsca</Text>
              <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                <View className="flex-row items-center gap-1.5">
                  <MaterialIcons name="male" size={18} color={colors.primary} />
                  <Text className="text-sm font-bold text-foreground">
                    {genderStats.male.vacantPaid} <Text className="text-muted font-normal">({genderStats.male.vacantTotal})</Text>
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <MaterialIcons name="female" size={18} color={colors.error} />
                  <Text className="text-sm font-bold text-foreground">
                    {genderStats.female.vacantPaid} <Text className="text-muted font-normal">({genderStats.female.vacantTotal})</Text>
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <MaterialIcons name="favorite" size={16} color={colors.warning} />
                  <Text className="text-sm font-bold text-foreground">
                    {genderStats.couple.vacantPaid} <Text className="text-muted font-normal">({genderStats.couple.vacantTotal})</Text>
                  </Text>
                </View>
                {genderStats.other.vacantTotal > 0 && (
                  <View className="flex-row items-center gap-1.5">
                    <MaterialIcons name="help-outline" size={16} color={colors.muted} />
                    <Text className="text-sm font-bold text-foreground">
                      {genderStats.other.vacantPaid} <Text className="text-muted font-normal">({genderStats.other.vacantTotal})</Text>
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Statistics */}
            <View className="gap-3 pt-3 border-t border-border/30">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">
                  {stats.occupied}/{stats.paid} {t.addressList.occupied}
                </Text>
                <Text className="text-sm font-semibold text-primary">{occupancyPercent}%</Text>
              </View>
              <ProgressBar progress={occupancyPercent} />
            </View>

            {/* Badges */}
            <View className="flex-row flex-wrap gap-3 items-center">
              {hasEvictions && (
                <Badge variant="warning" size="sm" label={`${stats.wypowiedzenie} ${t.roomDetails.eviction}`} />
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row items-center gap-3 mb-6">
        <Pressable
          onPress={() => router.back()}
          className="bg-surfaceVariant rounded-full p-2"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </Pressable>
        <Text className="text-2xl font-bold text-foreground flex-1">{t.addressList.title}</Text>
      </View>

      {/* Addresses List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : addresses.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.messages.emptyProject}</Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          renderItem={renderAddressCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* FAB */}
      <FAB 
        icon="add" 
        onPress={() => {
          setEditingAddress(undefined);
          setFormVisible(true);
        }}
        bottom={90}
      />

      {/* Modals */}
      <AddressMenuModal
        visible={menuVisible}
        address={selectedAddress || undefined}
        onClose={() => setMenuVisible(false)}
        onEdit={handleEditAddress}
        onDelete={handleDeleteAddress}
        onWypowiedzenie={handleWypowiedzenie}
        onRemoveWypowiedzenie={handleRemoveWypowiedzenie}
        onEditWypowiedzenieDates={handleOpenAddressWypowiedzenieDates}
      />

      <AddressFormModal
        visible={formVisible}
        address={editingAddress}
        onClose={() => {
          setFormVisible(false);
          setEditingAddress(undefined);
        }}
        onSave={handleSaveAddress}
      />

      <Modal
        visible={wypowiedzenieDatesVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWypowiedzenieDatesVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center p-4"
          onPress={() => setWypowiedzenieDatesVisible(false)}
        >
          <Pressable className="bg-surface w-full max-w-sm p-6 rounded-2xl gap-4">
            <Text className="text-lg font-bold text-foreground text-center">
              Daty wypowiedzenia adresu
            </Text>
            <DatePicker
              value={addressNoticeStartDate}
              onChange={setAddressNoticeStartDate}
              label="Data rozpoczęcia"
              placeholder="Wybierz datę"
            />
            <DatePicker
              value={addressNoticeEndDate}
              onChange={setAddressNoticeEndDate}
              label="Data zakończenia"
              placeholder="Wybierz datę"
            />
            <Pressable
              onPress={handleSaveAddressWypowiedzenieDates}
              className="bg-primary py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Zapisz</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}
