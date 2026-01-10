import { View, Text, Pressable, Modal, ScrollView, TextInput, Switch, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Address, AddAddressFormData, OperatorType } from '@/types';
import { applyPricesToAll } from '@/lib/store';
import { useLocalSearchParams } from 'expo-router';

interface AddressFormModalProps {
  visible: boolean;
  address?: Address;
  onClose: () => void;
  onSave: (data: AddAddressFormData) => Promise<void>;
}

export function AddressFormModal({
  visible,
  address,
  onClose,
  onSave,
}: AddressFormModalProps) {
  const colors = useColors();
  const t = useTranslations();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
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
    pricePerSpace: 0,
    couplePrice: 0,
    mediaFee: 450,
    operator: 'rent_planet',
    operatorName: '',
    isWholeAddress: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      const regularRoomsCount = address.rooms.filter(r => r.type !== 'couple').length;
      setFormData({
        name: address.name,
        street: address.street || '',
        city: address.city || '',
        zipCode: address.zipCode || '',
        fullAddress: address.fullAddress,
        totalSpaces: address.totalSpaces,
        regularRooms: regularRoomsCount,
        coupleRooms: address.coupleRooms,
        companyName: address.companyName,
        ownerName: address.ownerName,
        phone: address.phone,
        evictionPeriod: address.evictionPeriod,
        totalCost: address.totalCost,
        pricePerSpace: address.pricePerSpace,
        couplePrice: address.couplePrice || 0,
        mediaFee: address.mediaFee ?? 450,
        operator: address.operator || 'rent_planet',
        operatorName: address.operatorName || '',
        isWholeAddress: address.isWholeAddress || false,
      });
    } else {
      setFormData({
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
        pricePerSpace: 0,
        couplePrice: 0,
        mediaFee: 450,
        operator: 'rent_planet',
        operatorName: '',
        isWholeAddress: false,
      });
    }
  }, [address, visible]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.street.trim() || !formData.city.trim()) {
      alert('Proszę wypełнить wymagane pola (Nazwa, Ulica, Miasto)');
      return;
    }

    // Construct full address for backward compatibility
    const fullAddress = `${formData.street}, ${formData.zipCode} ${formData.city}`.trim();
    const dataToSave = { ...formData, fullAddress };

    try {
      setLoading(true);
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      alert(t.messages.savingError);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToAll = async () => {
    if (!address || !projectId) return;

    Alert.alert(
      'Zastosuj do wszystkich',
      'Czy na pewno chcesz zastosować te stawki do wszystkich mieszkańców tego adresu?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Tak, zastosuj',
          onPress: async () => {
            try {
              setLoading(true);
              await applyPricesToAll(projectId, address.id, formData);
              Alert.alert('Sukces', 'Stawki zostały zastosowane do wszystkich mieszkańców');
            } catch (error) {
              console.error('Error applying prices:', error);
              Alert.alert('Błąd', 'Wystąpiл błąd podczas stosowania stawek');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-background"
      >
        <View className="flex-1 pt-12 pb-4">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-lg font-bold text-foreground">
              {address ? t.forms.editAddress : t.forms.addAddress}
            </Text>
            <Pressable onPress={handleSave} disabled={loading}>
              <MaterialIcons 
                name="check" 
                size={24} 
                color={loading ? colors.muted : colors.primary} 
              />
            </Pressable>
          </View>

          {/* Form */}
          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                {t.forms.name} *
              </Text>
              <TextInput
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder={t.forms.name}
                placeholderTextColor={colors.muted}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Address Block */}
            <View className="mb-6 p-4 bg-surface/50 rounded-xl border border-border">
              <Text className="text-base font-bold text-foreground mb-4">Adres</Text>
              
              {/* Street and House Number */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Ulica i numer domu *
                </Text>
                <TextInput
                  value={formData.street}
                  onChangeText={(text) => setFormData({ ...formData, street: text })}
                  placeholder="ul. Przykładowa 12/3"
                  placeholderTextColor={colors.muted}
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  editable={!loading}
                />
              </View>

              <View className="flex-row gap-4">
                {/* Zip Code */}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Kod pocztowy
                  </Text>
                  <TextInput
                    value={formData.zipCode}
                    onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                    placeholder="00-000"
                    placeholderTextColor={colors.muted}
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                    editable={!loading}
                  />
                </View>

                {/* City */}
                <View className="flex-[2]">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Miasto *
                  </Text>
                  <TextInput
                    value={formData.city}
                    onChangeText={(text) => setFormData({ ...formData, city: text })}
                    placeholder="Warszawa"
                    placeholderTextColor={colors.muted}
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                    editable={!loading}
                  />
                </View>
              </View>
            </View>

            {/* Whole Address Toggle */}
            <View className="mb-6 flex-row items-center justify-between bg-surface p-4 rounded-lg border border-border">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-semibold text-foreground">
                  Adres wynajmowany w całości
                </Text>
                <Text className="text-xs text-muted mt-1">
                  Wyłącza powiadomienia o pustych miejscach
                </Text>
              </View>
              <Switch
                value={formData.isWholeAddress}
                onValueChange={(value) => setFormData({ ...formData, isWholeAddress: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Operator */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Dostawca *
              </Text>
              <View className="gap-2">
                <Pressable
                  onPress={() => setFormData({ ...formData, operator: 'rent_planet' })}
                  className={`flex-row items-center p-3 rounded-lg border ${
                    formData.operator === 'rent_planet'
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 ${formData.operator === 'rent_planet' ? 'bg-primary border-primary' : 'border-muted'}`} />
                  <Text className="text-foreground font-medium">Rent Planet</Text>
                </Pressable>

                <Pressable
                  onPress={() => setFormData({ ...formData, operator: 'e_port' })}
                  className={`flex-row items-center p-3 rounded-lg border ${
                    formData.operator === 'e_port'
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 ${formData.operator === 'e_port' ? 'bg-primary border-primary' : 'border-muted'}`} />
                  <Text className="text-foreground font-medium">E-Port</Text>
                </Pressable>

                <Pressable
                  onPress={() => setFormData({ ...formData, operator: 'other' })}
                  className={`flex-row items-center p-3 rounded-lg border ${
                    formData.operator === 'other'
                      ? 'bg-primary/20 border-primary'
                      : 'bg-surface border-border'
                  }`}
                >
                  <View className={`w-5 h-5 rounded-full border-2 mr-3 ${formData.operator === 'other' ? 'bg-primary border-primary' : 'border-muted'}`} />
                  <Text className="text-foreground font-medium">Inny dostawca</Text>
                </Pressable>

                {formData.operator === 'other' && (
                  <TextInput
                    value={formData.operatorName || ''}
                    onChangeText={(text) => setFormData({ ...formData, operatorName: text })}
                    placeholder="Nazwa dostawcy"
                    placeholderTextColor={colors.muted}
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground mt-2"
                    editable={!loading}
                  />
                )}
              </View>
            </View>

            {/* Cena dostawcy */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Cena dostawcy
              </Text>
              <TextInput
                value={formData.totalCost.toString()}
                onChangeText={(text) => setFormData({ ...formData, totalCost: parseInt(text) || 0 })}
                placeholder="10000"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Total Spaces */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Razem miejsc
              </Text>
              <TextInput
                value={formData.totalSpaces.toString()}
                onChangeText={(text) => setFormData({ ...formData, totalSpaces: parseInt(text) || 0 })}
                placeholder="20"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Regular Rooms */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Liczba zwykłych pokoi
              </Text>
              <TextInput
                value={formData.regularRooms.toString()}
                onChangeText={(text) => setFormData({ ...formData, regularRooms: parseInt(text) || 0 })}
                placeholder="5"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Couple Rooms */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                Liczba pokoi для par
              </Text>
              <TextInput
                value={formData.coupleRooms.toString()}
                onChangeText={(text) => setFormData({ ...formData, coupleRooms: parseInt(text) || 0 })}
                placeholder="2"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Owner Name */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                {t.forms.ownerName}
              </Text>
              <TextInput
                value={formData.ownerName}
                onChangeText={(text) => setFormData({ ...formData, ownerName: text })}
                placeholder={t.forms.ownerName}
                placeholderTextColor={colors.muted}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Phone */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                {t.forms.phone}
              </Text>
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder={t.forms.phone}
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Eviction Period */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">
                {t.forms.evictionPeriod}
              </Text>
              <TextInput
                value={formData.evictionPeriod.toString()}
                onChangeText={(text) => setFormData({ ...formData, evictionPeriod: parseInt(text) || 14 })}
                placeholder="14"
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            {/* Pricing Section */}
            <View className="mt-4 mb-6">
              <Text className="text-lg font-bold text-foreground mb-4">Płata za mieszkanie</Text>
              
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Kwota za media</Text>
                <TextInput
                  value={formData.mediaFee?.toString() || '450'}
                  onChangeText={(text) => setFormData({ ...formData, mediaFee: parseInt(text) || 0 })}
                  placeholder="450"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  editable={!loading}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Cena za mieszkanie</Text>
                <TextInput
                  value={formData.pricePerSpace.toString()}
                  onChangeText={(text) => setFormData({ ...formData, pricePerSpace: parseInt(text) || 0 })}
                  placeholder="500"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  editable={!loading}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Cena za mieszkanie – Pary</Text>
                <TextInput
                  value={formData.couplePrice?.toString() || '0'}
                  onChangeText={(text) => setFormData({ ...formData, couplePrice: parseInt(text) || 0 })}
                  placeholder="800"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                  editable={!loading}
                />
              </View>

              {address && (
                <Pressable
                  onPress={handleApplyToAll}
                  disabled={loading}
                  className="bg-primary/10 border border-primary rounded-lg py-3 items-center mt-2"
                >
                  <Text className="text-primary font-semibold">Zastosuj do wszystkich</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>

          {/* Save Button */}
          <View className="border-t border-border p-4 pb-8">
            <Pressable
              onPress={handleSave}
              disabled={loading}
              className={`rounded-lg py-3 items-center ${loading ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className="text-white font-semibold">
                {loading ? t.common.loading : t.forms.submit}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
