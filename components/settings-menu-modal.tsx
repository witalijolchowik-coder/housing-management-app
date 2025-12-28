import { View, Text, Modal, Pressable, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { loadData, loadEvictionArchive, saveData, saveEvictionArchive } from '@/lib/store';

interface SettingsMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export function SettingsMenuModal({ visible, onClose, onDataChanged }: SettingsMenuModalProps) {
  const colors = useColors();

  const handleExportData = async () => {
    try {
      const projects = await loadData();
      const archive = await loadEvictionArchive();
      const data = { projects, archive };
      const fileUri = FileSystem.documentDirectory + 'housing_data_export.json';
      
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Błąd', 'Nie udało się wyeksportować danych');
    }
  };

  const handleImportData = async () => {
    try {
      // Pick file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      // Read file
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Parse JSON
      const importData = JSON.parse(fileContent);

      // Validate structure
      if (!importData.projects || !Array.isArray(importData.projects)) {
        throw new Error('Invalid data structure');
      }

      // Confirm import
      Alert.alert(
        'Potwierdzenie',
        'Czy na pewno chcesz zaimportować dane? Obecne dane zostaną zastąpione.',
        [
          {
            text: 'Anuluj',
            style: 'cancel',
          },
          {
            text: 'Importuj',
            style: 'destructive',
            onPress: async () => {
              await saveData(importData.projects);
              if (importData.archive) {
                await saveEvictionArchive(importData.archive);
              }
              Alert.alert('Sukces', 'Dane zostały zaimportowane');
              onDataChanged?.();
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Błąd', 'Nie udało się zaimportować dane. Upewnij się, że plik jest poprawny.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-center items-center p-4"
        onPress={onClose}
      >
        <Pressable 
          className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.card }}
          onPress={(e) => e.stopPropagation()}
        >
          <View className="p-6">
            <View className="flex-row justify-between items-center mb-6">
              <Text 
                className="text-xl font-bold"
                style={{ color: colors.text }}
              >
                Ustawienia
              </Text>
              <Pressable onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View className="space-y-4">
              <Pressable
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.background }}
                onPress={handleExportData}
              >
                <MaterialIcons name="file-download" size={24} color={colors.primary} />
                <Text 
                  className="ml-3 font-medium"
                  style={{ color: colors.text }}
                >
                  Eksportuj dane (JSON)
                </Text>
              </Pressable>

              <Pressable
                className="flex-row items-center p-4 rounded-xl"
                style={{ backgroundColor: colors.background }}
                onPress={handleImportData}
              >
                <MaterialIcons name="file-upload" size={24} color={colors.primary} />
                <Text 
                  className="ml-3 font-medium"
                  style={{ color: colors.text }}
                >
                  Importuj dane (JSON)
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
