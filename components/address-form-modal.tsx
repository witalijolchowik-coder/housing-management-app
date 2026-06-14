import { View, Text, Pressable, Modal, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Address, AddAddressFormData, PaymentModel, Supplier } from '@/types';
import { applyPricesToAll, loadSuppliers } from '@/lib/store';
import { useLocalSearchParams } from 'expo-router';

interface AddressFormModalProps {
  visible: boolean;
  address?: Address;
  onClose: () => void;
  onSave: (data: AddAddressFormData) => Promise<void>;
}

const paymentOptions: Array<{ value: PaymentModel; label: string; note: string }> = [
  { value: 'per_space', label: 'Za miejsce', note: 'Koszt dostawcy liczony za aktywne/opłacane miejsce' },
  { value: 'per_room', label: 'Za pokój', note: 'Koszt pokoju dzieli się na miejsca w pokoju' },
  { value: 'whole_address', label: 'Za cały adres', note: 'Cały adres jest kosztem, dopóki jest aktywny' },
];

export function AddressFormModal({ visible, address, onClose, onSave }: AddressFormModalProps) {
  const colors = useColors();
  const t = useTranslations();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState<AddAddressFormData>({
    name: '',
    street: '',
    city: '',
    zipCode: '',
    fullAddress: '',
    totalSpaces: 0,
    regularRooms: 0,
    coupleRooms: 0,
    companyName: '',
    ownerName: '',
    phone: '',
    evictionPeriod: 14,
    totalCost: 0,
    supplierPricePerSpace: 0,
    supplierRoomPrice: 0,
    paymentModel: 'per_space',
    pricePerSpace: 0,
    couplePrice: 0,
    mediaFee: 450,
    supplierId: undefined,
    supplierName: '',
    isWholeAddress: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadSuppliers().then(setSuppliers).catch(() => setSuppliers([]));
    }

    if (address) {
      setFormData({
        name: address.name,
        street: address.street || '',
        city: address.city || '',
        zipCode: address.zipCode || '',
        fullAddress: address.fullAddress,
        totalSpaces: address.totalSpaces,
        regularRooms: address.rooms.filter((room) => room.type !== 'couple').length,
        coupleRooms: address.coupleRooms,
        companyName: address.companyName,
        ownerName: address.ownerName,
        phone: address.phone,
        evictionPeriod: address.evictionPeriod,
        totalCost: address.totalCost,
        supplierPricePerSpace: address.supplierPricePerSpace || 0,
        supplierRoomPrice: address.supplierRoomPrice || 0,
        paymentModel: address.paymentModel || (address.isWholeAddress ? 'whole_address' : 'per_space'),
        pricePerSpace: address.pricePerSpace,
        couplePrice: address.couplePrice || 0,
        mediaFee: address.mediaFee || 450,
        supplierId: address.supplierId,
        supplierName: address.supplierName || '',
        isWholeAddress: address.isWholeAddress || address.paymentModel === 'whole_address',
      });
    } else {
      setFormData((current) => ({
        ...current,
        name: '',
        street: '',
        city: '',
        zipCode: '',
        fullAddress: '',
        totalSpaces: 0,
        regularRooms: 0,
        coupleRooms: 0,
        companyName: '',
        ownerName: '',
        phone: '',
        evictionPeriod: 14,
        totalCost: 0,
        supplierPricePerSpace: 0,
        supplierRoomPrice: 0,
        paymentModel: 'per_space',
        pricePerSpace: 0,
        couplePrice: 0,
        supplierId: undefined,
        supplierName: '',
        isWholeAddress: false,
      }));
    }
  }, [address, visible]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.street.trim() || !formData.city.trim()) {
      Alert.alert('Błąd', 'Wypełnij wymagane pola: nazwa, ulica i miasto.');
      return;
    }

    const selectedSupplier = suppliers.find((supplier) => supplier.id === formData.supplierId);
    const fullAddress = `${formData.street}, ${formData.zipCode} ${formData.city}`.trim();
    const dataToSave = {
      ...formData,
      fullAddress,
      supplierName: selectedSupplier?.name,
      isWholeAddress: formData.paymentModel === 'whole_address',
    };

    try {
      setLoading(true);
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      Alert.alert('Błąd', t.messages.savingError);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToAll = async () => {
    if (!address || !projectId) return;

    Alert.alert('Zastosuj do wszystkich', 'Zastosować stawki mieszkańców do wszystkich osób na tym adresie?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Tak',
        onPress: async () => {
          try {
            setLoading(true);
            await applyPricesToAll(projectId, address.id, formData);
            Alert.alert('Sukces', 'Stawki zostały zastosowane.');
          } catch (error) {
            console.error('Error applying prices:', error);
            Alert.alert('Błąd', 'Nie udało się zastosować stawek.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
        <View className="flex-1 pt-12 pb-4">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-lg font-bold text-foreground">{address ? t.forms.editAddress : t.forms.addAddress}</Text>
            <Pressable onPress={handleSave} disabled={loading}>
              <MaterialIcons name="check" size={24} color={loading ? colors.muted : colors.primary} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">{t.forms.name} *</Text>
              <TextInput value={formData.name} onChangeText={(name) => setFormData({ ...formData, name })} placeholder={t.forms.name} placeholderTextColor={colors.muted} className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
            </View>

            <View className="mb-6 p-4 bg-surface/50 rounded-xl border border-border">
              <Text className="text-base font-bold text-foreground mb-4">Adres</Text>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Ulica i numer domu *</Text>
                <TextInput value={formData.street} onChangeText={(street) => setFormData({ ...formData, street })} placeholder="ul. Przykładowa 12/3" placeholderTextColor={colors.muted} className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-2">Kod</Text>
                  <TextInput value={formData.zipCode} onChangeText={(zipCode) => setFormData({ ...formData, zipCode })} placeholder="00-000" placeholderTextColor={colors.muted} className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
                </View>
                <View className="flex-[2]">
                  <Text className="text-sm font-semibold text-foreground mb-2">Miasto *</Text>
                  <TextInput value={formData.city} onChangeText={(city) => setFormData({ ...formData, city })} placeholder="Warszawa" placeholderTextColor={colors.muted} className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
                </View>
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">Dostawca</Text>
              <View className="gap-2">
                <Pressable onPress={() => setFormData({ ...formData, supplierId: undefined, supplierName: '' })} className={`p-3 rounded-lg border ${!formData.supplierId ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}>
                  <Text className="text-foreground font-medium">Brak dostawcy</Text>
                </Pressable>
                {suppliers.filter((supplier) => supplier.active || supplier.id === formData.supplierId).map((supplier) => (
                  <Pressable key={supplier.id} onPress={() => setFormData({ ...formData, supplierId: supplier.id, supplierName: supplier.name })} className={`p-3 rounded-lg border ${formData.supplierId === supplier.id ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}>
                    <Text className="text-foreground font-medium">{supplier.name}</Text>
                    {!!supplier.contactPerson && <Text className="text-muted text-xs mt-1">{supplier.contactPerson}</Text>}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">Opłata dostawcy</Text>
              <View className="gap-2">
                {paymentOptions.map((option) => (
                  <Pressable key={option.value} onPress={() => setFormData({ ...formData, paymentModel: option.value, isWholeAddress: option.value === 'whole_address' })} className={`p-3 rounded-lg border ${formData.paymentModel === option.value ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}>
                    <Text className="text-foreground font-semibold">{option.label}</Text>
                    <Text className="text-muted text-xs mt-1">{option.note}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Cena dostawcy za całe rozliczenie</Text>
              <TextInput value={formData.totalCost.toString()} onChangeText={(totalCost) => setFormData({ ...formData, totalCost: parseInt(totalCost) || 0 })} placeholder="3000" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-2">Cena dostawcy / miejsce</Text>
                <TextInput value={(formData.supplierPricePerSpace || 0).toString()} onChangeText={(supplierPricePerSpace) => setFormData({ ...formData, supplierPricePerSpace: parseInt(supplierPricePerSpace) || 0 })} placeholder="0" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-2">Cena dostawcy / pokój</Text>
                <TextInput value={(formData.supplierRoomPrice || 0).toString()} onChangeText={(supplierRoomPrice) => setFormData({ ...formData, supplierRoomPrice: parseInt(supplierRoomPrice) || 0 })} placeholder="0" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-2">Razem miejsc</Text>
                <TextInput value={formData.totalSpaces.toString()} onChangeText={(totalSpaces) => setFormData({ ...formData, totalSpaces: parseInt(totalSpaces) || 0 })} placeholder="20" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground mb-2">Okres wyp.</Text>
                <TextInput value={formData.evictionPeriod.toString()} onChangeText={(evictionPeriod) => setFormData({ ...formData, evictionPeriod: parseInt(evictionPeriod) || 14 })} placeholder="14" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
            </View>

            {!address && (
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-2">Zwykłe pokoje</Text>
                  <TextInput value={formData.regularRooms.toString()} onChangeText={(regularRooms) => setFormData({ ...formData, regularRooms: parseInt(regularRooms) || 0 })} placeholder="5" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-2">Pokoje dla par</Text>
                  <TextInput value={formData.coupleRooms.toString()} onChangeText={(coupleRooms) => setFormData({ ...formData, coupleRooms: parseInt(coupleRooms) || 0 })} placeholder="2" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
                </View>
              </View>
            )}

            <View className="mt-4 mb-6">
              <Text className="text-lg font-bold text-foreground mb-4">Stawki mieszkańców</Text>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Media</Text>
                <TextInput value={(formData.mediaFee || 0).toString()} onChangeText={(mediaFee) => setFormData({ ...formData, mediaFee: parseInt(mediaFee) || 0 })} placeholder="450" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Cena zwykłego miejsca</Text>
                <TextInput value={formData.pricePerSpace.toString()} onChangeText={(pricePerSpace) => setFormData({ ...formData, pricePerSpace: parseInt(pricePerSpace) || 0 })} placeholder="500" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Cena miejsca w pokoju dla par</Text>
                <TextInput value={(formData.couplePrice || 0).toString()} onChangeText={(couplePrice) => setFormData({ ...formData, couplePrice: parseInt(couplePrice) || 0 })} placeholder="800" placeholderTextColor={colors.muted} keyboardType="number-pad" className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground" editable={!loading} />
              </View>
              {address && (
                <Pressable onPress={handleApplyToAll} disabled={loading} className="bg-primary/10 border border-primary rounded-lg py-3 items-center mt-2">
                  <Text className="text-primary font-semibold">Zastosuj do wszystkich mieszkańców</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>

          <View className="border-t border-border p-4 pb-8">
            <Pressable onPress={handleSave} disabled={loading} className={`rounded-lg py-3 items-center ${loading ? 'bg-muted' : 'bg-primary'}`}>
              <Text className="text-white font-semibold">{loading ? t.common.loading : t.forms.submit}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
