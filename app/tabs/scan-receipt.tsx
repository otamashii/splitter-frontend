import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable, Dimensions, Alert } from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Spinner, Circle } from 'tamagui';
import { ChevronLeft, QrCode, AlertTriangle, Zap, ZapOff, Camera as CameraIcon, Image as ImageIcon } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing
} from 'react-native-reanimated';
import Svg, { Defs, Rect, Mask } from 'react-native-svg';

import { useReceiptSessionStore } from '@/features/receipt/model/receipt-session.store';
import { useAppStore } from '@/shared/lib/stores/app-store';
import { DEFAULT_LANGUAGE } from '@/shared/config/languages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FRAME_SIZE = 300;
const FRAME_RADIUS = 32;
const FRAME_Y = (SCREEN_HEIGHT - FRAME_SIZE) / 2 - 80;
const FRAME_X = (SCREEN_WIDTH - FRAME_SIZE) / 2;

const getDefaultSessionName = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `Chek ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

export default function ScanReceiptScreen() {
  const [perm, requestPerm] = useCameraPermissions();
  const isFocused = useIsFocused();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const parsing = useReceiptSessionStore((s) => s.parsing);
  const parseReceipt = useReceiptSessionStore((s) => s.parseReceipt);
  const parseError = useReceiptSessionStore((s) => s.parseError);
  const setSessionNameStore = useReceiptSessionStore((s) => s.setSessionName);
  
  const language = useAppStore((s) => s.language) || DEFAULT_LANGUAGE;

  const [currentQr, setCurrentQr] = useState<string | null>(null);
  const [scanned, setScanned] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  const scanLineY = useSharedValue(0);

  useEffect(() => {
    if (isFocused && !perm?.granted) requestPerm();
  }, [isFocused, perm?.granted, requestPerm]);

  useEffect(() => {
    if (isFocused && !scanned && !parsing) {
      scanLineY.value = 0;
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(FRAME_SIZE - 2, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [isFocused, scanned, parsing]);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setLocalError(null);
      setCurrentQr(null);
    }, [])
  );

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || parsing) return;
    setCurrentQr(data);
  };

  const handleParse = async (params: { qrData?: string; image?: { mimeType: string; data: string } }) => {
    if (scanned || parsing) return;
    setScanned(true);
    setLocalError(null);
    
    try {
      const sessionName = getDefaultSessionName();
      setSessionNameStore(sessionName);

      await parseReceipt({
        sessionName,
        language,
        ...params
      });

      router.push('/tabs/sessions/participants');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Chekni o\'qishda xatolik yuz berdi';
      setLocalError(message);
      setTimeout(() => setScanned(false), 3000);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const asset = result.assets[0];
      handleParse({
        image: {
          mimeType: asset.mimeType || 'image/jpeg',
          data: asset.base64,
        }
      });
    }
  };

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: (scanned || parsing) ? 0 : 1
  }));

  const errorMessage = localError || parseError;

  return (
    <View style={S.root}>
      {isFocused && perm?.granted ? (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flash}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          />
        </View>
      ) : (
        <YStack f={1} ai="center" jc="center" bg="#000">
          <Spinner color="white" />
        </YStack>
      )}

      {/* SVG Mask Overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg height="100%" width="100%">
          <Defs>
            <Mask id="mask">
              <Rect height="100%" width="100%" fill="#fff" />
              <Rect 
                x={FRAME_X} 
                y={FRAME_Y} 
                width={FRAME_SIZE} 
                height={FRAME_SIZE} 
                rx={FRAME_RADIUS} 
                fill="#000" 
              />
            </Mask>
          </Defs>
          <Rect height="100%" width="100%" fill="rgba(0,0,0,0.5)" mask="url(#mask)" />
        </Svg>
      </View>

      {/* Frame Brackets */}
      <View style={[S.frameContainer, { top: FRAME_Y, left: FRAME_X }]} pointerEvents="none">
        <View style={[S.corner, S.topLeft]} />
        <View style={[S.corner, S.topRight]} />
        <View style={[S.corner, S.bottomLeft]} />
        <View style={[S.corner, S.bottomRight]} />
        <Animated.View style={[S.scanLine, scanLineStyle]} />

        {currentQr && !scanned && !parsing && (
          <View style={[StyleSheet.absoluteFill, { borderRadius: FRAME_RADIUS, borderWidth: 3, borderColor: '#007AFF', opacity: 0.5 }]} />
        )}

        {(scanned || parsing) && (
          <View style={S.loaderOverlay}>
            <Spinner size="large" color="#007AFF" />
          </View>
        )}
      </View>

      {/* Header */}
      <View style={[S.headerAbs, { paddingTop: insets.top + 10 }]}>
        <XStack ai="center" jc="space-between" px="$4">
          <Pressable onPress={() => router.back()} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
            <BlurView intensity={40} tint="dark" style={S.glassButton}>
              <ChevronLeft size={28} color="white" />
            </BlurView>
          </Pressable>
          <Text col="white" fow="800" fos={18} style={S.textShadow}>Skanerlash</Text>
          <Pressable onPress={() => setFlash(!flash)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
            <BlurView intensity={40} tint="dark" style={S.glassButton}>
              {flash ? <Zap size={22} color="#FFD60A" /> : <ZapOff size={22} color="white" />}
            </BlurView>
          </Pressable>
        </XStack>
      </View>

      {/* Bottom Controls */}
      <View style={[S.bottomAbs, { paddingBottom: insets.bottom + 40 }]}>
        <YStack ai="center" gap="$5">
          {errorMessage && (
            <BlurView intensity={80} tint="dark" style={S.errorToast}>
              <XStack ai="center" gap="$3">
                <AlertTriangle size={20} color="#FF3B30" />
                <Text col="white" fow="600" fos={14} flexShrink={1}>{errorMessage}</Text>
              </XStack>
            </BlurView>
          )}

          <XStack ai="center" gap="$6" px="$5">
            <YStack ai="center" gap="$2">
              <Pressable onPress={pickImage} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
                <BlurView intensity={60} tint="dark" style={S.roundButton}>
                  <ImageIcon size={26} color="white" />
                </BlurView>
              </Pressable>
              <Text col="white" fos={11} fow="700" opacity={0.8}>Galereya</Text>
            </YStack>

            <YStack ai="center" gap="$3">
              <Pressable 
                onPress={() => currentQr && handleParse({ qrData: currentQr })}
                disabled={!currentQr || scanned || parsing}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: (currentQr && !scanned && !parsing && pressed) ? 0.95 : 1 }]
                })}
              >
                <Circle 
                  size={84} 
                  bg={currentQr ? "#007AFF" : "rgba(255,255,255,0.15)"} 
                  borderWidth={5} 
                  borderColor={currentQr ? "rgba(0,122,255,0.4)" : "rgba(255,255,255,0.2)"}
                  ai="center" 
                  jc="center"
                  shadowColor="#000"
                  shadowOpacity={0.3}
                  shadowRadius={20}
                  elevation={15}
                >
                  <CameraIcon size={34} color="white" />
                </Circle>
              </Pressable>
              <Text col="white" fos={14} fow="900" style={S.textShadow}>
                {currentQr ? 'Tayyor' : 'QR kutilyapti...'}
              </Text>
            </YStack>

            <YStack ai="center" gap="$2">
              <Pressable onPress={() => router.push('/tabs/sessions/create')} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
                <BlurView intensity={60} tint="dark" style={S.roundButton}>
                   <QrCode size={26} color="white" />
                </BlurView>
              </Pressable>
              <Text col="white" fos={11} fow="700" opacity={0.8}>Qo'lda</Text>
            </YStack>
          </XStack>
        </YStack>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  headerAbs: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  bottomAbs: { position: 'absolute', bottom: 120, left: 0, right: 0, zIndex: 10 },
  frameContainer: { position: 'absolute', width: FRAME_SIZE, height: FRAME_SIZE, zIndex: 5 },
  corner: { position: 'absolute', width: 45, height: 45, borderColor: '#007AFF' },
  topLeft: { top: -2, left: -2, borderTopWidth: 6, borderLeftWidth: 6, borderTopLeftRadius: FRAME_RADIUS },
  topRight: { top: -2, right: -2, borderTopWidth: 6, borderRightWidth: 6, borderTopRightRadius: FRAME_RADIUS },
  bottomLeft: { bottom: -2, left: -2, borderBottomWidth: 6, borderLeftWidth: 6, borderBottomLeftRadius: FRAME_RADIUS },
  bottomRight: { bottom: -2, right: -2, borderBottomWidth: 6, borderRightWidth: 6, borderBottomRightRadius: FRAME_RADIUS },
  scanLine: { position: 'absolute', top: 0, left: 10, right: 10, height: 3, backgroundColor: '#007AFF', shadowColor: '#007AFF', shadowOpacity: 0.8, shadowRadius: 10, elevation: 15 },
  glassButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  roundButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  textShadow: { textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  qrDetectedOverlay: { ...StyleSheet.absoluteFillObject, ai: 'center', jc: 'center' },
  qrIndicator: { padding: 20, borderRadius: 40, overflow: 'hidden' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject, ai: 'center', jc: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: FRAME_RADIUS },
  errorToast: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, maxWidth: '90%', overflow: 'hidden' },
});
