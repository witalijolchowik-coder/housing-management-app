import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Tenant, EvictionFormData, EvictionReason } from '@/types';
import { Chip } from '@/components/ui/chip';

interface EvictionFormModalProps {
  visible: boolean;
  tenant?: Tenant;
  onClose: () => void;
  onSave: (data: EvictionFormData) => Promise<void>;
}

export function EvictionFormModal({
  visible,
  tenant,
  onClose,
  onSave,
}: EvictionFormModalProps) {
  const colors = useColors();
  const t = useTranslations();
  const [checkoutDate, setCheckoutDate] = useState('');
  const [reason, setReason] = useState<EvictionReason>('job_change');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      const today = new Date().toISOString().split('T')[0];
      setCheckoutDate(today);
      setReason('job_change');
    }
  }, [visible]);

  const handleSave = async () => {
    if (!checkoutDate.trim()) {
      alert(t.messages.savingError);
      return;
    }

    try {
      setLoading(true);
      await onSave({ checkoutDate, reason });
      onClose();
    } catch (error) {
      console.error('Error saving eviction:', error);
      alert(t.messages.savingError);
    } finally {
      setLoading(false);
    }
  };

  const reasons: { value: EvictionReason; label: string }[] = [
    { value: 'job_change', label: 'Smena pracy' },
    { value: 'own_housing', label: 'Własne mieszkanie' },
    { value: 'disciplinary', label: 'Dyscyplinarna' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background">
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
                  onPress={() => setReason(r.value)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="border-t border-border p-4">
          <Pressable
            onPress={handleSave}
            disabled={loading}
            className={`rounded-lg py-3 items-center ${
              loading ? 'bg-muted' : 'bg-primary'
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
