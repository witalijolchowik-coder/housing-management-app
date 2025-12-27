import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Address, AddAddressFormData, OperatorType } from '@/types';

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
  const [formData, setFormData] = useState<AddAddressFormData>({
    name: '',
    fullAddress: '',
    totalSpaces: 0,
    coupleRooms: 0,
    companyName: '',
    ownerName: '',
    phone: '',
    evictionPeriod: 14,
    totalCost: 0,
    pricePerSpace: 0,
    couplePrice: 0,
    operator: 'rent_planet',
    operatorName: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name,
        fullAddress: address.fullAddress,
        totalSpaces: address.totalSpaces,
        coupleRooms: address.coupleRooms,
        companyName: address.companyName,
        ownerName: address.ownerName,
        phone: address.phone,
        evictionPeriod: address.evictionPeriod,
        totalCost: address.totalCost,
        pricePerSpace: address.pricePerSpace,
        couplePrice: address.couplePrice || 0,
        operator: address.operator || 'rent_planet',
        operatorName: address.operatorName || '',
      });
    } else {
      setFormData({
        name: '',
        fullAddress: '',
        totalSpaces: 0,
        coupleRooms: 0,
        companyName: '',
        ownerName: '',
        phone: '',
        evictionPeriod: 14,
        totalCost: 0,
        pricePerSpace: 0,
        couplePrice: 0,
        operator: 'rent_planet',
        operatorName: '',
      });
    }
  }, [address, visible]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.fullAddress.trim()) {
      alert(t.messages.savingError);
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      alert(t.messages.savingError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background pt-12 pb-20">
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

          {/* Full Address */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t.forms.fullAddress} *
            </Text>
            <TextInput
              value={formData.fullAddress}
              onChangeText={(text) => setFormData({ ...formData, fullAddress: text })}
              placeholder={t.forms.fullAddress}
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              editable={!loading}
            />
          </View>

          {/* Operator */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Dostawca *
            </Text>
            <View className="gap-2">
              {/* Rent Planet */}
              <Pressable
                onPress={() => setFormData({ ...formData, operator: 'rent_planet' })}
                className={`flex-row items-center p-3 rounded-lg border ${
                  formData.operator === 'rent_planet'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 ${
                    formData.operator === 'rent_planet'
                      ? 'bg-primary border-primary'
                      : 'border-muted'
                  }`}
                />
                <Text className="text-foreground font-medium">Rent Planet</Text>
              </Pressable>

              {/* E-Port */}
              <Pressable
                onPress={() => setFormData({ ...formData, operator: 'e_port' })}
                className={`flex-row items-center p-3 rounded-lg border ${
                  formData.operator === 'e_port'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 ${
                    formData.operator === 'e_port'
                      ? 'bg-primary border-primary'
                      : 'border-muted'
                  }`}
                />
                <Text className="text-foreground font-medium">E-Port</Text>
              </Pressable>

              {/* Other Operator */}
              <Pressable
                onPress={() => setFormData({ ...formData, operator: 'other' })}
                className={`flex-row items-center p-3 rounded-lg border ${
                  formData.operator === 'other'
                    ? 'bg-primary/20 border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 mr-3 ${
                    formData.operator === 'other'
                      ? 'bg-primary border-primary'
                      : 'border-muted'
                  }`}
                />
                <Text className="text-foreground font-medium">Inny dostawca</Text>
              </Pressable>

              {/* Custom Operator Name */}
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

          {/* Total Spaces */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t.forms.totalSpaces}
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

          {/* Couple Rooms */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t.forms.coupleRooms}
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

          {/* Total Cost */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t.forms.totalCost}
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

          {/* Price Per Space */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t.forms.pricePerSpace}
            </Text>
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

          {/* Couple Price */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Cena dla pary
            </Text>
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
        </ScrollView>

        {/* Save Button */}
        <View className="border-t border-border p-4 pb-8">
          <Pressable
            onPress={handleSave}
            disabled={loading}
            className={`rounded-lg py-3 items-center ${
              loading ? 'bg-muted' : 'bg-primary'
            }`}
          >
            <Text className="text-white font-semibold">
              {loading ? t.common.loading : t.forms.submit}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
