import React, { useState } from 'react';
import { Pressable, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, Circle, View } from 'tamagui';
import { ChevronLeft, Delete } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/shared/lib/stores/app-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_SIZE = (SCREEN_WIDTH - 60) / 4;

function CalcButton({ label, type, onPress }: { label: string, type: 'num' | 'op' | 'action', onPress: (v: string) => void }) {
  const theme = useAppStore(s => s.theme);
  const isDark = theme === 'dark';
  const isOp = type === 'op';
  const isAction = type === 'action';

  return (
    <Pressable onPress={() => onPress(label)} style={({ pressed }) => ({
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      borderRadius: BUTTON_SIZE / 2,
      backgroundColor: isOp ? '#007AFF' : isAction ? (isDark ? '#2C2C2E' : '#E2E8F0') : (isDark ? '#1C1C1E' : 'white'),
      alignItems: 'center',
      justifyContent: 'center',
      opacity: pressed ? 0.6 : 1,
      transform: [{ scale: pressed ? 0.88 : 1 }],
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowRadius: 10,
      elevation: 3,
    })}>
      <Text 
        fontSize={24} 
        fontWeight="800" 
        color={isOp ? 'white' : (isDark ? 'white' : '#1E293B')}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CalculatorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState('');
  const [op, setOp] = useState('');

  const theme = useAppStore(s => s.theme);
  const currency = useAppStore(s => s.currency);
  const isDark = theme === 'dark';

  const handlePress = (val: string) => {
    if (val === 'C') {
      setDisplay('0');
      setPrev('');
      setOp('');
      return;
    }

    if (['+', '-', '×', '÷'].includes(val)) {
      setPrev(display);
      setOp(val);
      setDisplay('0');
      return;
    }

    if (val === '=') {
      if (!op || !prev) return;
      const a = parseFloat(prev);
      const b = parseFloat(display);
      let res = 0;
      if (op === '+') res = a + b;
      if (op === '-') res = a - b;
      if (op === '×') res = a * b;
      if (op === '÷') res = a / b;
      setDisplay(String(Math.round(res * 100) / 100));
      setPrev('');
      setOp('');
      return;
    }

    setDisplay(d => d === '0' ? val : d + val);
  };

  return (
    <YStack f={1} bg={isDark ? '#000000' : '#F1F5F9'}>
      <LinearGradient
        colors={isDark ? ['#0F172A', '#1E293B'] : ['#007AFF', '#00C6FF']}
        style={{
          paddingTop: insets.top + 10,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      >
        <XStack ai="center" jc="space-between" mb="$4">
          <Pressable onPress={() => router.back()}>
            <YStack p="$2" br={12} bg="rgba(255,255,255,0.1)">
              <ChevronLeft size={24} color="white" />
            </YStack>
          </Pressable>
          <Text col="white" fos={18} fow="900">{t('calculator.title', 'Calculator')}</Text>
          <View width={40} />
        </XStack>

        <YStack ai="flex-end" px="$4">
           <Text col="white" opacity={0.75} fos={18} fow="600" h={24}>{prev} {op}</Text>
            <XStack ai="baseline" gap="$2">
               <Text col="white" fos={56} fow="900" numberOfLines={1} adjustsFontSizeToFit>{display}</Text>
               <Text col="white" opacity={0.6} fos={20} fow="800">{currency}</Text>
            </XStack>
        </YStack>
      </LinearGradient>

      <YStack f={1} p="$5" jc="center" pt="$5" pb={110} gap="$4">
        <XStack jc="space-between">
           <CalcButton label="C" type="action" onPress={handlePress} />
           <CalcButton label="±" type="action" onPress={handlePress} />
           <CalcButton label="%" type="action" onPress={handlePress} />
           <CalcButton label="÷" type="op" onPress={handlePress} />
        </XStack>
        <XStack jc="space-between">
           <CalcButton label="7" type="num" onPress={handlePress} />
           <CalcButton label="8" type="num" onPress={handlePress} />
           <CalcButton label="9" type="num" onPress={handlePress} />
           <CalcButton label="×" type="op" onPress={handlePress} />
        </XStack>
        <XStack jc="space-between">
           <CalcButton label="4" type="num" onPress={handlePress} />
           <CalcButton label="5" type="num" onPress={handlePress} />
           <CalcButton label="6" type="num" onPress={handlePress} />
           <CalcButton label="-" type="op" onPress={handlePress} />
        </XStack>
        <XStack jc="space-between">
           <CalcButton label="1" type="num" onPress={handlePress} />
           <CalcButton label="2" type="num" onPress={handlePress} />
           <CalcButton label="3" type="num" onPress={handlePress} />
           <CalcButton label="+" type="op" onPress={handlePress} />
        </XStack>
        <XStack jc="space-between">
           <CalcButton label="0" type="num" onPress={handlePress} />
           <CalcButton label="." type="num" onPress={handlePress} />
           <Pressable onPress={() => handlePress('=')} style={({ pressed }) => ({
              width: BUTTON_SIZE * 2 + 15,
              height: BUTTON_SIZE,
              borderRadius: BUTTON_SIZE / 2,
              backgroundColor: '#007AFF',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }]
           })}>
              <Text col="white" fos={32} fow="900">=</Text>
           </Pressable>
        </XStack>
      </YStack>
    </YStack>
  );
}
