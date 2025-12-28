import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { Project, Address } from '@/types';
import { Card } from './ui/card';

interface RestoreTenantDialogProps {
  visible: boolean;
  tenantName: string;
  projects: Project[];
  onRestore: (projectId: string, addressId: string) => void;
  onClose: () => void;
}

export function RestoreTenantDialog({
  visible,
  tenantName,
  projects,
  onRestore,
  onClose,
}: RestoreTenantDialogProps) {
  const colors = useColors();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedAddressId(null);
  };

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
  };

  const handleConfirm = () => {
    if (selectedProjectId && selectedAddressId) {
      onRestore(selectedProjectId, selectedAddressId);
      setSelectedProjectId(null);
      setSelectedAddressId(null);
    }
  };

  const handleCancel = () => {
    setSelectedProjectId(null);
    setSelectedAddressId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-black/70 pt-12 pb-20">
        <View className="flex-1 bg-surface m-4 rounded-2xl overflow-hidden">
          {/* Header */}
          <View className="bg-primary p-4">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="restore" size={24} color="white" />
              <Text className="text-white font-bold text-lg flex-1">
                Przywróć mieszkańca
              </Text>
              <Pressable onPress={handleCancel}>
                <MaterialIcons name="close" size={24} color="white" />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView className="flex-1">
            <View className="p-4">
              <Text className="text-sm text-muted mb-4">
                Wybierz projekt i adres, do którego chcesz przywrócić mieszkańca: <Text className="font-semibold text-foreground">{tenantName}</Text>
              </Text>

              {/* Step 1: Select Project */}
              <Text className="text-base font-bold text-foreground mb-3">
                1. Wybierz projekt
              </Text>
              <View className="gap-2 mb-6">
                {projects.map((project) => (
                  <Pressable
                    key={project.id}
                    onPress={() => handleProjectSelect(project.id)}
                  >
                    <Card className={`p-3 ${
                      selectedProjectId === project.id 
                        ? 'border-2 border-primary bg-primary/10' 
                        : 'border border-border'
                    }`}>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {project.name}
                          </Text>
                          {project.city && (
                            <Text className="text-xs text-muted mt-1">{project.city}</Text>
                          )}
                          <Text className="text-xs text-muted mt-1">
                            {project.addresses.length} adresów
                          </Text>
                        </View>
                        {selectedProjectId === project.id && (
                          <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                        )}
                      </View>
                    </Card>
                  </Pressable>
                ))}
              </View>

              {/* Step 2: Select Address */}
              {selectedProject && (
                <>
                  <Text className="text-base font-bold text-foreground mb-3">
                    2. Wybierz adres
                  </Text>
                  <View className="gap-2 mb-6">
                    {selectedProject.addresses.map((address) => (
                      <Pressable
                        key={address.id}
                        onPress={() => handleAddressSelect(address.id)}
                      >
                        <Card className={`p-3 ${
                          selectedAddressId === address.id 
                            ? 'border-2 border-primary bg-primary/10' 
                            : 'border border-border'
                        }`}>
                          <View className="flex-row items-center justify-between">
                            <View className="flex-1">
                              <Text className="text-base font-semibold text-foreground">
                                {address.name}
                              </Text>
                              <Text className="text-xs text-muted mt-1">
                                {address.fullAddress}
                              </Text>
                              <View className="flex-row items-center gap-3 mt-2">
                                <View className="flex-row items-center gap-1">
                                  <MaterialIcons name="people" size={14} color={colors.muted} />
                                  <Text className="text-xs text-muted">
                                    {address.unassignedTenants.length} bez miejsca
                                  </Text>
                                </View>
                                <View className="flex-row items-center gap-1">
                                  <MaterialIcons name="door-back" size={14} color={colors.muted} />
                                  <Text className="text-xs text-muted">
                                    {address.rooms.length} pokoi
                                  </Text>
                                </View>
                              </View>
                            </View>
                            {selectedAddressId === address.id && (
                              <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                            )}
                          </View>
                        </Card>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View className="border-t border-border p-4 gap-2">
            <Pressable
              onPress={handleConfirm}
              disabled={!selectedProjectId || !selectedAddressId}
              className={`rounded-lg py-3 items-center ${
                selectedProjectId && selectedAddressId
                  ? 'bg-primary'
                  : 'bg-surfaceVariant'
              }`}
            >
              <Text className={`font-semibold ${
                selectedProjectId && selectedAddressId
                  ? 'text-white'
                  : 'text-muted'
              }`}>
                Przywróć mieszkańca
              </Text>
            </Pressable>
            <Pressable
              onPress={handleCancel}
              className="bg-surfaceVariant rounded-lg py-3 items-center"
            >
              <Text className="text-foreground font-semibold">Anuluj</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
