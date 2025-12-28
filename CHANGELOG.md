# Changelog - Bug Fixes (28.12.2025)

## Fixed Issues

### 1. CSV Import to Existing Project
**Problem**: When importing CSV to an existing project, after resolving address conflicts, the import was not executed - only an alert was shown.

**Solution**:
- Added `pendingCSVRows` state to store parsed CSV data
- Updated `handleAddressMatch` and `handleCreateNewAddress` to actually perform the import after conflict resolution
- Import now properly executes with selected address mappings

**Files changed**:
- `app/(tabs)/index.tsx`

### 2. Archive Search with Full Tenant Data
**Problem**: When searching archived tenants, their data (gender, birth year, monthly price, phone) was not stored in the archive, causing incorrect display.

**Solution**:
- Updated `EvictionArchive` type to include all tenant data: `gender`, `birthYear`, `monthlyPrice`, `phone`, `roomName`
- Updated `addToEvictionArchive` function to save all tenant data
- Updated `checkOutTenant` to pass room name to archive
- Updated search screen to use full tenant data from archive
- Updated `restoreTenantFromArchive` to restore tenant with all original data

**Files changed**:
- `types/index.ts`
- `lib/store.ts`
- `app/(tabs)/search.tsx`

### 3. Eviction Reason Display
**Problem**: Eviction reason was displayed as raw enum value (e.g., "job_change") instead of human-readable text.

**Solution**:
- Created `lib/eviction-reasons.ts` helper with `getEvictionReasonLabel` function
- Added eviction reason badge at the top of archived tenant card
- Translated eviction reasons to Polish:
  - `job_change` → "Zmiana pracy"
  - `own_housing` → "Własne mieszkanie"
  - `disciplinary` → "Dyscyplinarne"
  - `relocation` → "Przeprowadzka"

**Files changed**:
- `lib/eviction-reasons.ts` (new file)
- `app/(tabs)/search.tsx`

### 4. Tenant Restoration from Archive
**Status**: Already implemented correctly
- Restore button on archived tenant card
- Project and address selection dialog
- Tenant restored to unassigned tenants list with all data preserved

## Testing Recommendations

1. Test CSV import to new project
2. Test CSV import to existing project with address conflicts
3. Test CSV import to existing project without conflicts
4. Test tenant eviction and archive creation
5. Test archive search with checkbox
6. Test tenant restoration from archive
7. Verify eviction reason display in Polish
8. Verify all tenant data is preserved in archive

## Breaking Changes

⚠️ **Note**: Existing eviction archive entries created before this update will not have the new fields (gender, birthYear, etc.). They will display with default values when searched. New evictions will store all data correctly.
