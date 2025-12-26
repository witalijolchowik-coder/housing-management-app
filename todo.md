# Project TODO

## Core Setup
- [x] Configure dark theme Material 3 colors
- [x] Setup Bottom Navigation with 4 tabs
- [x] Create base UI components (Card, Badge, ProgressBar, FAB)
- [x] Setup local storage with AsyncStorage
- [x] Create data models and types

## Dashboard Screen
- [x] Top App Bar with title and avatar
- [x] Search bar component
- [x] Project cards grid (2 columns)
- [x] Occupancy percentage and progress bar
- [x] Status badges (evictions, conflicts, overdue)
- [x] FAB for new check-in

## Address List Screen
- [x] Address cards with photo preview
- [x] Statistics display (total/free/occupied)
- [x] Couple rooms chip indicator
- [x] Wypowiedzenie and conflict badges
- [x] Add Address button/FAB

## Address Details Screen
- [x] Tab navigation (Residents/Rooms)
- [x] Residents list with avatars
- [x] Resident details (name, date, room, price, status)
- [x] Rooms list with cards
- [x] Room type chips (male/female/couple)
- [x] Space statistics per room
- [x] Progress bars for wypowiedzenie

## Room Details Screen
- [x] Room header with number and type
- [x] Individual space cards/rows
- [x] Vacant space display (green)
- [x] Occupied space display (blue)
- [x] Wypowiedzenie space display (yellow + progress)
- [x] Conflict space display (red + blinking)
- [x] Action buttons per space

## Add Tenant Form
- [x] Name fields (first, last)
- [x] Gender selection chips
- [x] Birth year picker
- [x] Check-in date picker
- [x] Work start date picker (optional)
- [ ] Room/space selector
- [x] Price field
- [x] Submit button

## Add Address Form
- [x] Name field
- [x] Full address field
- [ ] Total spaces field
- [x] Couple rooms count
- [x] Company name field
- [x] Owner name field
- [x] Phone field
- [ ] Eviction period field (default 14)
- [ ] Cost fields
- [ ] Photo upload
- [x] Submit button

## Checkout Bottom Sheet
- [ ] Step indicator
- [ ] Checkout date picker
- [ ] Wypowiedzenie toggle
- [ ] Conditional: start date picker
- [ ] Auto-calculation display
- [ ] Progress indicator
- [ ] Warning messages
- [ ] Cancel/Confirm buttons

## Calendar Screen
- [ ] Calendar view component
- [ ] Event markers (green/orange/red)
- [ ] Event list below calendar
- [ ] Event badges per day

## Search Screen
- [ ] Global search input
- [ ] Search by name, room, project
- [ ] Result cards display
- [ ] Navigation to details

## Reports Screen
- [ ] Occupancy statistics
- [ ] Basic metrics display

## Photo Gallery
- [ ] Grid layout (2-3 columns)
- [ ] Photo thumbnails
- [ ] Add photo button
- [ ] Full-screen viewer
- [ ] Swipe navigation

## Business Logic
- [ ] Auto-release spaces after wypowiedzenie ends
- [ ] Conflict detection (occupied after wypowiedzenie)
- [ ] Overdue tracking
- [ ] Status calculations

## Branding
- [x] Generate app logo
- [x] Configure app name and icons
- [x] Splash screen setup


## Language & Localization
- [x] Setup i18n with Polish language (pl-PL)
- [x] Translate all UI strings to Polish
- [x] Create translations file for all screens
