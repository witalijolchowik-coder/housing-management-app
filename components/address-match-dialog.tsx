import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Address } from '@/types';
import { Card } from './ui/card';

interface AddressMatchDialogProps {
  visible: boolean;
  csvAddress: string;
  csvAddressName: string;
  tenantCount: number;
  similarAddresses: Address[];
  onSelectExisting: (addressId: string) => void;
  onCreateNew: () => void;
  onClose: () => void;
}

export function AddressMatchDialog({
  visible,
  csvAddress,
  csvAddressName,
  tenantCount,
  similarAddresses,
  onSelectExisting,
  onCreateNew,
  onClose,
}: AddressMatchDialogProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/70 pt-12 pb-20"
        onPress={onClose}
      >
        <View className="flex-1 justify-center items-center px-4">
          <Pressable
            className="bg-surface rounded-2xl w-full max-w-md overflow-hidden"
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View className="bg-warning p-4">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="warning" size={24} color="#000" />
                <Text className="text-black font-bold text-lg flex-1">Podobny adres</Text>
              </View>
            </View>

            <ScrollView className="max-h-96">
              {/* CSV Address Info */}
              <View className="p-4 border-b border-border">
                <Text className="text-sm text-muted mb-2">Adres z pliku CSV:</Text>
                <Card className="p-3 bg-surfaceVariant">
                  <Text className="text-base font-semibold text-foreground">{csvAddressName}</Text>
                  <Text className="text-xs text-muted mt-1">{csvAddress}</Text>
                  <View className="flex-row items-center gap-2 mt-2">
                    <MaterialIcons name="people" size={16} color={colors.primary} />
                    <Text className="text-sm text-foreground">{tenantCount} mieszkańców</Text>
                  </View>
                </Card>
              </View>

              {/* Similar Addresses */}
              <View className="p-4">
                <Text className="text-sm text-muted mb-3">
                  Znaleziono podobne adresy. Czy to ten sam adres?
                </Text>

                {similarAddresses.map((addr) => (
                  <Pressable
                    key={addr.id}
                    onPress={() => onSelectExisting(addr.id)}
                    className="mb-3"
                  >
                    <Card className="p-3 border-2 border-primary">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">{addr.name}</Text>
                          <Text className="text-xs text-muted mt-1">{addr.fullAddress}</Text>
                          <View className="flex-row items-center gap-4 mt-2">
                            <View className="flex-row items-center gap-1">
                              <MaterialIcons name="people" size={14} color={colors.muted} />
                              <Text className="text-xs text-muted">
                                {addr.unassignedTenants.length} bez miejsca
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                              <MaterialIcons name="door-back" size={14} color={colors.muted} />
                              <Text className="text-xs text-muted">
                                {addr.rooms.length} pokoi
                              </Text>
                            </View>
                          </View>
                        </View>
                        <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                      </View>
                    </Card>
                  </Pressable>
                ))}

                {/* Create New Option */}
                <Pressable
                  onPress={onCreateNew}
                  className="mt-2"
                >
                  <Card className="p-3 border-2 border-dashed border-border">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          Utwórz nowy adres
                        </Text>
                        <Text className="text-xs text-muted mt-1">
                          To jest inny adres niż istniejące
                        </Text>
                      </View>
                      <MaterialIcons name="add-circle-outline" size={24} color={colors.primary} />
                    </View>
                  </Card>
                </Pressable>
              </View>
            </ScrollView>

            {/* Close Button */}
            <View className="border-t border-border p-3">
              <Pressable
                onPress={onClose}
                className="bg-surfaceVariant rounded-lg py-2 items-center"
              >
                <Text className="text-foreground font-semibold">Anuluj</Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
