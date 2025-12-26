# Housing Manager - GitHub Setup Guide

Это руководство поможет вам загрузить приложение на GitHub и настроить автоматическую сборку APK.

## Предварительные требования

- GitHub аккаунт
- Git установлен на вашем компьютере
- Expo аккаунт (для сборки APK через EAS)

## Шаг 1: Создание репозитория на GitHub

1. Перейдите на [github.com](https://github.com) и войдите в свой аккаунт
2. Нажмите на кнопку **"+"** в верхнем правом углу и выберите **"New repository"**
3. Назовите репозиторий: `housing-management-app`
4. Выберите **"Private"** или **"Public"** (рекомендуется Private для приватных данных)
5. Нажмите **"Create repository"**

## Шаг 2: Загрузка кода на GitHub

```bash
# Перейдите в директорию проекта
cd /path/to/housing-management-app

# Добавьте удаленный репозиторий
git remote add origin https://github.com/YOUR_USERNAME/housing-management-app.git

# Переименуйте ветку на main (если нужно)
git branch -M main

# Загрузите код
git push -u origin main
```

Замените `YOUR_USERNAME` на ваше имя пользователя GitHub.

## Шаг 3: Настройка Expo EAS для автоматической сборки

### 3.1 Установка EAS CLI

```bash
npm install -g eas-cli
```

### 3.2 Инициализация EAS проекта

```bash
cd housing-management-app
eas init
```

Следуйте инструкциям и выберите существующий проект Expo или создайте новый.

### 3.3 Конфигурация eas.json

Файл `eas.json` должен содержать конфигурацию для сборки:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "distribution": "store"
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccount": "keystore.json"
      }
    }
  }
}
```

## Шаг 4: Настройка GitHub Actions

GitHub Actions уже настроен в `.github/workflows/build-apk.yml`. Он автоматически будет:

1. Собирать приложение при каждом push на main или develop
2. Загружать APK в Artifacts
3. Создавать Release при добавлении тега

### Для ручной сборки через GitHub Actions:

1. Перейдите на вкладку **"Actions"** в вашем репозитории
2. Выберите **"Build APK"**
3. Нажмите **"Run workflow"**

## Шаг 5: Загрузка APK

### Вариант 1: Скачивание из Artifacts

1. Перейдите на вкладку **"Actions"**
2. Выберите последний успешный workflow
3. Нажмите на **"housing-manager-apk"** в разделе Artifacts
4. Скачайте APK файл

### Вариант 2: Скачивание из Release

1. Создайте тег для версии:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions автоматически создаст Release с APK

## Шаг 6: Установка APK на Android устройство

```bash
# Подключите Android устройство через USB
adb install -r housing-manager-app.apk
```

Или просто откройте APK файл на устройстве и нажмите "Установить".

## Решение проблем

### Ошибка: "EAS credentials not found"

Решение:
```bash
eas login
eas credentials
```

### Ошибка: "Build failed"

1. Проверьте логи в GitHub Actions
2. Убедитесь, что все зависимости установлены: `pnpm install`
3. Проверьте версию Node.js: должна быть 18+

### Ошибка: "Java not found"

GitHub Actions автоматически устанавливает Java, но если возникает ошибка, проверьте версию в workflow файле.

## Дополнительные команды

```bash
# Локальная сборка APK (требует Android SDK)
eas build --platform android --local

# Просмотр статуса сборки
eas build:list

# Отправка на Google Play Store
eas submit --platform android --latest
```

## Структура проекта

```
housing-management-app/
├── app/                      # Экраны приложения
├── components/               # React компоненты
├── hooks/                    # Custom React хуки
├── lib/                      # Утилиты и хранилище
├── locales/                  # Переводы (польский)
├── types/                    # TypeScript типы
├── assets/images/            # Логотипы и иконки
├── app.config.ts            # Конфигурация Expo
├── eas.json                 # Конфигурация EAS
├── tailwind.config.js       # Tailwind CSS конфигурация
└── .github/workflows/       # GitHub Actions workflows
```

## Полезные ссылки

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [React Native Documentation](https://reactnative.dev)

## Поддержка

Если у вас возникли проблемы, проверьте:
1. Логи GitHub Actions
2. Консоль Expo
3. Документацию EAS Build

---

**Автор:** Housing Manager Development Team  
**Версия:** 1.0.0  
**Последнее обновление:** 2024-12-26
