# Housing Management App - Build Instructions

## 📱 Building APK for Android

### Prerequisites
1. Install Node.js (v18 or higher)
2. Install Expo CLI globally:
   ```bash
   npm install -g expo-cli eas-cli
   ```

### Method 1: Build APK using EAS Build (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/witalijolchowik-coder/housing-management-app.git
   cd housing-management-app
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Login to Expo:**
   ```bash
   eas login
   ```

4. **Configure EAS Build:**
   ```bash
   eas build:configure
   ```

5. **Build APK for preview:**
   ```bash
   eas build --platform android --profile preview
   ```

6. **Download APK:**
   After the build completes, EAS will provide a download link for the APK file.

### Method 2: Build APK locally (requires Android Studio)

1. **Clone and install dependencies:**
   ```bash
   git clone https://github.com/witalijolchowik-coder/housing-management-app.git
   cd housing-management-app
   pnpm install
   ```

2. **Generate Android project:**
   ```bash
   npx expo prebuild --platform android
   ```

3. **Build APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

4. **Find APK:**
   The APK will be located at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

### Testing the App

#### Option 1: Expo Go (Development)
1. Install Expo Go from Google Play Store
2. Run development server:
   ```bash
   pnpm dev
   ```
3. Scan QR code with Expo Go app

#### Option 2: Install APK (Production)
1. Enable "Install from Unknown Sources" on your Android device
2. Transfer APK to your device
3. Install and run

## 🔧 Configuration

### App Configuration
Edit `app.config.ts` to customize:
- App name
- Bundle ID
- App icon
- Splash screen

### Build Profiles
Edit `eas.json` to configure build profiles:
- `development`: Debug build with development client
- `preview`: APK for internal testing
- `production`: Production APK

## 📦 What's Included

- ✅ Expo SDK 54
- ✅ React Native 0.81
- ✅ TypeScript 5.9
- ✅ NativeWind 4 (Tailwind CSS)
- ✅ Expo Router 6
- ✅ Data export/import functionality
- ✅ Operator tags in project cards
- ✅ Calendar with event tracking
- ✅ Tenant management
- ✅ Room and space management
- ✅ Eviction workflow
- ✅ Conflict detection

## 🚀 Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run tests
pnpm test

# Build APK with EAS
eas build --platform android --profile preview

# Check TypeScript
pnpm check

# Lint code
pnpm lint
```

## 📝 Notes

- The app uses AsyncStorage for local data persistence
- No backend required for basic functionality
- Export/import feature allows data backup and restore
- All 148 tests passing

## 🔗 Repository

https://github.com/witalijolchowik-coder/housing-management-app.git

## 📧 Support

For issues or questions, create an issue on GitHub.
