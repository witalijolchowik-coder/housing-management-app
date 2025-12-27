import { ScrollView, Text, View, Alert, Pressable } from 'react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project } from '@/types';
import { loadData, calculateProjectStats } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const t = useTranslations();
  const colors = useColors();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await loadData();
      setProjects(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async (projectId: string) => {
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      // Build CSV content
      let csv = 'Projekt,Adres,Pokój,Miejsce,Imię,Nazwisko,Płeć,Rok urodzenia,Data zameldowania,Cena\n';

      for (const address of project.addresses) {
        for (const room of address.rooms) {
          for (const space of room.spaces) {
            if (space.tenant) {
              csv += `"${project.name}","${address.name}","${room.name}","${space.number}","${space.tenant.firstName}","${space.tenant.lastName}","${space.tenant.gender}","${space.tenant.birthYear}","${space.tenant.checkInDate}","${space.tenant.monthlyPrice}"\n`;
            }
          }
        }
      }

      // Save file
      const filename = `${project.name}-${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(filepath, csv);
      
      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'text/csv',
          dialogTitle: `Eksportuj raport: ${project.name}`,
        });
      } else {
        Alert.alert('Sukces', `Plik zapisany: ${filename}`);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      Alert.alert('Błąd', 'Nie udało się wyeksportować raportu');
    }
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <Text className="text-2xl font-bold text-foreground mb-6">Raporty</Text>

        {/* Projects Reports */}
        {loading ? (
          <Text className="text-muted text-center py-8">Ładowanie...</Text>
        ) : projects.length === 0 ? (
          <View className="items-center justify-center py-8">
            <Text className="text-muted">Brak projektów</Text>
          </View>
        ) : (
          <View className="gap-3">
            {projects.map((project) => {
              const stats = calculateProjectStats(project);
              return (
                <Card key={project.id} className="p-4">
                  <View className="gap-3">
                    {/* Header */}
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="font-semibold text-foreground text-lg">{project.name}</Text>
                        {project.city && (
                          <Text className="text-sm text-muted mt-1">{project.city}</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => handleExportExcel(project.id)}
                        className="bg-primary rounded-lg px-4 py-2 flex-row items-center gap-2"
                      >
                        <MaterialIcons name="download" size={18} color="white" />
                        <Text className="text-white text-sm font-semibold">Pobierz</Text>
                      </Pressable>
                    </View>

                    {/* Occupancy */}
                    <View className="gap-1">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-2xl font-bold text-primary">{stats.occupancyPercent}%</Text>
                        <Text className="text-sm text-muted">
                          {stats.occupied}/{stats.total} zajęte
                        </Text>
                      </View>
                      <ProgressBar progress={stats.occupancyPercent} color="bg-primary" />
                    </View>

                    {/* Stats */}
                    <View className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                      <View className="items-center">
                        <Text className="text-xs text-muted">Zajęte</Text>
                        <Text className="text-lg font-bold text-foreground mt-1">{stats.occupied}</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-xs text-muted">Wolne</Text>
                        <Text className="text-lg font-bold text-foreground mt-1">{stats.vacant}</Text>
                      </View>
                      <View className="items-center">
                        <Text className="text-xs text-muted">Wypowiedzenie</Text>
                        <Text className="text-lg font-bold text-foreground mt-1">{stats.wypowiedzenie}</Text>
                      </View>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
