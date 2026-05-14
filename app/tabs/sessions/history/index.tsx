import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
  const params = useLocalSearchParams<{ month?: string; year?: string }>();

  const filterMonth = params.month ? parseInt(params.month) - 1 : null; // 0-indexed
  const filterYear  = params.year  ? parseInt(params.year)           : null;

  const { sessions, loading, fetchHistory, forceRefresh } = useSessionsHistoryStore();
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchHistory(100);
  }, []);

  // Filter by month/year if params provided
  const visibleSessions = useMemo(() => {
    if (filterMonth === null || filterYear === null) return sessions;
    return sessions.filter(s => {
      const d = new Date(s.finalizedAt || s.createdAt);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
  }, [sessions, filterMonth, filterYear]);

  // Title: if filtered show month name, else generic
  const screenTitle = useMemo(() => {
    if (filterMonth === null || filterYear === null) return t('history.title', 'Xarajatlar tarixi');
    const d = new Date(filterYear, filterMonth, 1);
    const monthName = d.toLocaleDateString('uz-UZ', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  }, [filterMonth, filterYear, t]);

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
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
          <Text col="white" fos={18} fow="900" numberOfLines={1} adjustsFontSizeToFit>{screenTitle}</Text>
          <View width={40} />
        </XStack>
      </LinearGradient>

      <ScrollView 
        f={1} 
        p="$5" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => forceRefresh(100)} />
        }
      >
        <YStack gap="$4" pb="$10">
          {loading && visibleSessions.length === 0 ? (
            <YStack ai="center" py="$10">
              <Spinner color="#007AFF" />
            </YStack>
          ) : visibleSessions.length > 0 ? (
            visibleSessions.map((session) => (
              <Pressable 
                key={session.sessionId} 
                onPress={() => router.push({
                    pathname: '/tabs/sessions/history/[historyId]',
                    params: { historyId: String(session.sessionId) },
                })}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
              >
                <XStack 
                  bg={isDark ? '#1C1C1E' : 'white'} 
                  br={24} 
                  p="$3.5" 
                  ai="center" 
                  jc="space-between"
                  mb="$3"
                  borderWidth={isDark ? 1 : 0}
                  borderColor="rgba(255,255,255,0.05)"
                  shadowColor="#000"
                  shadowOpacity={isDark ? 0.4 : 0.04}
                  shadowRadius={15}
                  elevation={3}
                >
                  <XStack ai="center" gap="$3" f={1} mr="$3">
                    <Circle size={44} bg={isDark ? 'rgba(0,122,255,0.15)' : 'rgba(0,122,255,0.05)'} ai="center" jc="center">
                      <ReceiptText size={20} color="#007AFF" />
                    </Circle>
                    <YStack f={1}>
                      <Text
                        fontSize={15}
                        fontWeight="800"
                        col={isDark ? 'white' : '#1E293B'}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {session.sessionName || 'Hisob'}
                      </Text>
                      <Text fontSize={11} col="$gray9" fontWeight="700" mt="$0.5">
                        {new Date(session.finalizedAt || session.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
                      </Text>
                    </YStack>
                  </XStack>

                  <YStack ai="flex-end" minWidth={80}>
                    <Text fontSize={16} fontWeight="900" col="#007AFF" numberOfLines={1}>
                      {(session.grandTotal || 0).toLocaleString()}
                    </Text>
                    <Text fontSize={9} fow="900" col="$gray9" textTransform="uppercase" letterSpacing={0.5}>
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
