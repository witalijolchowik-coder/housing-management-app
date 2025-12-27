import { View, Text, Pressable, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { useColors } from '@/hooks/use-colors';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from './card';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, label, placeholder }: DatePickerProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const handleDateSelect = () => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    onChange(dateStr);
    setVisible(false);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return placeholder || 'Wybierz datę';
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  return (
    <View className="gap-2">
      {label && <Text className="text-sm font-semibold text-foreground">{label}</Text>}
      
      <Pressable
        onPress={() => setVisible(true)}
        className="bg-surfaceVariant rounded-lg px-4 py-3 flex-row items-center justify-between"
      >
        <Text className={value ? 'text-foreground' : 'text-muted'}>
          {formatDate(value)}
        </Text>
        <MaterialIcons name="calendar-month" size={20} color={colors.primary} />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          onPress={() => setVisible(false)}
          className="flex-1 bg-black/50 items-center justify-center"
        >
          <Card className="w-80 p-6 gap-4">
            <Text className="text-lg font-bold text-foreground">Wybierz datę</Text>

            {/* Date Selectors */}
            <View className="flex-row gap-2 justify-center">
              {/* Day Picker */}
              <View className="items-center gap-2">
                <Text className="text-xs text-muted font-semibold">DZIEŃ</Text>
                <ScrollView
                  horizontal={false}
                  style={{ height: 120, width: 60 }}
                  showsVerticalScrollIndicator={false}
                >
                  {days.map((day) => (
                    <Pressable
                      key={day}
                      onPress={() => setSelectedDay(day)}
                      className={`items-center justify-center py-2 px-3 rounded ${
                        selectedDay === day ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          selectedDay === day ? 'text-background' : 'text-foreground'
                        }`}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Month Picker */}
              <View className="items-center gap-2">
                <Text className="text-xs text-muted font-semibold">MIESIĄC</Text>
                <ScrollView
                  horizontal={false}
                  style={{ height: 120, width: 60 }}
                  showsVerticalScrollIndicator={false}
                >
                  {months.map((month) => (
                    <Pressable
                      key={month}
                      onPress={() => setSelectedMonth(month)}
                      className={`items-center justify-center py-2 px-3 rounded ${
                        selectedMonth === month ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          selectedMonth === month ? 'text-background' : 'text-foreground'
                        }`}
                      >
                        {month}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Year Picker */}
              <View className="items-center gap-2">
                <Text className="text-xs text-muted font-semibold">ROK</Text>
                <ScrollView
                  horizontal={false}
                  style={{ height: 120, width: 70 }}
                  showsVerticalScrollIndicator={false}
                >
                  {years.map((year) => (
                    <Pressable
                      key={year}
                      onPress={() => setSelectedYear(year)}
                      className={`items-center justify-center py-2 px-3 rounded ${
                        selectedYear === year ? 'bg-primary' : 'bg-surface'
                      }`}
                    >
                      <Text
                        className={`font-semibold ${
                          selectedYear === year ? 'text-background' : 'text-foreground'
                        }`}
                      >
                        {year}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Preview */}
            <View className="bg-surface rounded-lg p-3 items-center">
              <Text className="text-sm text-muted">Wybrana data:</Text>
              <Text className="text-lg font-bold text-foreground">
                {String(selectedDay).padStart(2, '0')}.{String(selectedMonth).padStart(2, '0')}.{selectedYear}
              </Text>
            </View>

            {/* Buttons */}
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setVisible(false)}
                className="flex-1 bg-surface rounded-lg py-3 items-center"
              >
                <Text className="text-foreground font-semibold">Anuluj</Text>
              </Pressable>
              <Pressable
                onPress={handleDateSelect}
                className="flex-1 bg-primary rounded-lg py-3 items-center"
              >
                <Text className="text-background font-semibold">OK</Text>
              </Pressable>
            </View>
          </Card>
        </Pressable>
      </Modal>
    </View>
  );
}
