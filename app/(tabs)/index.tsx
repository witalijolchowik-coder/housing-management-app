import { ScrollView, Text, View, FlatList, Pressable, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FAB } from '@/components/ui/fab';
import { ProjectMenuModal } from '@/components/project-menu-modal';
import { ProjectFormModal } from '@/components/project-form-modal';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, ProjectStats, Conflict } from '@/types';
import { loadData, calculateProjectStats, initializeDemoData, addProject, updateProject, deleteProject, getConflicts } from '@/lib/store';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function DashboardScreen() {
  const t = useTranslations();
  const colors = useColors();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadProjects();
    }, [])
  );

  const loadProjects = async () => {
    try {
      setLoading(true);
      let data = await loadData();
      if (data.length === 0) {
        await initializeDemoData();
        data = await loadData();
      }
      setProjects(data);
      
      // Collect all conflicts
      const allConflicts: Conflict[] = [];
      for (const project of data) {
        allConflicts.push(...getConflicts(project));
      }
      setConflicts(allConflicts);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = () => {
    let totalSpaces = 0;
    let totalOccupied = 0;
    let totalVacant = 0;
    let totalWypowiedzenie = 0;
    let totalCost = 0;

    for (const project of projects) {
      const stats = calculateProjectStats(project);
      totalSpaces += stats.total;
      totalOccupied += stats.occupied;
      totalVacant += stats.vacant;
      totalWypowiedzenie += stats.wypowiedzenie;
      
      // Calculate total cost
      for (const address of project.addresses) {
        totalCost += address.totalCost || 0;
      }
    }

    const occupancyPercent = totalSpaces > 0 
      ? Math.round(((totalOccupied + totalWypowiedzenie) / totalSpaces) * 100)
      : 0;

    return { totalSpaces, totalOccupied, totalVacant, totalWypowiedzenie, occupancyPercent, totalCost };
  };

  const handleProjectPress = (projectId: string) => {
    router.push({
      pathname: '/address-list',
      params: { projectId },
    });
  };

  const handleProjectMenu = (project: Project) => {
    setSelectedProject(project);
    setMenuVisible(true);
  };

  const handleEditProject = () => {
    if (selectedProject) {
      setEditingProject(selectedProject);
      setFormVisible(true);
    }
  };

  const handleDeleteProject = async () => {
    if (selectedProject) {
      try {
        await deleteProject(selectedProject.id);
        await loadProjects();
      } catch (error) {
        console.error('Error deleting project:', error);
      }
    }
  };

  const handleSaveProject = async (name: string, city?: string) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, { name, city });
      } else {
        await addProject(name, city);
      }
      setEditingProject(undefined);
      await loadProjects();
    } catch (error) {
      console.error('Error saving project:', error);
      throw error;
    }
  };

  const handleStatClick = (type: string) => {
    // Statistics cards are clickable for future detailed views
    console.log('Stat clicked:', type);
  };

  const overallStats = calculateOverallStats();

  const renderProjectCard = ({ item }: { item: Project }) => {
    const stats = calculateProjectStats(item);
    const hasEvictions = stats.wypowiedzenie > 0;
    const hasConflicts = stats.conflictCount > 0;

    return (
      <Pressable
        onPress={() => handleProjectPress(item.id)}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Card className="p-4 mb-4">
          <View className="gap-3">
            {/* Header */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                {item.city && (
                  <Text className="text-sm text-muted mt-1">{item.city}</Text>
                )}
              </View>
              <Pressable
                onPress={() => handleProjectMenu(item)}
                className="bg-surfaceVariant rounded-full p-2"
              >
                <MaterialIcons name="more-vert" size={20} color={colors.muted} />
              </Pressable>
            </View>

            {/* Occupancy */}
            <View className="gap-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-3xl font-bold text-primary">{stats.occupancyPercent}%</Text>
                <Text className="text-sm text-muted">
                  {stats.occupied}/{stats.total} {t.addressList.occupied}
                </Text>
              </View>
              <ProgressBar progress={stats.occupancyPercent} color="bg-primary" />
            </View>

            {/* Badges */}
            <View className="flex-row flex-wrap gap-2">
              {hasEvictions && (
                <Badge variant="warning" size="sm" label={`${stats.wypowiedzenie} ${t.roomDetails.eviction}`} />
              )}
              {hasConflicts && (
                <Badge variant="error" size="sm" label={`${stats.conflictCount} ${t.statistics.conflictCount}`} />
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-2xl font-bold text-foreground">{t.dashboard.title}</Text>
        <Pressable
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
          className="bg-surfaceVariant rounded-full p-2"
        >
          <MaterialIcons name="person" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {/* Dashboard Statistics */}
      {!loading && projects.length > 0 && (
        <View className="gap-3 mb-6">
          {/* Occupancy - Large card */}
          <Pressable>
            <Card className="p-6 bg-primary items-center">
              <Text className="text-white text-sm font-medium">Obłożenie</Text>
              <Text className="text-white text-5xl font-bold mt-2">{overallStats.occupancyPercent}%</Text>
              <Text className="text-white/80 text-sm mt-2">Cel: 100%</Text>
            </Card>
          </Pressable>

          {/* Stats Grid */}
          <View className="gap-3">
            {/* Total Spaces */}
            <Pressable>
              <Card className="p-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted">Razem miejsc</Text>
                  <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalSpaces}</Text>
                </View>
                <MaterialIcons name="apartment" size={32} color={colors.primary} />
              </Card>
            </Pressable>

            {/* Occupied Spaces */}
            <Pressable>
              <Card className="p-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted">Zajęte miejsca</Text>
                  <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalOccupied}</Text>
                </View>
                <MaterialIcons name="person" size={32} color={colors.success} />
              </Card>
            </Pressable>

            {/* Vacant Spaces */}
            <Pressable>
              <Card className="p-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted">Wolne miejsca</Text>
                  <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalVacant}</Text>
                </View>
                <MaterialIcons name="event-available" size={32} color={colors.warning} />
              </Card>
            </Pressable>

            {/* Wypowiedzenie */}
            <Pressable>
              <Card className="p-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted">Na wypowiedzeniu</Text>
                  <Text className="text-2xl font-bold text-foreground mt-1">{overallStats.totalWypowiedzenie}</Text>
                </View>
                <MaterialIcons name="warning" size={32} color={colors.warning} />
              </Card>
            </Pressable>

            {/* Conflicts */}
            <Pressable>
              <Card className="p-4 flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-muted">Konflikty</Text>
                  <Text className="text-2xl font-bold text-foreground mt-1">{conflicts.length}</Text>
                </View>
                <MaterialIcons name="error" size={32} color={colors.error} />
              </Card>
            </Pressable>

            {/* Total Cost */}
            <Card className="p-4 flex-row justify-between items-center">
              <View>
                <Text className="text-sm text-muted">Całkowity koszt</Text>
                <Text className="text-2xl font-bold text-foreground mt-1">
                  {overallStats.totalCost.toLocaleString('pl-PL')} PLN
                </Text>
              </View>
              <MaterialIcons name="attach-money" size={32} color={colors.primary} />
            </Card>
          </View>

          {/* Divider */}
          <View className="h-px bg-border my-2" />
        </View>
      )}

      {/* Projects List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.common.loading}</Text>
        </View>
      ) : projects.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">{t.messages.emptyProject}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {projects.map((project) => (
            <View key={project.id}>
              {renderProjectCard({ item: project })}
            </View>
          ))}
        </ScrollView>
      )}

      {/* FAB */}
      <FAB 
        icon="add" 
        onPress={() => {
          setEditingProject(undefined);
          setFormVisible(true);
        }} 
      />

      {/* Modals */}
      <ProjectMenuModal
        visible={menuVisible}
        projectName={selectedProject?.name || ''}
        onClose={() => setMenuVisible(false)}
        onEdit={handleEditProject}
        onDelete={handleDeleteProject}
      />

      <ProjectFormModal
        visible={formVisible}
        project={editingProject}
        onClose={() => {
          setFormVisible(false);
          setEditingProject(undefined);
        }}
        onSave={handleSaveProject}
      />
    </ScreenContainer>
  );
}
