import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Tenant, EvictionFormData, EvictionReason, Address } from '@/types';
import { Chip } from '@/components/ui/chip';

interface EvictionFormModalProps {
  visible: boolean;
  tenant?: Tenant;
  projectAddresses?: Address[]; // All addresses in the project for relocation
  currentAddressId?: string; // Current address ID to exclude from relocation options
  onClose: () => void;
  onSave: (data: EvictionFormData & { targetAddressId?: string }) => Promise<void>;
}

export function EvictionFormModal({
  visible,
  tenant,
  projectAddresses = [],
  currentAddressId,
  onClose,
  onSave,
}: EvictionFormModalProps) {
  const colors = useColors();
  const t = useTranslations();
  const [checkoutDate, setCheckoutDate] = useState('');
  const [reason, setReason] = useState<EvictionReason>('own_housing');
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  // Filter out current address for relocation options
  const availableAddresses = projectAddresses.filter(addr => addr.id !== currentAddressId);

  useEffect(() => {
    if (visible) {
      const today = new Date().toISOString().split('T')[0];
      setCheckoutDate(today);
      setReason('own_housing');
      setSelectedAddressId(undefined);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!checkoutDate.trim()) {
      alert(t.messages.savingError);
      return;
    }

    // If relocation reason is selected, require address selection
    if (reason === 'relocation' && !selectedAddressId) {
      alert('Wybierz adres do przeprowadzki');
      return;
    }

    try {
      setLoading(true);
      await onSave({ 
        checkoutDate, 
        reason,
        targetAddressId: reason === 'relocation' ? selectedAddressId : undefined
      });
      onClose();
    } catch (error) {
      console.error('Error saving eviction:', error);
      alert(t.messages.savingError);
    } finally {
      setLoading(false);
    }
  };

  const reasons: { value: EvictionReason; label: string }[] = [
    { value: 'own_housing', label: 'Переселился на свое жилье' },
    { value: 'job_change', label: 'Сменил работу' },
    { value: 'disciplinary', label: 'Дисциплинарно' },
    { value: 'relocation', label: 'Переселение на другой адрес' },
  ];

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
            Wymeldowanie
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
          {/* Tenant Info */}
          {tenant && (
            <View className="bg-surface rounded-lg p-4 mb-6">
              <Text className="text-sm text-muted">Mieszkaniec</Text>
              <Text className="text-lg font-bold text-foreground mt-1">
                {tenant.firstName} {tenant.lastName}
              </Text>
              <Text className="text-sm text-muted mt-2">
                Zameldowany: {tenant.checkInDate}
              </Text>
            </View>
          )}

          {/* Checkout Date */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Data wymeldowania *
            </Text>
            <TextInput
              value={checkoutDate}
              onChangeText={setCheckoutDate}
              placeholder="2025-01-15"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              editable={!loading}
            />
            <Text className="text-xs text-muted mt-2">
              Format: YYYY-MM-DD
            </Text>
          </View>

          {/* Reason */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Przyczyna wymeldowania *
            </Text>
            <View className="gap-2">
              {reasons.map((r) => (
                <Chip
                  key={r.value}
                  label={r.label}
                  selected={reason === r.value}
                  onPress={() => {
                    setReason(r.value);
                    if (r.value !== 'relocation') {
                      setSelectedAddressId(undefined);
                    }
                  }}
                />
              ))}
            </View>
          </View>

          {/* Address Selection (only shown for relocation) */}
          {reason === 'relocation' && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Wybierz adres *
              </Text>
              {availableAddresses.length === 0 ? (
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-muted text-center">
                    На проекте нет больше адресов
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {availableAddresses.map((addr) => (
                    <Pressable
                      key={addr.id}
                      onPress={() => setSelectedAddressId(addr.id)}
                      className={`rounded-lg p-4 border ${
                        selectedAddressId === addr.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <Text className={`font-semibold ${
                        selectedAddressId === addr.id ? 'text-primary' : 'text-foreground'
                      }`}>
                        {addr.name}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {addr.fullAddress}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View className="border-t border-border p-4">
          <Pressable
            onPress={handleSave}
            disabled={loading || (reason === 'relocation' && !selectedAddressId)}
            className={`rounded-lg py-3 items-center ${
              loading || (reason === 'relocation' && !selectedAddressId) ? 'bg-muted' : 'bg-primary'
            }`}
          >
            <Text className="text-white font-semibold">
              {loading ? t.common.loading : 'Potwierdź wymeldowanie'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
