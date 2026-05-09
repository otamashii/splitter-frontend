// tamagui.config.ts
import { createTamagui } from '@tamagui/core'
import { config } from '@tamagui/config/v3'

// Простая и рабочая конфигурация
const appConfig = createTamagui({
  ...config,
  // Переопределяем только цвета
  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      primary: '#007AFF',
      primaryHover: '#0062CC',
      success: '#34C759',
      error: '#FF3B30',
      warning: '#FF9500',
    },
    dark: {
      ...config.themes.dark,
      primary: '#007AFF',
      primaryHover: '#0A84FF',
      success: '#32D74B',
      error: '#FF453A',
      warning: '#FF9F0A',
    }
  }
})

export default appConfig

export type Conf = typeof appConfig

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends Conf { }
}