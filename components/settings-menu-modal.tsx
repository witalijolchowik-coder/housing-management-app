import { View, Text, Modal, Pressable, Alert, TextInput, ScrollView } from 'react-native';
import { useEffect, useState } from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import {
  addSupplier,
  deleteSupplier,
  loadAddressEvents,
  loadData,
  loadEvictionArchive,
  loadSuppliers,
  saveAddressEvents,
  saveData,
  saveEvictionArchive,
  saveSuppliers,
  updateSupplier,
} from '@/lib/store';
import { Supplier } from '@/types';

interface SettingsMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

export function SettingsMenuModal({ visible, onClose, onDataChanged }: SettingsMenuModalProps) {
  const colors = useColors();
  const [suppliersVisible, setSuppliersVisible] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierNotes, setSupplierNotes] = useState('');

  useEffect(() => {
    if (visible) {
      refreshSuppliers();
    }
  }, [visible]);

  const refreshSuppliers = async () => {
    const data = await loadSuppliers();
    setSuppliers(data);
  };

  const resetSupplierForm = () => {
    setEditingSupplier(null);
    setSupplierName('');
    setSupplierPhone('');
    setSupplierContact('');
    setSupplierNotes('');
  };

  const startEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierName(supplier.name);
    setSupplierPhone(supplier.phone || '');
    setSupplierContact(supplier.contactPerson || '');
    setSupplierNotes(supplier.notes || '');
  };

  const handleSaveSupplier = async () => {
    if (!supplierName.trim()) {
      Alert.alert('Błąd', 'Nazwa dostawcy jest wymagana.');
      return;
    }

    const payload = {
      name: supplierName.trim(),
      phone: supplierPhone.trim() || undefined,
      contactPerson: supplierContact.trim() || undefined,
      notes: supplierNotes.trim() || undefined,
    };

    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, payload);
    } else {
      await addSupplier(payload);
    }

    resetSupplierForm();
    await refreshSuppliers();
    onDataChanged?.();
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    Alert.alert('Dostawca', `Usunąć albo dezaktywować dostawcę ${supplier.name}?`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await deleteSupplier(supplier.id);
          await refreshSuppliers();
          onDataChanged?.();
        },
      },
    ]);
  };

  const handleExportData = async () => {
    try {
      const projects = await loadData();
      const archive = await loadEvictionArchive();
      const suppliers = await loadSuppliers();
      const events = await loadAddressEvents();
      const data = { projects, archive, suppliers, events };
      const fileUri = FileSystem.documentDirectory + 'housing_data_export.json';

      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Błąd', 'Nie udało się wyeksportować danych.');
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const importData = JSON.parse(fileContent);

      if (!importData.projects || !Array.isArray(importData.projects)) {
        throw new Error('Invalid data structure');
      }

      Alert.alert('Potwierdzenie', 'Zaimportować dane? Obecne dane zostaną zastąpione.', [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Importuj',
          style: 'destructive',
          onPress: async () => {
            await saveData(importData.projects);
            if (importData.archive) await saveEvictionArchive(importData.archive);
            if (importData.suppliers) await saveSuppliers(importData.suppliers);
            if (importData.events) await saveAddressEvents(importData.events);
            Alert.alert('Sukces', 'Dane zostały zaimportowane.');
            onDataChanged?.();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert('Błąd', 'Nie udało się zaimportować danych. Sprawdź plik JSON.');
    }
  };

  const renderSuppliers = () => (
    <View className="gap-4">
      <Text className="text-lg font-bold" style={{ color: colors.text }}>Dostawcy</Text>

      <View className="gap-2">
        <TextInput
          value={supplierName}
          onChangeText={setSupplierName}
          placeholder="Nazwa dostawcy"
          placeholderTextColor={colors.muted}
          className="bg-background rounded-xl px-4 py-3"
          style={{ color: colors.text }}
        />
        <TextInput
          value={supplierPhone}
          onChangeText={setSupplierPhone}
          placeholder="Telefon"
          placeholderTextColor={colors.muted}
          className="bg-background rounded-xl px-4 py-3"
          style={{ color: colors.text }}
        />
        <TextInput
          value={supplierContact}
          onChangeText={setSupplierContact}
          placeholder="Osoba kontaktowa"
          placeholderTextColor={colors.muted}
          className="bg-background rounded-xl px-4 py-3"
          style={{ color: colors.text }}
        />
        <TextInput
          value={supplierNotes}
          onChangeText={setSupplierNotes}
          placeholder="Notatki"
          placeholderTextColor={colors.muted}
          className="bg-background rounded-xl px-4 py-3"
          style={{ color: colors.text }}
        />
        <View className="flex-row gap-2">
          <Pressable onPress={handleSaveSupplier} className="flex-1 bg-primary rounded-xl py-3 items-center">
            <Text className="text-white font-semibold">{editingSupplier ? 'Zapisz' : 'Dodaj'}</Text>
          </Pressable>
          {editingSupplier && (
            <Pressable onPress={resetSupplierForm} className="px-4 bg-background rounded-xl py-3 items-center">
              <Text style={{ color: colors.text }}>Anuluj</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View className="gap-2">
        {suppliers.map((supplier) => (
          <View key={supplier.id} className="p-3 rounded-xl bg-background">
            <View className="flex-row justify-between gap-3">
              <View className="flex-1">
                <Text className="font-semibold" style={{ color: colors.text }}>{supplier.name}</Text>
                <Text className="text-xs mt-1" style={{ color: colors.muted }}>
                  {[supplier.contactPerson, supplier.phone].filter(Boolean).join(' • ') || 'Brak danych kontaktowych'}
                </Text>
                {supplier.notes ? (
                  <Text className="text-xs mt-1" style={{ color: colors.muted }}>{supplier.notes}</Text>
                ) : null}
                {!supplier.active && <Text className="text-xs text-warning mt-1">Nieaktywny</Text>}
              </View>
              <View className="flex-row gap-2">
                <Pressable onPress={() => startEditSupplier(supplier)} className="p-2">
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                </Pressable>
                <Pressable onPress={() => handleDeleteSupplier(supplier)} className="p-2">
                  <MaterialIcons name="delete" size={20} color={colors.error} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 justify-center items-center p-4" onPress={onClose}>
        <Pressable
          className="w-full max-w-sm max-h-[85%] rounded-2xl overflow-hidden"
          style={{ backgroundColor: colors.card }}
          onPress={(event) => event.stopPropagation()}
        >
          <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold" style={{ color: colors.text }}>Ustawienia</Text>
              <Pressable onPress={onClose}>
                <MaterialIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            {suppliersVisible ? (
              <>
                <Pressable
                  onPress={() => {
                    setSuppliersVisible(false);
                    resetSupplierForm();
                  }}
                  className="flex-row items-center gap-2 mb-4"
                >
                  <MaterialIcons name="arrow-back" size={20} color={colors.primary} />
                  <Text className="font-medium" style={{ color: colors.primary }}>Wróć</Text>
                </Pressable>
                {renderSuppliers()}
              </>
            ) : (
              <View className="gap-4">
                <Pressable
                  className="flex-row items-center p-4 rounded-xl"
                  style={{ backgroundColor: colors.background }}
                  onPress={() => setSuppliersVisible(true)}
                >
                  <MaterialIcons name="business" size={24} color={colors.primary} />
                  <Text className="ml-3 font-medium" style={{ color: colors.text }}>Dostawcy</Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center p-4 rounded-xl"
                  style={{ backgroundColor: colors.background }}
                  onPress={handleExportData}
                >
                  <MaterialIcons name="file-download" size={24} color={colors.primary} />
                  <Text className="ml-3 font-medium" style={{ color: colors.text }}>Eksportuj dane JSON</Text>
                </Pressable>
                <Pressable
                  className="flex-row items-center p-4 rounded-xl"
                  style={{ backgroundColor: colors.background }}
                  onPress={handleImportData}
                >
                  <MaterialIcons name="file-upload" size={24} color={colors.primary} />
                  <Text className="ml-3 font-medium" style={{ color: colors.text }}>Importuj dane JSON</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
