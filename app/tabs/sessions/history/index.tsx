import React, { useCallback, useEffect } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, ScrollView, Circle, Spinner, View } from 'tamagui';
import { ChevronLeft, ReceiptText, Calendar, ChevronRight, History as HistoryIcon, Search } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useSessionsHistoryStore } from '@/features/sessions/model/history.store';
import { useAppStore } from '@/shared/lib/stores/app-store';

const formatSessionDate = (value?: string, locale: string = 'en') => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
};

export default function HistoryIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  
  const { sessions, loading, fetchHistory, forceRefresh } = useSessionsHistoryStore();

  useEffect(() => {
    fetchHistory(20);
  }, []);

  return (
    <YStack f={1} bg="white">
      {/* Header with Blue Gradient */}
      <LinearGradient
        colors={['#007AFF', '#0055FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.2)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={20} fow="900">{t('history.title', 'Xarajatlar tarixi')}</Text>
          <View width={40} />
        </XStack>
      </LinearGradient>

      <ScrollView 
        f={1} 
        p="$5" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => forceRefresh(20)} />
        }
      >
        <YStack gap="$4" pb="$10">
          {loading && sessions.length === 0 ? (
            <YStack ai="center" py="$10">
              <Spinner color="#007AFF" />
            </YStack>
          ) : sessions.length > 0 ? (
            sessions.map((session) => (
              <Pressable 
                key={session.sessionId} 
                onPress={() => router.push({
                    pathname: '/tabs/sessions/history/[historyId]',
                    params: { historyId: String(session.sessionId) },
                })}
              >
                <XStack 
                  bg="white" 
                  br={24} 
                  p="$4" 
                  ai="center" 
                  jc="space-between"
                  shadowColor="#000"
                  shadowOpacity={0.05}
                  shadowRadius={15}
                  elevation={4}
                  borderWidth={1}
                  borderColor="$gray3"
                >
                  <XStack ai="center" gap="$4">
                    <Circle size={48} bg="rgba(0,122,255,0.08)" ai="center" jc="center">
                      <ReceiptText size={24} color="#007AFF" />
                    </Circle>
                    <YStack gap="$1">
                      <Text fos={16} fow="800" col="$gray12">{session.sessionName}</Text>
                      <XStack ai="center" gap="$1.5">
                        <Calendar size={12} color="$gray9" />
                        <Text fos={12} col="$gray9" fow="600">{formatSessionDate(session.finalizedAt || session.createdAt, i18n.language)}</Text>
                      </XStack>
                    </YStack>
                  </XStack>
                  <YStack ai="flex-end" gap="$1">
                    <Text fos={16} fow="900" col="#007AFF">
                      {(session.grandTotal || 0).toLocaleString()}
                    </Text>
                    <Text fos={10} fow="700" col="$gray10" textTransform="uppercase">
                      {session.currency || 'UZS'}
                    </Text>
                  </YStack>
                </XStack>
              </Pressable>
            ))
          ) : (
            <YStack ai="center" py="$20" gap="$4">
              <Circle size={80} bg="$gray2" ai="center" jc="center">
                <HistoryIcon size={40} color="$gray8" />
              </Circle>
              <Text col="$gray9" fow="700" fos={16}>{t('history.empty', 'Hozircha tarix yo\'q')}</Text>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
