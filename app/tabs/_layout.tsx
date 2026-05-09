// app/tabs/_layout.tsx

import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'tamagui';
import { Home, Search, Scan, MessageSquare, Calculator, User } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import { useAppStore } from '@/shared/lib/stores/app-store';

function DotBadge({ value }: { value?: number }) {
  if (!value || value <= 0) return null;
  return (
    <View
      position="absolute"
      top={-4} right={-4}
      w={18} h={18}
      br={9}
      ai="center" jc="center"
      backgroundColor="#007AFF"
      borderWidth={2}
      borderColor="white"
    >
      <Text color="white" fontSize={8} fontWeight="900">
        {value}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: isDark ? '#64748B' : '#94A3B8',
        tabBarBackground: () => (
          <BlurView 
            intensity={isDark ? 50 : 80} 
            tint={isDark ? 'dark' : 'light'}
            style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }} 
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 25,
          left: 20,
          right: 20,
          backgroundColor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          borderRadius: 24,
          height: 64,
          borderTopWidth: 0,
          paddingBottom: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.3 : 0.1,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('navigation.tabs.home', 'Home'),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="friends/search"
        options={{
          title: t('navigation.search', 'Search'),
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="scan-receipt"
        options={{
          title: t('navigation.tabs.scan', 'Scan'),
          tabBarIcon: ({ color }) => <Scan size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="chat/index"
        options={{
          title: t('navigation.tabs.chat', 'Chat'),
          tabBarIcon: ({ color }) => <MessageSquare size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="calculator"
        options={{
          title: t('calculator.title', 'Calculator'),
          tabBarIcon: ({ color }) => <Calculator size={24} color={color} />,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile', 'Profil'),
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />

      {/* Hidden Screens but reachable */}
      <Tabs.Screen name="chat/[id]" options={{ href: null }} />
      <Tabs.Screen name="friends/index" options={{ href: null }} />
      <Tabs.Screen name="friends/requests" options={{ href: null }} />
      <Tabs.Screen name="friends/invite" options={{ href: null }} />
      <Tabs.Screen name="groups/index" options={{ href: null }} />
      <Tabs.Screen name="groups/create" options={{ href: null }} />
      <Tabs.Screen name="groups/invite" options={{ href: null }} />
      <Tabs.Screen name="groups/[groupId]" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="scan-invite" options={{ href: null }} />
      <Tabs.Screen name="sessions/participants" options={{ href: null }} />
      <Tabs.Screen name="sessions/items-split" options={{ href: null }} />
      <Tabs.Screen name="sessions/finish" options={{ href: null }} />
      <Tabs.Screen name="sessions/history/index" options={{ href: null }} />
      <Tabs.Screen name="sessions/history/[historyId]" options={{ href: null }} />
      <Tabs.Screen name="sessions/create" options={{ href: null }} />
      <Tabs.Screen name="settings/personal" options={{ href: null }} />
      <Tabs.Screen name="settings/email" options={{ href: null }} />
      <Tabs.Screen name="settings/security" options={{ href: null }} />
      <Tabs.Screen name="settings/language" options={{ href: null }} />
      <Tabs.Screen name="settings/notifications" options={{ href: null }} />
      <Tabs.Screen name="settings/currency" options={{ href: null }} />
    </Tabs>
  );
}
