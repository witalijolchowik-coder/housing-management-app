import { View, Text, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Tenant, EvictionFormData, EvictionReason, Address } from '@/types';
import { DatePicker } from '@/components/ui/date-picker';

interface EvictionFormModalProps {
  visible: boolean;
  tenant?: Tenant;
  projectAddresses?: Address[];
  currentAddressId?: string;
  onClose: () => void;
  onSave: (data: EvictionFormData & { targetAddressId?: string }) => Promise<void>;
}

const reasons: { value: EvictionReason; label: string }[] = [
  { value: 'own_housing', label: 'Przeprowadził się na własne mieszkanie' },
  { value: 'job_change', label: 'Zmienił pracę' },
  { value: 'disciplinary', label: 'Dyscyplinarnie' },
  { value: 'relocation', label: 'Przesiedlenie na inny adres' },
];

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

  const availableAddresses = projectAddresses.filter((addr) => addr.id !== currentAddressId);

  useEffect(() => {
    if (visible) {
      setCheckoutDate(new Date().toISOString().split('T')[0]);
      setReason('own_housing');
      setSelectedAddressId(undefined);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!checkoutDate.trim()) {
      Alert.alert('Błąd', 'Wybierz datę wymeldowania.');
      return;
    }

    if (reason === 'relocation' && !selectedAddressId) {
      Alert.alert('Błąd', 'Wybierz adres do przesiedlenia.');
      return;
    }

    const reasonLabel = reasons.find((item) => item.value === reason)?.label || reason;
    const targetAddress = reason === 'relocation' && selectedAddressId
      ? availableAddresses.find((address) => address.id === selectedAddressId)
      : null;

    const confirmMessage = tenant
      ? `Czy na pewno chcesz wymeldować ${tenant.firstName} ${tenant.lastName}?\n\nData wymeldowania: ${checkoutDate}\nPrzyczyna: ${reasonLabel}${targetAddress ? `\nNowy adres: ${targetAddress.name}` : ''}`
      : `Czy na pewno chcesz wymeldować tego mieszkańca?\n\nData: ${checkoutDate}\nPrzyczyna: ${reasonLabel}`;

    Alert.alert('Potwierdzenie wymeldowania', confirmMessage, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Potwierdź',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await onSave({
              checkoutDate,
              reason,
              targetAddressId: reason === 'relocation' ? selectedAddressId : undefined,
            });
            onClose();
          } catch (error) {
            console.error('Error saving eviction:', error);
            Alert.alert('Błąd', t.messages.savingError);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-background pt-12 pb-20">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Pressable onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">Wymeldowanie</Text>
          <Pressable onPress={handleSave} disabled={loading}>
            <MaterialIcons name="check" size={24} color={loading ? colors.muted : colors.primary} />
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
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

          <View className="mb-6">
            <DatePicker
              value={checkoutDate}
              onChange={setCheckoutDate}
              label="Data wymeldowania *"
              placeholder="Wybierz datę"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-semibold text-foreground mb-3">
              Przyczyna wymeldowania *
            </Text>
            <View className="gap-3">
              {reasons.map((item) => (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setReason(item.value);
                    if (item.value !== 'relocation') {
                      setSelectedAddressId(undefined);
                    }
                  }}
                  className="flex-row items-center gap-3 bg-surface rounded-lg p-4 border border-border"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View
                    className="w-6 h-6 rounded-full border-2 items-center justify-center"
                    style={{ borderColor: reason === item.value ? colors.primary : colors.border }}
                  >
                    {reason === item.value && (
                      <View className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }} />
                    )}
                  </View>
                  <Text className="flex-1 text-foreground">{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {reason === 'relocation' && (
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">
                Wybierz adres *
              </Text>
              {availableAddresses.length === 0 ? (
                <View className="bg-surface rounded-lg p-4 border border-border">
                  <Text className="text-muted text-center">
                    W projekcie nie ma innych adresów do przesiedlenia.
                  </Text>
                </View>
              ) : (
                <View className="gap-2">
                  {availableAddresses.map((address) => (
                    <Pressable
                      key={address.id}
                      onPress={() => setSelectedAddressId(address.id)}
                      className={`rounded-lg p-4 border ${
                        selectedAddressId === address.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <Text className={`font-semibold ${selectedAddressId === address.id ? 'text-primary' : 'text-foreground'}`}>
                        {address.name}
                      </Text>
                      <Text className="text-sm text-muted mt-1">{address.fullAddress}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>

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
