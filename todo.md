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
