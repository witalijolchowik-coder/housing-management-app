# 🏠 Housing Manager - Aplikacja do Zarządzania Zamieszkanymi Nieruchomościami

[![Build APK](https://github.com/YOUR_USERNAME/housing-management-app/actions/workflows/build-apk.yml/badge.svg)](https://github.com/YOUR_USERNAME/housing-management-app/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-54-black.svg)](https://expo.dev)

Nowoczesna aplikacja mobilna do zarządzania zamieszkanymi nieruchomościami, śledzenia zaselenia i wyselenia pracowników, oraz monitorowania statusu pokojów i mieszkańców.

## ✨ Główne Funkcje

### 📊 Dashboard
- Przegląd wszystkich projektów z procentem obłożenia
- Śledzenie wypowiedzeń i konfliktów
- Szybki dostęp do statystyk

### 🏢 Zarządzanie Adresami
- Lista wszystkich adresów w projekcie
- Informacje o mieszkańcach i pokojach
- Dodawanie nowych adresów

### 🛏️ Zarządzanie Pokojami
- Przegląd pokojów według typów (męskie, żeńskie, dla par)
- Śledzenie zajętych i wolnych miejsc
- Zarządzanie mieszkańcami

### 👥 Zarządzanie Mieszkańcami
- Dodawanie nowych mieszkańców
- Śledzenie statusu zaselenia
- Zarządzanie wyseleniem (wypowiedzenie)

### 📅 Kalendarz
- Przegląd zdarzeń zaselenia i wyselenia
- Śledzenie ważnych dat

### 🔍 Wyszukiwanie
- Globalne wyszukiwanie po mieszkańcach, adresach, pokojach
- Szybki dostęp do informacji

### 📈 Raporty
- Statystyka po projektach
- Metryki obłożenia

## 🎨 Projekt

Aplikacja wykorzystuje **Material Design 3** z ciemnym motywem i gradientem niebiesko-fioletowym.

### Paleta Kolorów
| Kolor | Hex | Zastosowanie |
|-------|-----|--------------|
| Primary | #1F6FEB | Przyciski, ikony |
| Secondary | #7C3AED | Akcenty |
| Background | #151718 | Tło |
| Surface | #1E2022 | Karty, powierzchnie |
| Success | #22C55E | Status pozytywny |
| Warning | #F59E0B | Ostrzeżenia |
| Error | #EF4444 | Błędy |

## 🌍 Języki

- 🇵🇱 **Polski** (pl-PL) - Domyślny

## 📱 Wymagania Systemowe

- **Android**: 8.0+ (API 26+)
- **iOS**: 13.0+
- **Node.js**: 18.0+
- **pnpm**: 9.0+

## 🚀 Szybki Start

### Instalacja

```bash
# Klonuj repozytorium
git clone https://github.com/YOUR_USERNAME/housing-management-app.git
cd housing-management-app

# Zainstaluj zależności
pnpm install
```

### Uruchamianie

```bash
# Uruchom w trybie rozwoju
pnpm dev

# Android
pnpm android

# iOS
pnpm ios

# Web
pnpm dev:web
```

### Skanowanie QR Kodu

Po uruchomieniu `pnpm dev`, zeskanuj kod QR w aplikacji **Expo Go** na swoim urządzeniu mobilnym.

## 📦 Technologia

| Technologia | Wersja | Opis |
|-------------|--------|------|
| React Native | 0.81 | Framework mobilny |
| Expo | 54 | Platforma Expo |
| Expo Router | 6 | Routing |
| TypeScript | 5.9 | Język programowania |
| NativeWind | 4 | Tailwind CSS dla React Native |
| Reanimated | 4 | Animacje |
| TanStack Query | 5 | Zarządzanie stanem |
| AsyncStorage | 2 | Lokalne przechowywanie |

## 📁 Struktura Projektu

```
housing-management-app/
├── app/                      # Ekrany aplikacji
│   ├── (tabs)/              # Główne karty
│   ├── _layout.tsx          # Główny layout
│   ├── address-list.tsx     # Lista adresów
│   ├── address-details.tsx  # Szczegóły adresu
│   ├── room-details.tsx     # Szczegóły pokoju
│   ├── add-tenant.tsx       # Dodawanie mieszkańca
│   └── add-address.tsx      # Dodawanie adresu
├── components/              # Komponenty React
│   ├── ui/                 # Komponenty UI
│   └── screen-container.tsx # Kontener ekranu
├── hooks/                  # Niestandardowe hooki
│   ├── use-translations.ts # Lokalizacja
│   ├── use-colors.ts      # Kolory motywu
│   └── use-color-scheme.ts # Przełączanie motywu
├── lib/                    # Narzędzia
│   ├── store.ts           # AsyncStorage
│   ├── navigation-context.ts # Kontekst nawigacji
│   └── utils.ts           # Funkcje pomocnicze
├── locales/               # Tłumaczenia
│   └── pl.ts             # Polski
├── types/                 # Typy TypeScript
│   └── index.ts          # Wszystkie typy
├── assets/images/         # Logotypy i ikony
├── app.config.ts         # Konfiguracja Expo
├── eas.json              # Konfiguracja EAS
└── tailwind.config.js    # Konfiguracja Tailwind
```

## 🔧 Rozwój

### Dodawanie Nowego Ekranu

```tsx
import { ScreenContainer } from '@/components/screen-container';
import { useTranslations } from '@/hooks/use-translations';

export default function MyScreen() {
  const t = useTranslations();
  
  return (
    <ScreenContainer className="p-4">
      <Text className="text-foreground">{t.common.welcome}</Text>
    </ScreenContainer>
  );
}
```

### Dodawanie Komponenty

```tsx
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="bg-surface rounded-lg p-4">
      <Text className="text-foreground font-semibold">Mój Komponent</Text>
    </View>
  );
}
```

### Dodawanie Tłumaczenia

Edytuj `locales/pl.ts`:

```typescript
export const pl = {
  myFeature: {
    title: 'Moja Funkcja',
    description: 'Opis funkcji',
  },
};
```

## 📦 Budowanie APK

### Przez EAS (Rekomendowane)

```bash
# Zainstaluj EAS CLI
npm install -g eas-cli

# Zainicjuj EAS
eas init

# Buduj APK
eas build --platform android
```

### Lokalnie

```bash
eas build --platform android --local
```

## 🚀 Wdrażanie na GitHub

Szczegółowe instrukcje znajdują się w [GITHUB_SETUP.md](./GITHUB_SETUP.md).

### Kroki:

1. Utwórz repozytorium na GitHub
2. Dodaj zdalne repozytorium: `git remote add origin https://github.com/YOUR_USERNAME/housing-management-app.git`
3. Wypchnij kod: `git push -u origin main`
4. Skonfiguruj EAS Build
5. GitHub Actions automatycznie buduje APK

## 🧪 Testowanie

```bash
# Uruchom testy
pnpm test

# Sprawdź typy TypeScript
pnpm check

# Lint kodu
pnpm lint

# Formatuj kod
pnpm format
```

## 🐛 Rozwiązywanie Problemów

### Aplikacja się nie uruchamia

```bash
# Wyczyść cache
rm -rf node_modules
rm pnpm-lock.yaml

# Zainstaluj ponownie
pnpm install
```

### Błąd TypeScript

```bash
pnpm check
```

### Problemy z Expo

```bash
pnpm add expo@latest
```

## 📚 Dokumentacja

- [QUICK_START.md](./QUICK_START.md) - Szybki start
- [GITHUB_SETUP.md](./GITHUB_SETUP.md) - Konfiguracja GitHub
- [Dokumentacja Expo](https://docs.expo.dev)
- [Dokumentacja React Native](https://reactnative.dev)
- [Material Design 3](https://m3.material.io)

## 📄 Licencja

MIT License - zobacz plik [LICENSE](./LICENSE)

## 👥 Wkład

Wkład jest mile widziany! Proszę:

1. Utwórz fork repozytorium
2. Utwórz gałąź funkcji (`git checkout -b feature/AmazingFeature`)
3. Zatwierdź zmiany (`git commit -m 'Add some AmazingFeature'`)
4. Wypchnij do gałęzi (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

## 📞 Wsparcie

Jeśli masz pytania lub sugestie, proszę utwórz Issue w repozytorium GitHub.

## 🙏 Podziękowania

- [Expo](https://expo.dev) - Platforma
- [React Native](https://reactnative.dev) - Framework
- [NativeWind](https://www.nativewind.dev) - Tailwind CSS
- [Material Design](https://material.io) - Design System

---

**Wersja:** 1.0.0  
**Ostatnia aktualizacja:** 2024-12-26  
**Język:** Polski (pl-PL)  
**Autor:** Housing Manager Development Team

Zbudowano z ❤️ dla zarządzania nieruchomościami
