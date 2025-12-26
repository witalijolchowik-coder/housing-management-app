import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Address } from '@/types';

interface AddressMenuModalProps {
  visible: boolean;
  address?: Address;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onWypowiedzenie: () => void;
  onRemoveWypowiedzenie: () => void;
}

export function AddressMenuModal({
  visible,
  address,
  onClose,
  onEdit,
  onDelete,
  onWypowiedzenie,
  onRemoveWypowiedzenie,
}: AddressMenuModalProps) {
  const colors = useColors();
  const t = useTranslations();

  const isOnWypowiedzenie = address?.status === 'wypowiedzenie';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/50"
        onPress={onClose}
      >
        <View className="flex-1 justify-center items-center">
          <Pressable
            className="bg-surface rounded-2xl w-72 overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="bg-primary p-4">
              <Text className="text-white font-bold text-lg">{address?.name}</Text>
              <Text className="text-white/80 text-sm mt-1">{address?.fullAddress}</Text>
            </View>

            {/* Menu Items */}
            <ScrollView>
              {/* Edit */}
              <Pressable
                onPress={() => {
                  onEdit();
                  onClose();
                }}
                className="flex-row items-center px-4 py-3 border-b border-border"
              >
                <MaterialIcons name="edit" size={20} color={colors.primary} />
                <Text className="text-foreground ml-3 flex-1">{t.common.edit}</Text>
              </Pressable>

              {/* Wypowiedzenie */}
              {!isOnWypowiedzenie ? (
                <Pressable
                  onPress={() => {
                    onWypowiedzenie();
                    onClose();
                  }}
                  className="flex-row items-center px-4 py-3 border-b border-border"
                >
                  <MaterialIcons name="warning" size={20} color={colors.warning} />
                  <Text className="text-foreground ml-3 flex-1">Postaw na wypowiedzenie</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => {
                    onRemoveWypowiedzenie();
                    onClose();
                  }}
                  className="flex-row items-center px-4 py-3 border-b border-border"
                >
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  <Text className="text-foreground ml-3 flex-1">Zdejmij z wypowiedzenia</Text>
                </Pressable>
              )}

              {/* Delete */}
              <Pressable
                onPress={() => {
                  onDelete();
                  onClose();
                }}
                className="flex-row items-center px-4 py-3"
              >
                <MaterialIcons name="delete" size={20} color={colors.error} />
                <Text className="text-error ml-3 flex-1">{t.common.delete}</Text>
              </Pressable>
            </ScrollView>

            {/* Close Button */}
            <View className="border-t border-border p-3">
              <Pressable
                onPress={onClose}
                className="bg-surfaceVariant rounded-lg py-2 items-center"
              >
                <Text className="text-foreground font-semibold">{t.common.close}</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
