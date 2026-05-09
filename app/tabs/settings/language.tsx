import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Separator } from 'tamagui';
import { ChevronLeft, Languages, Check } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/shared/lib/stores/app-store';
import { LANGUAGE_OPTIONS, type LanguageCode } from '@/shared/config/languages';

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { language, setLanguage, theme } = useAppStore();
  const isDark = theme === 'dark';

  const handleLanguageChange = (code: LanguageCode) => {
    setLanguage(code);
    i18n.changeLanguage(code);
  };

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
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
        <XStack ai="center" gap="$4">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">Tilni tanlang</Text>
        </XStack>
      </LinearGradient>

      <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ p: 20 }}>
        <YStack gap="$6">
          <YStack ai="center" py="$4" gap="$3">
             <Circle size={90} bg={isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.05)'} ai="center" jc="center">
                <Languages size={44} color="#8B5CF6" />
             </Circle>
             <YStack ai="center" gap="$1">
               <Text fos={20} fow="900" col={isDark ? 'white' : '#1E293B'}>
                 {LANGUAGE_OPTIONS.find(o => o.code === language)?.label}
               </Text>
               <Text fos={14} col="$gray9" ta="center" fow="600">Ilovadan foydalanish uchun qulay tilni tanlang</Text>
             </YStack>
          </YStack>

          <YStack bg={isDark ? '#1C1C1E' : 'white'} br={32} overflow="hidden" shadowColor="#000" shadowOpacity={isDark ? 0.4 : 0.04} shadowRadius={30} elevation={10}>
            {LANGUAGE_OPTIONS.map((opt, index) => {
              const isSelected = language === opt.code;
              return (
                <React.Fragment key={opt.code}>
                  <Pressable 
                    onPress={() => handleLanguageChange(opt.code)}
                    style={({ pressed }) => ({
                      padding: 22,
                      backgroundColor: isSelected 
                        ? (isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.05)') 
                        : (pressed ? (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') : 'transparent'),
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    })}
                  >
                    <XStack ai="center" jc="space-between">
                      <XStack ai="center" gap="$4">
                        <Circle size={48} bg={isDark ? '#2C2C2E' : '#F1F5F9'} ai="center" jc="center">
                          <Text fos={24}>{opt.flag}</Text>
                        </Circle>
                        <YStack>
                          <Text fos={17} fow="800" col={isDark ? 'white' : '#1E293B'}>{opt.label}</Text>
                          <Text fos={12} col="$gray9" fow="700" opacity={0.8}>{opt.shortLabel.toUpperCase()}</Text>
                        </YStack>
                      </XStack>
                      {isSelected && (
                        <Circle size={28} bg="#007AFF" ai="center" jc="center" shadowColor="#007AFF" shadowOpacity={0.3} shadowRadius={10}>
                           <Check size={16} color="white" />
                        </Circle>
                      )}
                    </XStack>
                  </Pressable>
                  {index < LANGUAGE_OPTIONS.length - 1 && <Separator borderColor={isDark ? '#2C2C2E' : '$gray2'} ml={80} />}
                </React.Fragment>
              );
            })}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
