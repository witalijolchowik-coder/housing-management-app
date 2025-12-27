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
      // Load all data
      const projects = await loadData();
      const evictionArchive = await loadEvictionArchive();

      // Create export object
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        projects,
        evictionArchive,
      };

      // Convert to JSON
      const jsonString = JSON.stringify(exportData, null, 2);

      // Create file path
      const fileName = `housing-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Write file
      await FileSystem.writeAsStringAsync(fileUri, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Eksportuj dane',
        });
        
        Alert.alert('Sukces', 'Dane zostały wyeksportowane pomyślnie');
      } else {
        Alert.alert('Błąd', 'Udostępnianie plików nie jest dostępne na tym urządzeniu');
      }

      onClose();
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
              try {
                // Save imported data
                await saveData(importData.projects);
                if (importData.evictionArchive) {
                  await saveEvictionArchive(importData.evictionArchive);
                }

                Alert.alert('Sukces', 'Dane zostały zaimportowane pomyślnie');
                onClose();
                
                // Notify parent to reload data
                if (onDataChanged) {
                  onDataChanged();
                }
              } catch (error) {
                console.error('Import save error:', error);
                Alert.alert('Błąd', 'Nie udało się zapisać zaimportowanych danych');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Błąd', 'Nie udało się zaimportować danych. Sprawdź, czy plik jest prawidłowy.');
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
        className="flex-1 bg-black/50 justify-center items-center"
        onPress={onClose}
      >
        <Pressable 
          className="bg-surface rounded-2xl w-80 overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="px-6 py-4 border-b border-border">
            <Text className="text-lg font-bold text-foreground">Ustawienia</Text>
          </View>

          {/* Menu Options */}
          <View className="py-2">
            {/* Export Data */}
            <Pressable
              onPress={handleExportData}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              className="flex-row items-center px-6 py-4"
            >
              <View className="bg-primary/20 rounded-full p-2 mr-4">
                <MaterialIcons name="file-upload" size={24} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Eksportuj dane</Text>
                <Text className="text-sm text-muted mt-0.5">Zapisz kopię zapasową wszystkich danych</Text>
              </View>
            </Pressable>

            {/* Import Data */}
            <Pressable
              onPress={handleImportData}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              className="flex-row items-center px-6 py-4"
            >
              <View className="bg-success/20 rounded-full p-2 mr-4">
                <MaterialIcons name="file-download" size={24} color={colors.success} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">Importuj dane</Text>
                <Text className="text-sm text-muted mt-0.5">Wczytaj dane z pliku kopii zapasowej</Text>
              </View>
            </Pressable>
          </View>

          {/* Cancel Button */}
          <View className="px-6 py-4 border-t border-border">
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                opacity: pressed ? 0.7 : 1,
              })}
              className="bg-surfaceVariant rounded-full py-3"
            >
              <Text className="text-center text-base font-semibold text-foreground">Anuluj</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
