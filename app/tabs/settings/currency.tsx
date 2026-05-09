import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { YStack, XStack, Text, View, Circle, Separator } from 'tamagui';
import { ChevronLeft, Check, DollarSign, Coins } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/shared/lib/stores/app-store';

const CURRENCIES = [
  { code: 'UZS', label: "O'zbek so'mi", symbol: 'sum' },
  { code: 'USD', label: 'AQSH Dollari', symbol: '$' },
  { code: 'EUR', label: 'Yevro', symbol: '€' },
  { code: 'JPY', label: 'Yapon iyenasi', symbol: '¥' },
];

export default function CurrencyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  const currentCurrency = useAppStore(s => s.currency);
  const setCurrency = useAppStore(s => s.setCurrency);

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      {/* Theme-aware Header */}
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 25,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <XStack ai="center" jc="space-between">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">Asosiy valyuta</Text>
          <View width={40} />
        </XStack>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} p="$2" shadowColor="#000" shadowOpacity={isDark ? 0.3 : 0.03} shadowRadius={20} elevation={5}>
          {CURRENCIES.map((item, index) => (
            <React.Fragment key={item.code}>
              <Pressable onPress={() => setCurrency(item.code as any)}>
                <XStack p="$4" ai="center" jc="space-between">
                  <XStack ai="center" gap="$4">
                    <Circle size={44} bg={currentCurrency === item.code ? '#007AFF15' : (isDark ? '#2C2C2E' : '#F1F5F9')} ai="center" jc="center">
                       <Text col={currentCurrency === item.code ? '#007AFF' : (isDark ? '#94A3B8' : '#64748B')} fow="900" fos={16}>
                        {item.symbol}
                       </Text>
                    </Circle>
                    <YStack>
                      <Text col={isDark ? 'white' : '#1E293B'} fos={16} fow="700">{item.label}</Text>
                      <Text col="$gray9" fos={12} fow="600">{item.code}</Text>
                    </YStack>
                  </XStack>
                  {currentCurrency === item.code && (
                    <View bg="#007AFF" p="$1.5" br={10}>
                      <Check size={16} color="white" />
                    </View>
                  )}
                </XStack>
              </Pressable>
              {index < CURRENCIES.length - 1 && (
                <Separator ml={70} borderColor={isDark ? '#2C2C2E' : '$gray3'} />
              )}
            </React.Fragment>
          ))}
        </YStack>

        <YStack mt="$6" p="$5" bg={isDark ? '#1C1C1E' : '#E0F2FE'} br={24} gap="$2">
          <XStack ai="center" gap="$2">
            <Coins size={18} color="#007AFF" />
            <Text col={isDark ? 'white' : '#0369A1'} fos={14} fow="800">Ma'lumot</Text>
          </XStack>
          <Text col={isDark ? '#94A3B8' : '#075985'} fos={13} fow="600" lh={18}>
            Tanlangan valyuta dastur bo'ylab asosiy hisob-kitoblar va xarajatlarni ko'rsatishda ishlatiladi.
          </Text>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
