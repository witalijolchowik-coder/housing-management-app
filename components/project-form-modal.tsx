import { View, Text, Pressable, Modal, ScrollView, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Project } from '@/types';

interface ProjectFormModalProps {
  visible: boolean;
  project?: Project;
  onClose: () => void;
  onSave: (name: string, city?: string) => Promise<void>;
}

export function ProjectFormModal({
  visible,
  project,
  onClose,
  onSave,
}: ProjectFormModalProps) {
  const colors = useColors();
  const t = useTranslations();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setCity(project.city || '');
    } else {
      setName('');
      setCity('');
    }
  }, [project, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert(t.messages.savingError);
      return;
    }

    try {
      setLoading(true);
      await onSave(name.trim(), city.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
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
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Pressable onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-lg font-bold text-foreground">
            {project ? t.forms.editAddress : t.forms.addAddress}
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
          {/* Project Name */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              {t.forms.name} *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t.forms.name}
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              editable={!loading}
            />
          </View>

          {/* City */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Miasto
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Warszawa"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              editable={!loading}
            />
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
              {loading ? t.common.loading : t.forms.submit}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
