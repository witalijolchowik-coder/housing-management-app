# Housing Management App - TODO

## ✅ Phase 1: Core Setup
- [x] Configure dark theme Material 3 colors
- [x] Setup Bottom Navigation with 4 tabs (Projekty, Kalendarz, Szukaj, Raporty)
- [x] Create base UI components (Card, Badge, ProgressBar, FAB, Chip)
- [x] Setup local storage with AsyncStorage
- [x] Create data models and types
- [x] Setup i18n with Polish language (pl-PL)

## ✅ Phase 2: Dashboard (Projekty)
- [x] Project list display with occupancy percentage
- [x] Menu (3 dots) for project operations
- [x] FAB button for adding new projects
- [x] Project form modal (add/edit)
- [x] Delete project functionality
- [x] Wypowiedzenie badge on projects
- [x] Progress bar for occupancy

## ✅ Phase 3: Addresses (Adresy)
- [x] Address list display
- [x] Add address form with default 14-day wypowiedzenie
- [x] Edit address functionality
- [x] Delete address functionality
- [x] Menu (3 dots) for address operations
- [x] Put address on wypowiedzenie (all spaces)
- [x] Remove address from wypowiedzenie
- [x] Address details screen with rooms list
- [x] Full address display

## ✅ Phase 4: Tenants (Mieszkańcy)
- [x] Tenant list display per address
- [x] Add tenant form (name, gender, birth year, price)
- [x] Edit tenant functionality
- [x] Delete tenant functionality
- [x] Eviction form with date and reason selection
- [x] Eviction archive with reasons (job change, own housing, disciplinary)
- [x] Archive display in Reports
- [x] Tenant history tracking

## ✅ Phase 5: Rooms (Pokoje)
- [x] Room list display
- [x] Add room form
- [x] Edit room functionality
- [x] Delete room functionality
- [x] Spaces management within rooms
- [x] Add space to room
- [x] Delete space (only if vacant)
- [x] Put space on wypowiedzenie
- [x] Remove space from wypowiedzenie
- [x] Assign tenant to space
- [x] Remove tenant from space

## ✅ Phase 6: Calendar (Kalendarz)
- [x] Monthly calendar view
- [x] Event visualization (colored dots for check-in/check-out/wypowiedzenie)
- [x] Project filtering (multiple select)
- [x] Day details modal showing all events
- [x] Event type badges (check-in, check-out, wypowiedzenie end)
- [x] Navigation between months
- [x] Legend for event types

## ✅ Phase 7: Search (Szukaj)
- [x] Search by first name, last name, or both
- [x] Search button (not real-time)
- [x] Tenant dossier display
- [x] Basic info (gender, birth year)
- [x] Current residence info
- [x] Residence history (sorted newest first)
- [x] Clear search results button

## ✅ Phase 8: Reports (Raporty)
- [x] Overall occupancy percentage
- [x] Key metrics (total spaces, occupied, vacant, wypowiedzenie, conflicts)
- [x] Evictions tab with progress bars
- [x] Conflicts tab (no room, expired wypowiedzenie)
- [x] Archive tab with clear button
- [x] Project list with occupancy % and Excel export
- [x] CSV export functionality
- [x] Conflict detection logic

## ✅ Phase 9: Testing & GitHub Push
- [x] Push to GitHub repository
- [x] All screens functional and connected
- [x] Data persistence working
- [x] Navigation between screens working

## 🐛 Known Issues / Testing Needed

- [ ] Test all CRUD operations (Create, Read, Update, Delete)
- [ ] Test wypowiedzenie logic (start, end, cancel)
- [ ] Test conflict detection accuracy
- [ ] Test Excel export with special characters
- [ ] Test calendar with many events
- [ ] Test search with duplicate names
- [ ] Verify all date formats are correct (YYYY-MM-DD)
- [ ] Test eviction archive persistence
- [ ] Test project filtering on calendar
- [ ] Verify occupancy percentage calculations
- [ ] Test with large datasets (100+ tenants)
- [ ] Test form validation
- [ ] Test error handling

## 🎨 Phase 10: Design Improvements (Next Session)

- [ ] Add gradient backgrounds to cards
- [ ] Improve color scheme and contrast
- [ ] Add more visual hierarchy
- [ ] Enhance typography and spacing
- [ ] Add smooth animations/transitions
- [ ] Improve icon usage
- [ ] Better visual feedback on interactions
- [ ] Polish tab bar design
- [ ] Improve modal/form styling
- [ ] Add loading states with skeletons
- [ ] Restore previous beautiful design elements

## 📱 Mobile-Specific Testing

- [ ] Test on iOS (iPhone)
- [ ] Test on Android
- [ ] Test landscape orientation
- [ ] Test with notch/safe area
- [ ] Test keyboard interactions
- [ ] Test touch targets (min 44x44pt)
- [ ] Test performance with large datasets

## 🔧 Future Features (Post-MVP)

- [ ] Push notifications for wypowiedzenie deadlines
- [ ] Bulk operations (multi-select)
- [ ] Financial tracking (revenue, payments)
- [ ] Tenant documents/files upload
- [ ] Communication history/notes
- [ ] Automated reminders
- [ ] Data backup/restore
- [ ] Multi-language support (currently Polish only)
- [ ] Dark/Light theme toggle
- [ ] Offline mode
- [ ] Sync with cloud backend


## 🔴 BUGS TO FIX (Priority)

### Address Details Screen - Mieszkańcy Tab
- [ ] Add FAB (+) button to add new tenant
- [ ] Add menu (3 dots) on each tenant card for edit/delete/evict
- [ ] Fix room display - show room name (Pokój 1, Pokój 2) instead of room ID
- [ ] Verify room name is fetched correctly from rooms list


### Address Details Screen - Pokoje Tab
- [x] Add menu (3 dots) on each room card for edit/delete only
- [x] Add FAB (+) button inside room details to add new space
- [x] Add menu (3 dots) on each space for edit/delete/wypowiedzenie operations
- [x] Implement space wypowiedzenie toggle (put on/remove from wypowiedzenie)
- [x] Show space status with proper styling (vacant/occupied/wypowiedzenie)

### Room Details - Tenant Selection
- [x] Create select-tenant.tsx screen
- [x] Two sections: without room (top) + already assigned (bottom)
- [x] Show tenant name, current room if assigned
- [x] Auto-reassign when selecting tenant from another room
- [x] Fix add-tenant form: Gender only Male/Female
- [x] Add date pickers for check-in and work start dates
- [x] Create DatePicker component with calendar UI
- [x] Write and pass 22 unit tests for new features


### Auto-Room Creation Feature
- [x] Update add-address form to include room count field
- [x] Auto-generate empty rooms when creating address
- [x] Rooms appear as "Pokój 1", "Pokój 2", etc. in Pokoje tab
- [x] Allow deletion of auto-created rooms (with safety check)
- [x] Allow adding new rooms via FAB button
- [x] Write tests for room auto-generation (10 tests passing)


### Calendar Screen Improvements
- [x] Fix bottom row (28-31) sizing - should match other rows
- [x] Add third event type to legend (Wymeldowanie/Checkout)
- [x] Move project filters from top to bottom
- [x] Apply Material Design 3 styling to calendar
- [x] Fix random stretching of bottom dates on scroll
- [x] Improve overall calendar appearance and spacing


### Dashboard & Reports Restructuring
- [x] Create dashboard statistics component with cards
- [x] Move all statistics from Reports tab to Projects tab (top)
- [x] Simplify Reports tab to show only project reports with download buttons
- [x] Dashboard shows: Obłożenie, Razem miejsc, Zajęte, Wolne, Na wypowiedzeniu, Konflikty, Całkowity koszt
- [x] Reports tab shows: Project name, occupancy %, progress bar, stats, download button


### Material Design 3 Visual Redesign
- [x] Update theme colors (modern blue, deeper dark, better contrast)
- [x] Redesign Card component (elevated, filled, outlined variants)
- [x] Improve FAB component (better shadows, white icons)
- [x] Update Badge component (semi-transparent backgrounds, colored text)
- [x] Enhance ProgressBar (larger height for visibility)
- [x] Improve dashboard spacing and visual hierarchy
- [x] Enhance project cards (larger text, better dividers)
- [x] Improve address cards (larger photos, better padding)
- [x] All 42 tests passing, no functionality broken


### Dashboard Detail Screens (Clickable Cards)
- [x] Make dashboard cards clickable (Obłożenie, Razem, Zajęte, Wolne, Wyp., Konflikty)
- [x] Create evictions detail screen (Project → Address → Room → Tenant with dates/reasons)
- [x] Create conflicts detail screen (Project → Address → Room → Tenant with conflict details)
- [x] Create vacant spaces detail screen (by Project → Address with counts)
- [x] Create occupied spaces detail screen (by Project → Address with counts)
- [x] Add back navigation and visual hierarchy to detail screens
- [x] Test all drill-down flows end-to-end (13 tests passing, 55 total tests)


### Address Operator & Form Fixes
- [x] Replace heart counter with tenant count + person icon on address cards
- [x] Add operator field to Address type (Rent Planet, E-Port, Inny operator)
- [x] Update add-address form with operator selection (radio buttons)
- [x] Display operator tag on address cards under address name
- [x] Fix form padding - prevent overlap with status bar and bottom navigation (pt-12 pb-20)
- [x] Write and pass 20 tests for operator selection (75 total tests passing)


### Global Safe Area Padding Fix
- [x] Fix add-address.tsx form padding (pt-12 pb-20)
- [x] Fix add-tenant.tsx form padding (pt-12 pb-20)
- [x] Fix add-room.tsx form padding (pt-12 pb-20)
- [x] Fix address-form-modal.tsx padding (pt-12 pb-20)
- [x] Fix eviction-form-modal.tsx padding (pt-12 pb-20)
- [x] Fix project-form-modal.tsx padding (pt-12 pb-20)
- [x] Fix address-menu-modal.tsx padding (pt-12 pb-20)
- [x] Fix project-menu-modal.tsx padding (pt-12 pb-20)
- [ ] Test all forms on Android device


### Tenant Form Fixes
- [x] Fix TextInput keyboard disappearing after each character (added editable={true}, useCallback)
- [x] Replace birth year with year picker/scroll (100 years to choose from)
- [x] Fix work start date to allow future years (not limited to current year)
- [x] Fix tenant creation logic - add tenant without room assignment (status "Bez miejsca")
- [x] Tenant appears in list immediately after creation
- [ ] Test form on Android device


### Tenant Settlement Workflow Implementation
- [x] Add unassignedTenants array to Address type
- [x] Update add-tenant.tsx to add tenant to unassignedTenants (not to rooms)
- [x] Update address-details.tsx to display all tenants (unassigned + assigned)
- [x] Show "Bez miejsca" status for unassigned tenants in red
- [x] Update select-tenant.tsx to use unassignedTenants array
- [x] Remove tenant from unassignedTenants when assigning to room
- [x] Update handleDeleteTenant to remove from unassignedTenants
- [x] Update getConflicts to detect unassigned tenants as conflicts
- [x] Write comprehensive tests for settlement workflow (15 tests)
- [x] All 106 tests passing


### Exit Protection for Unassigned Tenants
- [x] Add handleBackPress function to address-details.tsx
- [x] Check for unassignedTenants before allowing exit
- [x] Show Alert with tenant count and instructions
- [x] Offer option to switch to "Pokoje" tab from alert
- [x] Prevent exit until all tenants are assigned
- [x] Unassigned tenants persist in storage if app closes
- [x] Unassigned tenants appear in conflicts on dashboard
- [x] Write comprehensive tests for exit protection (12 tests)
- [x] All 118 tests passing


### Alert Improvements for Unassigned Tenants
- [x] Update alert title to "Niezakończona operacja zaselenia"
- [x] Show specific tenant name in alert message
- [x] Add "Usuń mieszkańca" button with destructive style
- [x] Add three alert actions: Cancel, Delete, Go to Rooms
- [x] Delete tenant directly from alert
- [x] Write tests for alert actions (6 tests)
- [x] All 124 tests passing


### Room Management Improvements
- [x] Update room gender labels: "Mieści" (male), "Żeńskie" (female), "Pary" (couples)
- [x] Increase gender icon size in room cards
- [x] Fix room edit form - now opens edit-room instead of add-address
- [x] Add totalSpaces field to Room type (already existed)
- [x] Implement space count validation in add-room and edit-room forms
- [x] Show validation alert when total spaces exceed address limit
- [x] Update room form to include space count field
- [x] Create edit-room.tsx screen for editing rooms
- [x] All 124 tests passing


### Tenant Details Screen
- [x] Fix infinite loading when clicking tenant in list
- [x] Create tenant-details.tsx screen
- [x] Display personal data (name, surname, gender, birth year)
- [x] Show current placement (project, address, room, space)
- [x] Display check-in date and monthly price
- [x] Show settlement history (previous addresses and projects)
- [x] Display eviction dates if applicable
- [x] Fix navigation from tenant list to details
- [x] All 124 tests passing


### Gender-Based Filtering & Progress Bars
- [x] Add gender filtering to select-tenant screen based on room type
- [x] Filter logic: male room → only male tenants, female room → only female tenants, couple room → all
- [x] Add occupancy progress bar component
- [x] Display progress bars on room cards showing occupied/total spaces
- [x] Color coding: green (has space), yellow (mostly full), red (full)
- [x] Show occupancy ratio (e.g., 2/4) on progress bar
- [x] Test filtering with different room types
- [x] Test progress bar calculations
- [x] All 124 tests passing


### Eviction (Wypowiedzenie) Logic Fix
- [x] Add evictionDate field to Space type (already existed as Wypowiedzenie.endDate)
- [x] Update conflict detection: only conflict if evictionDate < today AND tenant exists
- [x] During eviction period (evictionDate > today): NOT a conflict, even if occupied
- [x] When evictionDate expires: remove space from room if empty, or mark as conflict if occupied
- [x] Update room-details screen to show eviction date (already implemented)
- [x] Add eviction date calculation (default +14 days) (already implemented)
- [x] Fixed: space.status now set to 'wypowiedzenie' when putting on eviction
- [x] Fixed: space.status restored when removing eviction
- [x] Conflict detection now works correctly: only triggers when endDate < today AND tenant exists
- [x] All 124 tests passing


### Room Details UI Redesign
- [x] Enlarge gender icon in room header for better visibility (added in rounded badge)
- [x] Reorganize space card hierarchy: tenant name as primary, space number as badge
- [x] Update empty space display to show "Wolne" (Free) instead of name
- [x] Make space number a tag/badge (secondary information)
- [x] Test UI layout and readability
- [x] Verify visual hierarchy is correct
- [x] All 124 tests passing


### Space Deletion with Smart Alerts
- [x] Add Delete Space option to space context menu (always visible)
- [x] Menu has 2 options: Wypowiedzenie and Delete
- [x] If space is empty: show alert Delete or put on eviction?
  - Option 1: Delete → remove space, decrease space count
  - Option 2: Put on eviction → set eviction status
  - Option 3: Cancel
- [x] If space is occupied: show alert Place is occupied. Free it and try again.
  - Option 1: Put on eviction → set eviction status (keep tenant)
  - Option 2: Cancel
  - Cannot delete occupied space (no relocate option)
- [x] Implement delete space function with occupancy checks
- [x] Test all deletion scenarios
- [x] All 124 tests passing


### Calendar Layout Fix
- [x] Fix oversized cells in last row of calendar
- [x] Ensure all calendar cells have uniform dimensions
- [x] Remove flex-1 wrapper from calendar day cells
- [x] Test calendar display for different months
- [x] Verify calendar grid alignment
- [x] All 124 tests passing


### Calendar Event Modal Fixes
- [x] Add pt-12 padding to calendar event modal to prevent status bar overlap
- [x] Replace "Miejsce: X" with room name in event details
- [x] Display format: Name Surname → Project → Address → Room Name (Pokój: ...)
- [x] Keep event type badge on right (Zamelowanie, Wypowiedzenie, Wymeldowanie)
- [x] Changed CalendarEvent interface: roomNumber → roomName
- [x] All 124 tests passing
