import { ScrollView, Text, View, FlatList, Pressable, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { FAB } from '@/components/ui/fab';
import { ProjectMenuModal } from '@/components/project-menu-modal';
import { ProjectFormModal } from '@/components/project-form-modal';
import { SettingsMenuModal } from '@/components/settings-menu-modal';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, ProjectStats, Conflict } from '@/types';
import { loadData, calculateProjectStats, initializeDemoData, addProject, updateProject, deleteProject, getConflicts, saveData, updateProjectsOrder } from '@/lib/store';
import { parseCSV, groupCSVByAddress, findSimilarAddresses, importCSVIntoProject, AddressGroup } from '@/lib/csv-import';
import { AddressMatchDialog } from '@/components/address-match-dialog';
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
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [csvImportDialogVisible, setCSVImportDialogVisible] = useState(false);
  const [pendingCSVGroups, setPendingCSVGroups] = useState<AddressGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [addressMappings, setAddressMappings] = useState<Map<string, string>>(new Map());
  const [pendingCSVRows, setPendingCSVRows] = useState<any[]>([]);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);

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
    let totalAddresses = 0;
    let conflictCount = 0;

    const projectsToCalculate = filterProjectId 
      ? projects.filter(p => p.id === filterProjectId)
      : projects;

    for (const project of projectsToCalculate) {
      const stats = calculateProjectStats(project);
      totalSpaces += stats.total;
      totalOccupied += stats.occupied;
      totalVacant += stats.vacant;
      totalWypowiedzenie += stats.wypowiedzenie;
      totalAddresses += project.addresses.length;
      conflictCount += stats.conflictCount;
    }

    return { totalSpaces, totalOccupied, totalVacant, totalWypowiedzenie, totalAddresses, conflictCount };
  };

  const handleProjectPress = (projectId: string) => {
    router.push({
      pathname: '/address-list',
      params: { projectId },
    });
  };

  const handleProjectLongPress = (projectId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFilterProjectId(projectId);
  };

  const handleProjectPressOut = () => {
    setFilterProjectId(null);
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

  const handleImportCSV = async () => {
    if (!selectedProject) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel'],
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const csvText = await FileSystem.readAsStringAsync(fileUri);
      
      const rows = parseCSV(csvText);
      if (rows.length === 0) {
        Alert.alert('Błąd', 'Nie udało się odczytać danych z pliku CSV');
        return;
      }

      // Group by address and check for conflicts
      const groups = groupCSVByAddress(rows);
      const groupsWithConflicts: AddressGroup[] = [];
      const mappings = new Map<string, string>();

      for (const group of groups) {
        const similar = findSimilarAddresses(group.fullAddress, selectedProject.addresses);
        if (similar.length > 0) {
          groupsWithConflicts.push(group);
        }
      }

      if (groupsWithConflicts.length > 0) {
        // Show dialog for first conflict
        setPendingCSVRows(rows); // Store rows for later import
        setPendingCSVGroups(groupsWithConflicts);
        setCurrentGroupIndex(0);
        setAddressMappings(mappings);
        setCSVImportDialogVisible(true);
      } else {
        // No conflicts, import directly
        await performImport(selectedProject, rows, mappings);
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      Alert.alert('Błąd', 'Wystąpił błąd podczas importu pliku CSV');
    }
  };

  const performImport = async (
    project: Project,
    rows: any[],
    mappings: Map<string, string>
  ) => {
    try {
      const updatedProject = importCSVIntoProject(project, rows, mappings);
      
      const projects = await loadData();
      const index = projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        projects[index] = updatedProject;
        await saveData(projects);
        
        // Update local state immediately
        setProjects([...projects]);
        
        // Reload all data to ensure consistency
        await loadProjects();
        
        Alert.alert('Sukces', 'Dane zostały заimportowane');
      }
    } catch (error) {
      console.error('Error performing import:', error);
      Alert.alert('Błąd', 'Wystąpił błąd podczas importu');
    }
  };

  const handleAddressMatch = async (addressId: string) => {
    if (!selectedProject) return;
    
    const currentGroup = pendingCSVGroups[currentGroupIndex];
    const newMappings = new Map(addressMappings);
    newMappings.set(currentGroup.fullAddress, addressId);
    setAddressMappings(newMappings);

    // Move to next conflict or finish
    if (currentGroupIndex < pendingCSVGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      // All conflicts resolved, perform import
      setCSVImportDialogVisible(false);
      await performImport(selectedProject, pendingCSVRows, newMappings);
      // Reset state
      setPendingCSVRows([]);
      setPendingCSVGroups([]);
      setCurrentGroupIndex(0);
      setAddressMappings(new Map());
    }
  };

  const handleCreateNewAddress = async () => {
    if (!selectedProject) return;
    
    // Don't add mapping, let it create new address
    if (currentGroupIndex < pendingCSVGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      // All conflicts resolved, perform import
      setCSVImportDialogVisible(false);
      await performImport(selectedProject, pendingCSVRows, addressMappings);
      // Reset state
      setPendingCSVRows([]);
      setPendingCSVGroups([]);
      setCurrentGroupIndex(0);
      setAddressMappings(new Map());
    }
  };

  const handleStatClick = (type: string) => {
    switch (type) {
      case 'lokale':
        router.push('/all-addresses');
        break;
      case 'wypowiedzenie':
        router.push('/statistics-detail-evictions');
        break;
      case 'conflicts':
        router.push('/statistics-detail-conflicts');
        break;
      case 'vacant':
        router.push('/statistics-detail-vacant');
        break;
      case 'occupied':
        router.push('/statistics-detail-occupied');
        break;
      case 'total':
        router.push('/statistics-detail-total');
        break;
      default:
        break;
    }
  };

  const moveProject = async (fromIndex: number, toIndex: number) => {
    const newProjects = [...projects];
    const [movedProject] = newProjects.splice(fromIndex, 1);
    newProjects.splice(toIndex, 0, movedProject);
    setProjects(newProjects);
    await updateProjectsOrder(newProjects);
  };

  const overallStats = calculateOverallStats();

  const renderProjectCard = ({ item, index }: { item: Project, index: number }) => {
    const stats = calculateProjectStats(item);
    const hasEvictions = stats.wypowiedzenie > 0;
    const hasConflicts = stats.conflictCount > 0;
    const isFiltered = filterProjectId === item.id;

    // Collect unique operators from all addresses
    const operators = new Set<string>();
    item.addresses.forEach(address => {
      if (address.operator) {
        operators.add(address.operator);
      }
    });
    const operatorList = Array.from(operators);

    const getOperatorLabel = (operator: string) => {
      switch (operator) {
        case 'rent_planet':
          return 'Rent Planet';
        case 'e_port':
          return 'E-Port';
        case 'other':
          return 'Inne';
        default:
          return operator;
      }
    };

    return (
      <Pressable
        onPress={() => handleProjectPress(item.id)}
        onLongPress={() => handleProjectLongPress(item.id)}
        onPressOut={handleProjectPressOut}
        style={({ pressed }) => ({
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: isFiltered ? 1.02 : 1 }],
          marginBottom: 16,
        })}
      >
        <Card className="p-5">
          <View className="gap-4">
            {/* Header */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground">{item.name}</Text>
                {item.city && (
                  <View className="flex-row flex-wrap items-center gap-2 mt-1">
                    <Text className="text-sm text-muted">{item.city}</Text>
                    {operatorList.length > 0 && operatorList.map((operator) => (
                      <View
                        key={operator}
                        className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border border-border/50"
                      >
                        <MaterialIcons name="business" size={12} color={colors.muted} />
                        <Text className="text-xs text-muted">{getOperatorLabel(operator)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <Pressable
                onPress={() => handleProjectMenu(item)}
                className="bg-surfaceVariant/60 rounded-full p-2.5"
              >
                <MaterialIcons name="more-vert" size={20} color={colors.muted} />
              </Pressable>
            </View>

            {/* Occupancy */}
            <View className="gap-2">
              <View className="flex-row justify-between items-center">
                <Text className="text-4xl font-bold text-primary">{stats.occupancyPercent}%</Text>
                <Text className="text-sm text-muted">
                  {stats.occupied}/{stats.total} {t.addressList.occupied}
                </Text>
              </View>
              <ProgressBar progress={stats.occupancyPercent} color="bg-primary" />
            </View>

            {/* Badges */}
            <View className="flex-row flex-wrap gap-3 pt-2 border-t border-border/30">
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
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-3xl font-bold text-foreground">{t.dashboard.title}</Text>
          {filterProjectId && (
            <Text className="text-sm text-primary font-medium">Filtrowanie: {projects.find(p => p.id === filterProjectId)?.name}</Text>
          )}
        </View>
        <Pressable
          onPress={() => setSettingsVisible(true)}
          style={({ pressed }) => ({
            opacity: pressed ? 0.7 : 1,
          })}
          className="bg-surfaceVariant rounded-full p-2"
        >
          <MaterialIcons name="more-vert" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {/* Dashboard Statistics - Compact Grid */}
      {!loading && projects.length > 0 && (
        <View className="mb-6">
          {/* 2x3 Grid Layout */}
          <View className="flex-row gap-3 mb-3">
            {/* Lokale */}
            <Pressable 
              onPress={() => handleStatClick('lokale')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="apartment" size={24} color={colors.primary} />
                <Text className="text-xs text-muted mt-1">Lokale</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalAddresses}</Text>
              </Card>
            </Pressable>

            {/* Total Spaces (Razem) */}
            <Pressable 
              onPress={() => handleStatClick('total')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="hotel" size={24} color={colors.primary} />
                <Text className="text-xs text-muted mt-1">Razem</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalSpaces}</Text>
              </Card>
            </Pressable>

            {/* Occupied (Zajęте) */}
            <Pressable 
              onPress={() => handleStatClick('occupied')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="person" size={24} color={colors.success} />
                <Text className="text-xs text-muted mt-1">Zajęte</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalOccupied}</Text>
              </Card>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            {/* Vacant (Wolne) */}
            <Pressable 
              onPress={() => handleStatClick('vacant')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="event-available" size={24} color={colors.warning} />
                <Text className="text-xs text-muted mt-1">Wolne</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalVacant}</Text>
              </Card>
            </Pressable>

            {/* Wypowiedzenie (Wyp.) */}
            <Pressable 
              onPress={() => handleStatClick('wypowiedzenie')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="warning" size={24} color={colors.warning} />
                <Text className="text-xs text-muted mt-1">Wyp.</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalWypowiedzenie}</Text>
              </Card>
            </Pressable>

            {/* Conflicts (Konflikty) */}
            <Pressable 
              onPress={() => handleStatClick('conflicts')}
              style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              className="flex-1"
            >
              <Card className="p-4 items-center">
                <MaterialIcons name="error" size={24} color={colors.error} />
                <Text className="text-xs text-muted mt-1">Konflikty</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.conflictCount}</Text>
              </Card>
            </Pressable>
          </View>
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
          {projects.map((project, index) => (
            <View key={project.id}>
              {renderProjectCard({ item: project, index })}
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
        onImportCSV={handleImportCSV}
      />

      <AddressMatchDialog
        visible={csvImportDialogVisible}
        csvAddress={pendingCSVGroups[currentGroupIndex]?.fullAddress || ''}
        csvAddressName={pendingCSVGroups[currentGroupIndex]?.addressName || ''}
        tenantCount={pendingCSVGroups[currentGroupIndex]?.tenantCount || 0}
        similarAddresses={selectedProject ? findSimilarAddresses(
          pendingCSVGroups[currentGroupIndex]?.fullAddress || '',
          selectedProject.addresses
        ) : []}
        onSelectExisting={handleAddressMatch}
        onCreateNew={handleCreateNewAddress}
        onClose={() => setCSVImportDialogVisible(false)}
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

      <SettingsMenuModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onDataChanged={loadProjects}
      />
    </ScreenContainer>
  );
}
