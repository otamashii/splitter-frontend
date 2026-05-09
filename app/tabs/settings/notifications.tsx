import React, { useState } from 'react';
import { Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, View, Circle, Separator } from 'tamagui';
import { ChevronLeft, Bell, MessageSquare, UserPlus, CreditCard } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { useAppStore } from '@/shared/lib/stores/app-store';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const [notifs, setNotifs] = useState({
    messages: true,
    requests: true,
    sessions: true,
    marketing: false
  });

  const toggle = (key: keyof typeof notifs) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
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
          <Text col="white" fos={20} fow="900">Bildirishnomalar</Text>
        </XStack>
      </LinearGradient>

      <ScrollView f={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ p: 20 }}>
        <YStack gap="$6">
          <YStack ai="center" py="$4" gap="$2">
             <Circle size={80} bg="rgba(245, 158, 11, 0.1)" ai="center" jc="center">
                <Bell size={40} color="#F59E0B" />
             </Circle>
             <Text fos={14} col="$gray9" ta="center">Siz uchun muhim bo'lgan yangiliklardan xabardor bo'ling</Text>
          </YStack>

          <YStack bg={isDark ? '#1C1C1E' : 'white'} br={28} overflow="hidden" shadowColor="#000" shadowOpacity={isDark ? 0.3 : 0.03} shadowRadius={20} elevation={5}>
            <NotificationToggle 
               icon={MessageSquare} 
               label="Xabarlar" 
               desc="Yangi xabarlar kelganda bildirish"
               value={notifs.messages}
               onToggle={() => toggle('messages')}
               color="#007AFF"
               isDark={isDark}
            />
            <Separator borderColor={isDark ? '#2C2C2E' : '$gray2'} />
            <NotificationToggle 
               icon={UserPlus} 
               label="Do'stlik so'rovlari" 
               desc="Yangi so'rovlar haqida xabar berish"
               value={notifs.requests}
               onToggle={() => toggle('requests')}
               color="#8B5CF6"
               isDark={isDark}
            />
            <Separator borderColor={isDark ? '#2C2C2E' : '$gray2'} />
            <NotificationToggle 
               icon={CreditCard} 
               label="Xarajatlar va bo'lish" 
               desc="Sessiyalar va to'lovlar haqida eslatmalar"
               value={notifs.sessions}
               onToggle={() => toggle('sessions')}
               color="#10B981"
               isDark={isDark}
            />
            <Separator borderColor={isDark ? '#2C2C2E' : '$gray2'} />
            <NotificationToggle 
               icon={Bell} 
               label="Tavsiyalar va yangiliklar" 
               desc="Ilova yangilanishlari va takliflar"
               value={notifs.marketing}
               onToggle={() => toggle('marketing')}
               color="#F59E0B"
               isDark={isDark}
            />
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}

function NotificationToggle({ icon: Icon, label, desc, value, onToggle, color, isDark }: any) {
  return (
    <XStack ai="center" jc="space-between" p="$4">
      <XStack ai="center" gap="$3" f={1}>
        <Circle size={40} bg={`${color}15`} ai="center" jc="center">
           <Icon size={20} color={color} />
        </Circle>
        <YStack f={1}>
           <Text fos={15} fow="700" col={isDark ? 'white' : '#1E293B'}>{label}</Text>
           <Text fos={12} col="$gray9" fow="600" numberOfLines={1}>{desc}</Text>
        </YStack>
      </XStack>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: color }}
        thumbColor={value ? 'white' : '#f4f3f4'}
      />
    </XStack>
  );
}
