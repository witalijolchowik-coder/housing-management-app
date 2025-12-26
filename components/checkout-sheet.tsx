import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useState } from 'react';
import { useTranslations } from '@/hooks/use-translations';
import { useColors } from '@/hooks/use-colors';
import { Card } from './ui/card';
import { ProgressBar } from './ui/progress-bar';
import { MaterialIcons } from '@expo/vector-icons';

export interface CheckoutSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: CheckoutData) => void;
  evictionPeriod?: number;
}

export interface CheckoutData {
  checkoutDate: string;
  enableWypowiedzenie: boolean;
  wypowiedzienieStartDate?: string;
}

export function CheckoutSheet({
  visible,
  onClose,
  onConfirm,
  evictionPeriod = 14,
}: CheckoutSheetProps) {
  const t = useTranslations();
  const colors = useColors();

  const [step, setStep] = useState(1);
  const [checkoutDate, setCheckoutDate] = useState('');
  const [enableWypowiedzenie, setEnableWypowiedzenie] = useState(true);
  const [wypowiedzienieStartDate, setWypowiedzienieStartDate] = useState('');

  if (!visible) return null;

  const handleConfirm = () => {
    onConfirm({
      checkoutDate,
      enableWypowiedzenie,
      wypowiedzienieStartDate: enableWypowiedzenie ? wypowiedzienieStartDate : undefined,
    });
    onClose();
  };

  const StepIndicator = () => (
    <View className="flex-row items-center justify-between mb-6">
      {[1, 2, 3, 4, 5].map((num) => (
        <View key={num} className="items-center flex-1">
          <View
            className={`w-10 h-10 rounded-full items-center justify-center ${
              num <= step ? 'bg-primary' : 'bg-surfaceVariant'
            }`}
          >
            <Text
              className={`font-semibold ${
                num <= step ? 'text-foreground' : 'text-muted'
              }`}
            >
              {num}
            </Text>
          </View>
          {num < 5 && (
            <View
              className={`h-1 flex-1 mt-2 ${
                num < step ? 'bg-primary' : 'bg-surfaceVariant'
              }`}
            />
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View className="absolute inset-0 bg-black/50 items-end">
      <View className="bg-background w-full rounded-t-3xl p-6 max-h-[90%]">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-foreground">{t.checkout.title}</Text>
            <Pressable onPress={onClose} className="bg-surfaceVariant rounded-full p-2">
              <MaterialIcons name="close" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Step Indicator */}
          <StepIndicator />

          {/* Content */}
          <Card className="p-6 gap-4 mb-6">
            {/* Checkout Date */}
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                {t.checkout.checkoutDate}
              </Text>
              <Pressable className="bg-surfaceVariant rounded-lg px-4 py-3 flex-row items-center justify-between">
                <Text className="text-foreground">{checkoutDate || t.common.loading}</Text>
                <MaterialIcons name="calendar-month" size={20} color={colors.primary} />
              </Pressable>
            </View>

            {/* Wypowiedzenie Toggle */}
            <View className="flex-row items-center justify-between mt-4">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  {t.checkout.enableWypowiedzenie}
                </Text>
                <Text className="text-xs text-muted mt-1">
                  {t.checkout.wypowiedzienieDescription}
                </Text>
              </View>
              <Switch
                value={enableWypowiedzenie}
                onValueChange={setEnableWypowiedzenie}
                trackColor={{ false: colors.surfaceVariant, true: colors.primary }}
              />
            </View>

            {/* Conditional Wypowiedzenie Fields */}
            {enableWypowiedzenie && (
              <View className="gap-4 mt-4 pt-4 border-t border-border">
                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">
                    {t.checkout.startDate}
                  </Text>
                  <Pressable className="bg-surfaceVariant rounded-lg px-4 py-3 flex-row items-center justify-between">
                    <Text className="text-foreground">
                      {wypowiedzienieStartDate || t.common.loading}
                    </Text>
                    <MaterialIcons name="calendar-month" size={20} color={colors.primary} />
                  </Pressable>
                </View>

                {/* Info Text */}
                <View className="bg-surfaceVariant rounded-lg p-3">
                  <Text className="text-xs text-muted">
                    {t.checkout.daysRemaining}: {evictionPeriod} {t.common.ok}
                  </Text>
                </View>

                {/* Progress Indicator */}
                <View className="gap-2">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-muted">{t.checkout.daysRemaining}</Text>
                    <Text className="text-sm font-semibold text-warning">
                      {evictionPeriod} {t.common.ok}
                    </Text>
                  </View>
                  <ProgressBar progress={100} color="bg-warning" />
                </View>
              </View>
            )}
          </Card>

          {/* Buttons */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 border border-border rounded-lg px-4 py-3 items-center"
            >
              <Text className="text-foreground font-semibold">{t.common.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="flex-1 bg-primary rounded-lg px-4 py-3 items-center"
            >
              <Text className="text-foreground font-semibold">{t.common.save}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
