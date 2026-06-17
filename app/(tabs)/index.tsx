import { Text, View, Pressable, Alert, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useState, useCallback } from 'react';
import { ScreenContainer } from '@/components/screen-container';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FAB } from '@/components/ui/fab';
import { ProjectMenuModal } from '@/components/project-menu-modal';
import { ProjectFormModal } from '@/components/project-form-modal';
import { SettingsMenuModal } from '@/components/settings-menu-modal';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Project, Conflict } from '@/types';
import { loadData, calculateProjectStats, initializeDemoData, addProject, updateProject, deleteProject, getConflicts, saveData, updateProjectsOrder, isSpacePaid } from '@/lib/store';
import { parseCSV, groupCSVByAddress, findSimilarAddresses, importCSVIntoProject, AddressGroup } from '@/lib/csv-import';
import { AddressMatchDialog } from '@/components/address-match-dialog';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';

type ProjectPlaceStructure = {
  total: number;
  occupied: number;
  occupiedNotice: number;
  emptyNotice: number;
  losses: number;
  free: number;
  occupiedTotal: number;
  occupiedPercent: number;
};

const getProjectPlaceStructure = (project: Project): ProjectPlaceStructure => {
  const structure = {
    total: 0,
    occupied: 0,
    occupiedNotice: 0,
    emptyNotice: 0,
    losses: 0,
    free: 0,
    occupiedTotal: 0,
    occupiedPercent: 0,
  };

  for (const address of project.addresses) {
    for (const room of address.rooms) {
      for (const space of room.spaces) {
        structure.total += 1;
        const hasTenant = Boolean(space.tenant);
        const onNotice = space.status === 'wypowiedzenie' && Boolean(space.wypowiedzenie);
        const paid = isSpacePaid(space);

        if (hasTenant && space.status !== 'inactive') {
          if (onNotice) {
            structure.occupiedNotice += 1;
          } else {
            structure.occupied += 1;
          }
        } else if (onNotice && paid) {
          structure.emptyNotice += 1;
        } else if (!hasTenant && paid && space.status !== 'inactive') {
          structure.losses += 1;
        } else {
          structure.free += 1;
        }
      }
    }
  }

  structure.occupiedTotal = structure.occupied + structure.occupiedNotice;
  structure.occupiedPercent = structure.total > 0
    ? Math.round((structure.occupiedTotal / structure.total) * 100)
    : 0;

  return structure;
};

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
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

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
    let totalOccupiedNotice = 0;
    let totalAddresses = 0;
    let conflictCount = 0;
    let unplannedPaidVacant = 0;
    let doWymeldowania = 0;

    const projectsToCalculate = activeProjectId 
      ? projects.filter(p => p.id === activeProjectId)
      : projects;

    for (const project of projectsToCalculate) {
      const stats = calculateProjectStats(project);
      const placeStructure = getProjectPlaceStructure(project);
      totalSpaces += placeStructure.total;
      totalOccupied += placeStructure.occupiedTotal;
      totalVacant += placeStructure.free;
      totalWypowiedzenie += placeStructure.emptyNotice;
      totalOccupiedNotice += placeStructure.occupiedNotice;
      totalAddresses += project.addresses.length;
      conflictCount += stats.conflictCount;
      unplannedPaidVacant += placeStructure.losses;
      doWymeldowania += stats.doWymeldowania;
    }

    return { totalSpaces, totalOccupied, totalVacant, totalWypowiedzenie, totalOccupiedNotice, totalAddresses, conflictCount, unplannedPaidVacant, doWymeldowania };
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

  const handleSaveProject = async (name: string, city?: string, billingType?: Project['billingType']) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, { name, city, billingType });
      } else {
        await addProject(name, city, billingType || 'mandate');
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
        setPendingCSVRows(rows);
        setPendingCSVGroups(groupsWithConflicts);
        setCurrentGroupIndex(0);
        setAddressMappings(mappings);
        setCSVImportDialogVisible(true);
      } else {
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
      const projectsData = await loadData();
      const index = projectsData.findIndex(p => p.id === project.id);
      if (index !== -1) {
        projectsData[index] = updatedProject;
        await saveData(projectsData);
        setProjects([...projectsData]);
        await loadProjects();
        Alert.alert('Sukces', 'Dane zostały zaimportowane');
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

    if (currentGroupIndex < pendingCSVGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      setCSVImportDialogVisible(false);
      await performImport(selectedProject, pendingCSVRows, newMappings);
      setPendingCSVRows([]);
      setPendingCSVGroups([]);
      setCurrentGroupIndex(0);
      setAddressMappings(new Map());
    }
  };

  const handleCreateNewAddress = async () => {
    if (!selectedProject) return;
    if (currentGroupIndex < pendingCSVGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
    } else {
      setCSVImportDialogVisible(false);
      await performImport(selectedProject, pendingCSVRows, addressMappings);
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

  const moveProject = async (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= projects.length) return;

    const newProjects = [...projects];
    const [movedProject] = newProjects.splice(fromIndex, 1);
    newProjects.splice(toIndex, 0, movedProject);
    
    setProjects(newProjects);
    await updateProjectsOrder(newProjects);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const overallStats = calculateOverallStats();

  return (
    <ScreenContainer className="p-4">
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-3xl font-bold text-foreground">{t.dashboard.title}</Text>
          {activeProjectId && (
            <Text className="text-sm text-primary font-medium">Filtrowanie: {projects.find(p => p.id === activeProjectId)?.name}</Text>
          )}
        </View>
        <Pressable onPress={() => setSettingsVisible(true)} className="bg-surfaceVariant rounded-full p-2">
          <MaterialIcons name="more-vert" size={24} color={colors.muted} />
        </Pressable>
      </View>

      {!loading && projects.length > 0 && (
        <View className="mb-6">
          <View className="flex-row gap-3 mb-3">
            <Pressable onPress={() => handleStatClick('lokale')} className="flex-1">
              <Card className="p-4 items-center">
                <MaterialIcons name="apartment" size={24} color={colors.primary} />
                <Text className="text-xs text-muted mt-1">Lokale</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalAddresses}</Text>
              </Card>
            </Pressable>

            <Pressable onPress={() => handleStatClick('total')} className="flex-1">
              <Card className="p-4 items-center">
                <MaterialIcons name="hotel" size={24} color={colors.primary} />
                <Text className="text-xs text-muted mt-1">Miejsca</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalSpaces}</Text>
              </Card>
            </Pressable>

            <Pressable onPress={() => handleStatClick('occupied')} className="flex-1">
              <Card className="p-4 items-center">
                <MaterialIcons name="person" size={24} color={colors.success} />
                <Text className="text-xs text-muted mt-1">Zajęte</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalOccupied}</Text>
              </Card>
            </Pressable>
          </View>

          <View className="flex-row gap-3">
            <Pressable onPress={() => handleStatClick('vacant')} className="flex-1">
              <Card className="p-4 items-center">
                <MaterialIcons name="hotel" size={24} color={colors.muted} />
                <Text className="text-xs text-muted mt-1">Wolne</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalVacant}</Text>
              </Card>
            </Pressable>

            <Pressable onPress={() => handleStatClick('wypowiedzenie')} className="flex-1">
              <Card className="p-4 items-center">
                <MaterialIcons name="warning" size={24} color={colors.warning} />
                <Text className="text-xs text-muted mt-1">Wypowiedzenia</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalWypowiedzenie}</Text>
              </Card>
            </Pressable>

            <Pressable onPress={() => handleStatClick('wypowiedzenie')} className="flex-1">
              <Card className="p-4 items-center">
                <MaterialIcons name="person" size={24} color={colors.warning} />
                <Text className="text-xs text-muted mt-1">Zajęte wyp.</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.totalOccupiedNotice}</Text>
              </Card>
            </Pressable>
          </View>

          <View className="flex-row gap-3 mt-3">
            <Pressable onPress={() => handleStatClick('conflicts')} className="flex-1">
              <Card className="p-4 items-center">
                <MaterialIcons name="error" size={24} color={colors.error} />
                <Text className="text-xs text-muted mt-1">Konflikty</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.conflictCount}</Text>
              </Card>
            </Pressable>

            <Pressable onPress={() => handleStatClick('vacant')} className="flex-1">
              <Card className="p-4 items-center border-error/40">
                <MaterialIcons name="priority-high" size={24} color={colors.error} />
                <Text className="text-xs text-muted mt-1">Straty</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.unplannedPaidVacant}</Text>
              </Card>
            </Pressable>

            <Pressable onPress={() => handleStatClick('conflicts')} className="flex-1">
              <Card className="p-4 items-center border-warning/40">
                <MaterialIcons name="person-off" size={24} color={colors.warning} />
                <Text className="text-xs text-muted mt-1">Do wymeldowania</Text>
                <Text className="text-xl font-bold text-foreground">{overallStats.doWymeldowania}</Text>
              </Card>
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">{t.common.loading}</Text>
          </View>
        ) : projects.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted">{t.messages.emptyProject}</Text>
          </View>
        ) : (
          projects.map((item, index) => {
            const stats = calculateProjectStats(item);
            const placeStructure = getProjectPlaceStructure(item);
            const hasEvictions = stats.wypowiedzenie > 0;
            const hasConflicts = stats.conflictCount > 0;
            const segments = [
              { key: 'occupied', count: placeStructure.occupied, color: colors.success },
              { key: 'occupiedNotice', count: placeStructure.occupiedNotice, color: colors.warning },
              { key: 'emptyNotice', count: placeStructure.emptyNotice, color: '#FDE68A' },
              { key: 'losses', count: placeStructure.losses, color: colors.error },
              { key: 'free', count: placeStructure.free, color: '#4B5563' },
            ].filter((segment) => segment.count > 0);
            const operators = new Set<string>();
            item.addresses.forEach(address => {
              if (address.supplierName) {
                operators.add(address.supplierName);
              } else if (address.operator) {
                operators.add(address.operator);
              }
            });
            const operatorList = Array.from(operators);

            const getOperatorLabel = (operator: string) => {
              switch (operator) {
                case 'rent_planet': return 'Rent Planet';
                case 'e_port': return 'E-Port';
                case 'other': return 'Inne';
                default: return operator;
              }
            };

            return (
              <Pressable
                key={item.id}
                onPress={() => handleProjectPress(item.id)}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (activeProjectId === item.id) {
                    setActiveProjectId(null);
                  } else {
                    setActiveProjectId(item.id);
                  }
                }}
                delayLongPress={500}
                className="mb-4"
              >
                <Card className={`p-5 ${activeProjectId === item.id ? 'border-primary' : ''}`}>
                  <View className="gap-4">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-foreground">{item.name}</Text>
                        {item.city && (
                          <View className="flex-row flex-wrap items-center gap-2 mt-1">
                            <Text className="text-sm text-muted">{item.city}</Text>
                            {operatorList.length > 0 && operatorList.map((operator) => (
                               <Badge key={operator} variant="supplier" size="sm" label={getOperatorLabel(operator)} />
                            ))}
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center gap-2">
                        {activeProjectId && (
                          <View className="flex-col gap-1">
                            {index > 0 && (
                              <Pressable onPress={() => moveProject(index, 'up')} className="p-1">
                                <MaterialIcons name="keyboard-arrow-up" size={20} color={colors.muted} />
                              </Pressable>
                            )}
                            {index < projects.length - 1 && (
                              <Pressable onPress={() => moveProject(index, 'down')} className="p-1">
                                <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.muted} />
                              </Pressable>
                            )}
                          </View>
                        )}
                        <Pressable onPress={() => handleProjectMenu(item)} className="bg-surfaceVariant/60 rounded-full p-2.5">
                          <MaterialIcons name="more-vert" size={20} color={colors.muted} />
                        </Pressable>
                      </View>
                    </View>

                    <View className="gap-2">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-4xl font-bold text-primary">{placeStructure.occupiedPercent}%</Text>
                        <Text className="text-sm text-muted">
                          {placeStructure.occupiedTotal}/{placeStructure.total} {t.addressList.occupied}
                        </Text>
                      </View>
                      <View
                        className="h-3 rounded-full overflow-hidden flex-row bg-surfaceVariant"
                        style={{ borderColor: colors.border, borderWidth: 1 }}
                      >
                        {segments.length > 0 ? (
                          segments.map((segment) => (
                            <View
                              key={segment.key}
                              style={{
                                width: `${(segment.count / Math.max(placeStructure.total, 1)) * 100}%`,
                                backgroundColor: segment.color,
                              }}
                            />
                          ))
                        ) : (
                          <View className="flex-1" style={{ backgroundColor: colors.muted }} />
                        )}
                      </View>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1">
                          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.error }} />
                          <Text className="text-xs text-muted">Straty</Text>
                          <Text className="text-xs font-semibold text-foreground">{placeStructure.losses}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FDE68A' }} />
                          <Text className="text-xs text-muted">Wyp.</Text>
                          <Text className="text-xs font-semibold text-foreground">{placeStructure.emptyNotice}</Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4B5563' }} />
                          <Text className="text-xs text-muted">Wolne</Text>
                          <Text className="text-xs font-semibold text-foreground">{placeStructure.free}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row flex-wrap gap-3 pt-2 border-t border-border/30">
                      {hasEvictions && <Badge variant="warning" size="sm" label={`${stats.wypowiedzenie} ${t.roomDetails.eviction}`} />}
                      {hasConflicts && <Badge variant="error" size="sm" label={`${stats.conflictCount} ${t.statistics.conflictCount}`} />}
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <FAB icon="add" bottom={-28} onPress={() => { setEditingProject(undefined); setFormVisible(true); }} />

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
        similarAddresses={selectedProject ? findSimilarAddresses(pendingCSVGroups[currentGroupIndex]?.fullAddress || '', selectedProject.addresses) : []}
        onSelectExisting={handleAddressMatch}
        onCreateNew={handleCreateNewAddress}
        onClose={() => setCSVImportDialogVisible(false)}
      />

      <ProjectFormModal
        visible={formVisible}
        project={editingProject}
        onClose={() => { setFormVisible(false); setEditingProject(undefined); }}
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
