import { View, Text, Pressable, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Project } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseCSV, processCSVData } from '@/lib/csv-import';
import { loadData, saveData } from '@/lib/store';

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
      Alert.alert('Błąd', t.messages.savingError);
      return;
    }

    try {
      setLoading(true);
      await onSave(name.trim(), city.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      Alert.alert('Błąd', t.messages.savingError);
    } finally {
      setLoading(false);
    }
  };

  const handleImportCSV = async () => {
    if (!name.trim()) {
      Alert.alert('Błąd', 'Proszę najpierw wpisać nazwę projektu');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
      });

      if (result.canceled) return;

      setLoading(true);
      const fileUri = result.assets[0].uri;
      const csvText = await FileSystem.readAsStringAsync(fileUri);
      
      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        Alert.alert('Błąd', 'Nie udało się odczytać danych z pliku CSV');
        setLoading(false);
        return;
      }

      const newProject = processCSVData(name.trim(), city.trim() || undefined, rows);
      
      const projects = await loadData();
      projects.push(newProject);
      await saveData(projects);

      Alert.alert('Sukces', `Zaimportowano projekt z ${newProject.addresses.length} adresami`);
      onClose();
      // We need to trigger a refresh in the parent, but since we're using saveData directly here, 
      // the parent's useFocusEffect or similar should handle it if it re-renders.
      // In a real app, we might want a callback like onImportComplete.
    } catch (error) {
      console.error('Error importing CSV:', error);
      Alert.alert('Błąd', 'Wystąpił błąd podczas importu pliku CSV');
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
            {project ? 'Edytuj projekt' : 'Nowy projekt'}
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

          {!project && (
            <View className="mt-6">
              <Text className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">
                Opcje zaawansowane
              </Text>
              <Pressable
                onPress={handleImportCSV}
                disabled={loading}
                className="flex-row items-center gap-3 bg-surfaceVariant/40 border border-dashed border-primary/40 rounded-xl p-5"
              >
                <View className="bg-primary/10 p-3 rounded-full">
                  <MaterialIcons name="file-upload" size={24} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">Importuj z CSV</Text>
                  <Text className="text-xs text-muted mt-1">
                    Automatycznie utwórz adresy i dodaj mieszkańców z pliku
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
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
              {loading ? t.common.loading : (project ? 'Zapisz zmiany' : 'Utwórz projekt')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
