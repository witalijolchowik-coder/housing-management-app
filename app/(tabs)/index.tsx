import { ScrollView, Text, View, FlatList, Pressable } from 'react-native';
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
import { Project, ProjectStats } from '@/types';
import { loadData, calculateProjectStats, initializeDemoData, addProject, updateProject, deleteProject } from '@/lib/store';
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
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
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
        <FlatList
          data={projects}
          renderItem={renderProjectCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
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
