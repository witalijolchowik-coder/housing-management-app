# Housing Management App - Design Document

## Overview

Мобильное приложение для управления заселением и выселением работников по проектам. Предназначено для менеджеров/администраторов, которые управляют общежитиями и квартирами.

## Design System

### Theme
- **Режим:** Исключительно тёмная тема Material Design 3
- **Углы:** Extra Large rounded corners (16-24px) на карточках и Bottom Sheets
- **Elevation:** 1-3 dp на карточках
- **Иконки:** Material Symbols

### Color Palette (Dark Theme)
| Token | Color | Usage |
|-------|-------|-------|
| background | #121212 | Основной фон экранов |
| surface | #1E1E2E | Карточки, elevated surfaces |
| surfaceVariant | #2A2A3A | Вторичные поверхности |
| primary | #6C8EEF | Акцентные элементы, toggles, активные состояния |
| onPrimary | #FFFFFF | Текст на primary |
| foreground | #E8E8E8 | Основной текст |
| muted | #9BA1A6 | Вторичный текст |
| border | #334155 | Границы, разделители |

### Status Colors
| Status | Color | Usage |
|--------|-------|-------|
| success/free | #4ADE80 | Свободные места |
| occupied | #6C8EEF | Занятые места |
| warning/wypowiedzenie | #FBBF24 | Период уведомления |
| error/conflict | #F87171 | Просрочки, конфликты |

---

## Screen List

### 1. Dashboard (Главный экран)
- **Layout:** Top App Bar + Grid карточек проектов (2 колонки) + FAB
- **Content:**
  - Поле поиска (Search bar)
  - Карточки проектов с: название, % заполняемости, прогресс-бар, статус-бейджи
  - FAB "+" для нового заезда
- **Navigation:** Bottom Tab Bar

### 2. Список адресов (Address List)
- **Layout:** Top App Bar с back button + список карточек + FAB
- **Content:**
  - Карточки адресов с: фото, название, статистика мест, бейджи
  - Кнопка "Add New Address"
- **Navigation:** Back to Dashboard

### 3. Детали адреса (Address Details)
- **Layout:** Top App Bar + Tab Bar (Жильцы/Комнаты)
- **Tabs:**
  - **Жильцы (Residents):** Список с аватарами, ФИО, датой заезда, комнатой, ценой, статусом
  - **Комнаты (Rooms):** Карточки с номером, типом, статистикой мест, прогресс-барами

### 4. Детали комнаты (Room Details)
- **Layout:** Top App Bar + список мест
- **Content:**
  - Заголовок: номер + тип комнаты
  - Список каждого места: статус (Vacant/Occupied/Wypowiedzenie/Conflict)
  - Прогресс-бары для wypowiedzenie
  - Кнопки действий

### 5. Форма добавления жильца (Add Tenant)
- **Layout:** Full-screen form
- **Fields:** Имя, Фамилия, Пол (chips), Год рождения, Дата заезда, Дата работы, Комната, Цена
- **Actions:** Кнопка "Заселить"

### 6. Форма добавления адреса (Add Address)
- **Layout:** Full-screen form
- **Fields:** Название, Адрес, Кол-во мест, Комнаты для пар, Фирма, Хозяин, Телефон, Срок выселения, Цена, Фото
- **Actions:** Кнопка "Добавить"

### 7. Bottom Sheet выселения (Checkout Sheet)
- **Layout:** Modal bottom sheet
- **Content:**
  - Stepper индикатор (шаги)
  - Дата выезда (Date Picker)
  - Toggle "Wypowiedzenie miejsca"
  - Условный блок: дата начала, расчёт, прогресс-бар
  - Кнопки: Отмена / Подтвердить

### 8. Календарь (Calendar)
- **Layout:** Calendar view + список событий
- **Events:** Заезды (зелёный), начало wypowiedzenie (оранжевый), окончание (красный)

### 9. Поиск (Search)
- **Layout:** Search bar + результаты
- **Content:** Глобальный поиск по ФИО, комнате, проекту

### 10. Отчёты (Reports)
- **Layout:** Статистика и метрики
- **Content:** Заполняемость, доход (минимальная версия)

### 11. Фотогалерея адреса (Photo Gallery)
- **Layout:** Grid 2-3 колонки
- **Content:** Фото комнат, интерьера
- **Actions:** Добавление, полноэкранный просмотр

---

## Key User Flows

### Flow 1: Просмотр проекта
1. Dashboard → Tap на карточку проекта
2. Address List → Tap на карточку адреса
3. Address Details (Residents/Rooms tabs)

### Flow 2: Заселение нового жильца
1. Dashboard → FAB "+" → Add Tenant form
2. Заполнение формы → Выбор комнаты
3. Tap "Заселить" → Возврат к списку

### Flow 3: Выселение жильца
1. Address Details → Residents tab → Tap на жильца
2. Bottom Sheet с действиями → "Выселить"
3. Checkout Sheet → Настройка wypowiedzenie
4. Подтверждение → Обновление статуса

### Flow 4: Добавление адреса
1. Address List → FAB "+" или кнопка "Add New Address"
2. Add Address form → Заполнение
3. Tap "Добавить" → Возврат к списку

---

## Bottom Navigation Structure

| Tab | Icon | Screen |
|-----|------|--------|
| Проекты | home | Dashboard |
| Календарь | calendar | Calendar |
| Поиск | search | Search |
| Отчёты | chart | Reports |

---

## Component Specifications

### Project Card (Dashboard)
- Rounded corners: 16px
- Background: surface
- Content: название (bold), % (large), прогресс-бар, статус chip
- Elevation: 2dp

### Address Card
- Rounded corners: 16px
- Background: surface
- Content: фото (круглое), название, статистика, бейджи
- Elevation: 2dp

### Resident List Item
- Avatar (круглый, 48px)
- ФИО (bold)
- Подзаголовок: дата заезда, комната
- Trailing: цена или статус badge

### Room Card
- Номер комнаты (bold)
- Тип (chip: ♂/♀/♡)
- Статистика мест
- Progress bars для wypowiedzenie

### Status Badges
- Свободно: зелёный фон, белый текст
- Занято: синий фон
- Wypowiedzenie: жёлтый/оранжевый фон
- Просрочено/Конфликт: красный фон + мигание

### FAB
- Position: bottom-center
- Icon: "+"
- Background: primary
- Size: 56px

---

## Data Model (Local Storage)

### Project
```typescript
{
  id: string;
  name: string;
  addresses: Address[];
}
```

### Address
```typescript
{
  id: string;
  projectId: string;
  name: string;
  fullAddress: string;
  totalSpaces: number;
  coupleRooms: number;
  companyName: string;
  ownerName: string;
  phone: string;
  evictionPeriod: number; // days, default 14
  totalCost: number;
  pricePerSpace: number;
  photos: string[];
  rooms: Room[];
}
```

### Room
```typescript
{
  id: string;
  addressId: string;
  number: string;
  type: 'male' | 'female' | 'couple';
  spaces: Space[];
}
```

### Space
```typescript
{
  id: string;
  roomId: string;
  status: 'vacant' | 'occupied' | 'wypowiedzenie' | 'conflict';
  tenant?: Tenant;
  wypowiedzenie?: {
    startDate: Date;
    endDate: Date;
    paidUntil: Date;
  };
}
```

### Tenant
```typescript
{
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  birthYear: number;
  checkInDate: Date;
  workStartDate?: Date;
  spaceId: string;
  monthlyPrice: number;
  photo?: string;
}
```
