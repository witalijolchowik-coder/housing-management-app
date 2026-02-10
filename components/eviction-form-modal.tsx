import { Modal, View, Text, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { EvictionFormData } from '@/types';
import { EVICTION_REASONS } from '@/lib/eviction-reasons';

interface EvictionFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: EvictionFormData) => void;
}

export const EvictionFormModal = ({ visible, onClose, onSave }: EvictionFormModalProps) => {
  const colors = useColors();
  const [reason, setReason] = useState<'relocation' | 'job_change' | 'own_housing' | 'other'>('relocation');
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (reason === 'other' && !otherReason.trim()) {
      Alert.alert('Błąd', 'Proszę podać powód wymeldowania');
      return;
    }

    onSave({
      reason,
      otherReason: reason === 'other' ? otherReason : undefined,
      notes,
    });
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-background rounded-t-3xl p-6 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground">Wymeldowanie mieszkańca</Text>
            <Pressable onPress={onClose} className="p-2">
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
            {/* Reason Selection */}
            <Text className="text-lg font-semibold text-foreground mb-3">Powód wymeldowania</Text>
            <View className="gap-2 mb-6">
              {EVICTION_REASONS.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setReason(option.value)}
                  className={`flex-row items-center p-4 rounded-lg border-2 ${
                    reason === option.value
                      ? `border-primary bg-primary/10`
                      : `border-border bg-surfaceVariant`
                  }`}
                >
                  <View
                    className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      reason === option.value
                        ? `border-primary bg-primary`
                        : `border-muted`
                    }`}
                  >
                    {reason === option.value && (
                      <View className="w-3 h-3 bg-background rounded-full" />
                    )}
                  </View>
                  <Text className="text-foreground font-medium flex-1">{option.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Other Reason Input */}
            {reason === 'other' && (
              <View className="mb-6">
                <Text className="text-sm font-semibold text-foreground mb-2">Podaj powód</Text>
                <TextInput
                  className="border border-border rounded-lg p-3 bg-surfaceVariant text-foreground"
                  placeholder="Wpisz powód wymeldowania..."
                  placeholderTextColor={colors.muted}
                  value={otherReason}
                  onChangeText={setOtherReason}
                />
              </View>
            )}

            {/* Notes */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-2">Notatki (opcjonalnie)</Text>
              <TextInput
                className="border border-border rounded-lg p-3 bg-surfaceVariant text-foreground"
                placeholder="Dodaj notatki..."
                placeholderTextColor={colors.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 px-4 rounded-lg border border-border bg-surfaceVariant"
            >
              <Text className="text-foreground font-semibold text-center">Anuluj</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              className="flex-1 py-3 px-4 rounded-lg bg-primary"
            >
              <Text className="text-background font-semibold text-center">Wymelduj</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
