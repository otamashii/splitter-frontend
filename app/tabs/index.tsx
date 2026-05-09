import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Pressable, ScrollView, RefreshControl, Dimensions, Animated as RNAnimated } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { YStack, XStack, Text, View, Circle, Spinner, Theme, AnimatePresence } from 'tamagui';
import { 
  ScanLine, Users, UserPlus, MessageSquare, Calculator, 
  History, ReceiptText, ChevronRight, PlusCircle, 
  Bell, Wallet, TrendingUp, CreditCard, Moon, Sun 
} from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

import { ScreenContainer } from '@/shared/ui/ScreenContainer';
import UserAvatar from '@/shared/ui/UserAvatar';
import type { SessionHistoryEntry } from '@/features/sessions/api/history.api';
import { useSessionsHistoryStore } from '@/features/sessions/model/history.store';
import { useAppStore } from '@/shared/lib/stores/app-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ServiceButton({ icon: Icon, label, color, onPress }: { icon: any, label: string, color: string, onPress: () => void }) {
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      width: (SCREEN_WIDTH - 60) / 4,
      alignItems: 'center',
      opacity: pressed ? 0.7 : 1,
      transform: [{ scale: pressed ? 0.92 : 1 }]
    })}>
      <YStack 
        width={56} 
        height={56} 
        borderRadius={20} 
        backgroundColor={isDark ? '#2C2C2E' : 'white'} 
        ai="center" 
        jc="center"
        shadowColor={color}
        shadowOffset={{ width: 0, height: 8 }}
        shadowOpacity={isDark ? 0.3 : 0.15}
        shadowRadius={12}
        elevation={8}
        mb="$2"
      >
        <Icon size={26} color={color} />
      </YStack>
      <Text fontSize={11} fontWeight="700" col="$gray11" ta="center">{label}</Text>
    </Pressable>
  );
}

function MainActionCard({ title, subtitle, icon: Icon, colors, onPress }: { title: string, subtitle: string, icon: any, colors: string[], onPress: () => void }) {
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      flex: 1,
      opacity: pressed ? 0.9 : 1,
      transform: [{ scale: pressed ? 0.98 : 1 }]
    })}>
      <YStack
        height={180}
        borderRadius={32}
        overflow="hidden"
        backgroundColor={isDark ? '#1C1C1E' : 'white'} 
        shadowColor={colors[0]}
        shadowOffset={{ width: 0, height: 15 }}
        shadowOpacity={isDark ? 0.3 : 0.12}
        shadowRadius={25}
        elevation={15}
        p="$4"
        jc="space-between"
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08 }}
        />
        <Circle size={48} bg={colors[0] + '15'} ai="center" jc="center">
           <Icon size={24} color={colors[0]} />
        </Circle>
        <YStack gap="$1">
          <Text fontSize={18} fontWeight="900" col={isDark ? 'white' : '#1E293B'} letterSpacing={-0.5}>{title}</Text>
          <Text fontSize={12} col="$gray9" fontWeight="600" numberOfLines={2}>{subtitle}</Text>
        </YStack>
      </YStack>
    </Pressable>
  );
}

function HistoryCard({ bill, onPress }: { bill: SessionHistoryEntry, onPress: () => void }) {
  const { t } = useTranslation();
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({
      opacity: pressed ? 0.7 : 1,
      transform: [{ scale: pressed ? 0.98 : 1 }]
    })}>
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
              {bill.sessionName || 'Hisob'}
            </Text>
            <Text fontSize={11} col="$gray9" fontWeight="700" mt="$0.5">
              {new Date(bill.finalizedAt || bill.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
            </Text>
          </YStack>
        </XStack>
        
        <YStack ai="flex-end" minWidth={80}>
          <Text fontSize={16} fontWeight="900" col="#007AFF" numberOfLines={1}>
            {(bill.grandTotal || 0).toLocaleString()}
          </Text>
          <Text fontSize={9} fow="900" col="$gray9" textTransform="uppercase" letterSpacing={0.5}>
            {bill.currency || 'UZS'}
          </Text>
        </YStack>
      </XStack>
    </Pressable>
  );
}

export default function HomePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const user = useAppStore(s => s.user);
  const { sessions, loading, fetchHistory, forceRefresh } = useSessionsHistoryStore();
  const theme = useAppStore(s => s.theme);
  const currency = useAppStore(s => s.currency);
  const setTheme = useAppStore(s => s.setTheme);
  const isDark = theme === 'dark';

  useEffect(() => { fetchHistory(5); }, []);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  return (
    <View f={1} bg={isDark ? '#000000' : '#F8F9FA'}>
      <ScrollView 
        f={1} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => forceRefresh(5)} />}
      >
        {/* Deep Premium Header */}
        <YStack>
          <LinearGradient
            colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
            style={{
              paddingTop: insets.top + 10,
              paddingBottom: 80,
              paddingHorizontal: 24,
              borderBottomLeftRadius: 40,
              borderBottomRightRadius: 40,
            }}
          >
            <XStack jc="space-between" ai="center" mb="$6">
              <XStack ai="center" gap="$3">
                <Pressable onPress={() => router.push('/tabs/profile')}>
                   <UserAvatar uri={user?.avatarUrl} label={user?.username?.slice(0, 1).toUpperCase()} size={44} />
                </Pressable>
                <YStack>
                  <Text col="white" opacity={0.8} fontSize={12} fontWeight="700" textTransform="uppercase">Splitter Pro</Text>
                  <Text col="white" fontSize={18} fontWeight="900">{user?.username || 'User'}</Text>
                </YStack>
              </XStack>
              <XStack gap="$3">
                <Pressable onPress={toggleTheme}>
                  <Circle size={44} bg="rgba(255,255,255,0.1)" ai="center" jc="center">
                    {isDark ? <Sun size={20} color="white" /> : <Moon size={20} color="white" />}
                  </Circle>
                </Pressable>
                <Circle size={44} bg="rgba(255,255,255,0.1)" ai="center" jc="center">
                  <Bell size={20} color="white" />
                </Circle>
              </XStack>
            </XStack>

            <YStack gap="$1" ai="center">
               <Text col="white" opacity={0.7} fontSize={13} fontWeight="700">{t('home.total_spent', 'Umumiy xarajatlar')}</Text>
               <XStack ai="baseline" gap="$2">
                  <Text col="white" fontSize={42} fontWeight="900">1,240,000</Text>
                  <Text col="white" fontSize={18} fontWeight="900" opacity={0.9}>{currency}</Text>
               </XStack>
            </YStack>
          </LinearGradient>

          {/* Floating Balance Card */}
          <YStack px="$6" mt="$-10">
            <YStack 
              bg={isDark ? '#1C1C1E' : 'white'} 
              br={32} 
              p="$5" 
              shadowColor="#000" 
              shadowOpacity={isDark ? 0.3 : 0.1} 
              shadowRadius={30} 
              elevation={20}
              gap="$4"
            >
              <XStack jc="space-between" ai="center">
                <XStack ai="center" gap="$3">
                  <Circle size={40} bg="rgba(0,122,255,0.1)" ai="center" jc="center">
                    <TrendingUp size={20} color="#007AFF" />
                  </Circle>
                  <YStack>
                    <Text col={isDark ? 'white' : '#1E293B'} fontSize={15} fontWeight="800">Yanvar oyi</Text>
                    <Text col="$gray9" fontSize={11} fontWeight="600">+12% o'sish</Text>
                  </YStack>
                </XStack>
                <ChevronRight size={20} color="$gray8" />
              </XStack>
            </YStack>
          </YStack>
        </YStack>

        <YStack p="$5" gap="$8">
          {/* Main Quick Actions */}
          <XStack gap="$4">
             <MainActionCard 
                title="Scan Receipt" 
                subtitle="Chekni skanerlang va avtomat taqsimlang" 
                icon={ScanLine} 
                colors={['#007AFF', '#00C6FF']}
                onPress={() => router.push('/tabs/scan-receipt')}
             />
             <MainActionCard 
                title="Manual Entry" 
                subtitle="Xarajatlarni qo'lda kiritish va bo'lish" 
                icon={PlusCircle} 
                colors={['#8B5CF6', '#D946EF']}
                onPress={() => router.push('/tabs/sessions/create')}
             />
          </XStack>

          {/* Service Grid - ULTRA PREMIUM */}
          <YStack gap="$4">
             <Text col={isDark ? 'white' : '#1E293B'} fontSize={18} fontWeight="900" letterSpacing={-0.5}>Xizmatlar</Text>
             <XStack jc="space-between">
                <ServiceButton icon={Users} label="Do'stlar" color="#007AFF" onPress={() => router.push('/tabs/friends')} />
                <ServiceButton icon={UserPlus} label="Guruhlar" color="#8B5CF6" onPress={() => router.push('/tabs/groups')} />
                <ServiceButton icon={MessageSquare} label="Chatlar" color="#10B981" onPress={() => router.push('/tabs/chat')} />
                <ServiceButton icon={Calculator} label="Kalkulyator" color="#F59E0B" onPress={() => router.push('/tabs/calculator')} />
             </XStack>
          </YStack>

          {/* Recent History */}
          <YStack gap="$4">
             <XStack jc="space-between" ai="center">
                <Text col={isDark ? 'white' : '#1E293B'} fontSize={18} fontWeight="900" letterSpacing={-0.5}>Oxirgi amallar</Text>
                <Pressable onPress={() => router.push('/tabs/sessions/history')}>
                  <Text col="#007AFF" fontWeight="800" fontSize={13}>Hammasi</Text>
                </Pressable>
             </XStack>
             
             <YStack>
                {loading && !sessions.length ? (
                  <YStack ai="center" py="$5"><Spinner color="#007AFF" /></YStack>
                ) : sessions.slice(0, 3).map(bill => (
                  <HistoryCard 
                    key={bill.sessionId} 
                    bill={bill} 
                    onPress={() => router.push({
                      pathname: '/tabs/sessions/history/[historyId]',
                      params: { historyId: String(bill.sessionId) },
                    })}
                  />
                ))}
                {!loading && !sessions.length && (
                  <YStack bg={isDark ? '#1C1C1E' : 'white'} br={24} p="$6" ai="center" gap="$2">
                    <ReceiptText size={40} color="$gray4" />
                    <Text col="$gray9" fontWeight="700">Hozircha amallar yo'q</Text>
                  </YStack>
                )}
             </YStack>
          </YStack>
        </YStack>

        {/* Card Ad Space (Like Click/Payme) */}
        <YStack p="$5" mb="$10">
           <LinearGradient
              colors={['#6366F1', '#4F46E5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 32, padding: 24, minHeight: 140, justifyContent: 'center' }}
           >
              <XStack ai="center" jc="space-between">
                 <YStack gap="$1" f={1}>
                    <Text col="white" fontSize={18} fontWeight="900">Premium Splitter</Text>
                    <Text col="white" opacity={0.8} fontSize={13} fontWeight="600">Barcha funksiyalardan cheksiz foydalaning</Text>
                 </YStack>
                 <Circle size={56} bg="rgba(255,255,255,0.2)" ai="center" jc="center">
                    <CreditCard size={28} color="white" />
                 </Circle>
              </XStack>
           </LinearGradient>
        </YStack>
      </ScrollView>
    </View>
  );
}
