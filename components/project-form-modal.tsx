import { View, Text, Pressable, Modal, ScrollView, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useTranslations } from '@/hooks/use-translations';
import { Project } from '@/types';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { parseCSV, processCSVData } from '@/lib/csv-import';
import { loadData, saveData } from '@/lib/store';

interface ProjectFormModalProps {
  visible: boolean;
  project?: Project;
  onClose: () => void;
  onSave: (name: string, city?: string, billingType?: Project['billingType']) => Promise<void>;
}

export function ProjectFormModal({ visible, project, onClose, onSave }: ProjectFormModalProps) {
  const colors = useColors();
  const t = useTranslations();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [billingType, setBillingType] = useState<Project['billingType']>('mandate');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(project?.name || '');
    setCity(project?.city || '');
    setBillingType(project?.billingType || 'mandate');
  }, [project, visible]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Błąd', t.messages.savingError);
      return;
    }

    try {
      setLoading(true);
      await onSave(name.trim(), city.trim() || undefined, billingType);
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
      Alert.alert('Błąd', 'Najpierw wpisz nazwę projektu');
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
        return;
      }

      const newProject = processCSVData(name.trim(), city.trim() || undefined, rows);
      newProject.billingType = billingType;
      const projects = await loadData();
      projects.push(newProject);
      await saveData(projects);

      Alert.alert('Sukces', `Zaimportowano projekt z ${newProject.addresses.length} adresami`);
      onClose();
    } catch (error) {
      console.error('Error importing CSV:', error);
      Alert.alert('Błąd', `Wystąpił błąd podczas importu pliku CSV: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const billingOptions = [
    { value: 'mandate' as const, label: 'Umowa zlecenie', note: 'Standardowo 100%, pierwszy miesiąc od 16 dnia = 50%' },
    { value: 'employment' as const, label: 'Umowa o pracę', note: 'Naliczanie proporcjonalnie do dni trwania umowy' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background">
        <View className="flex-1 pt-12 pb-4">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Pressable onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
            <Text className="text-lg font-bold text-foreground">
              {project ? 'Edytuj projekt' : 'Nowy projekt'}
            </Text>
            <Pressable onPress={handleSave} disabled={loading}>
              <MaterialIcons name="check" size={24} color={loading ? colors.muted : colors.primary} />
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">{t.forms.name} *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t.forms.name}
                placeholderTextColor={colors.muted}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Miasto</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Warszawa"
                placeholderTextColor={colors.muted}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
                editable={!loading}
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-semibold text-foreground mb-3">Rodzaj umowy w projekcie</Text>
              <View className="gap-2">
                {billingOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setBillingType(option.value)}
                    className={`p-3 rounded-lg border ${billingType === option.value ? 'bg-primary/20 border-primary' : 'bg-surface border-border'}`}
                  >
                    <Text className="text-foreground font-semibold">{option.label}</Text>
                    <Text className="text-muted text-xs mt-1">{option.note}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {!project && (
              <View className="mt-2">
                <Text className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Opcje zaawansowane</Text>
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
                    <Text className="text-xs text-muted mt-1">Automatycznie utwórz adresy i dodaj mieszkańców z pliku</Text>
                  </View>
                </Pressable>
              </View>
            )}
          </ScrollView>

          <View className="border-t border-border p-4 pb-8">
            <Pressable
              onPress={handleSave}
              disabled={loading}
              className={`rounded-lg py-3 items-center ${loading ? 'bg-muted' : 'bg-primary'}`}
            >
              <Text className="text-white font-semibold">
                {loading ? t.common.loading : (project ? 'Zapisz zmiany' : 'Utwórz projekt')}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
