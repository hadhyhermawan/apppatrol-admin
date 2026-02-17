# Route Protection Implementation Guide

## ✅ What's Been Implemented

### 1. **403 Forbidden Page**
**File**: `/src/app/forbidden/page.tsx`
- Beautiful error page for unauthorized access
- "Go Back" and "Go to Dashboard" buttons
- Clear messaging about permission requirements

### 2. **PermissionGuard Component**
**File**: `/src/components/guards/PermissionGuard.tsx`
- Client-side permission checking
- Auto-redirect to /forbidden if no permission
- Loading state while checking permissions
- Supports `requireAll` mode (user must have ALL permissions)

### 3. **withPermission HOC**
**File**: `/src/hoc/withPermission.tsx`
- Higher-Order Component for easy page protection
- Wraps any page component with PermissionGuard
- Clean and reusable API

### 4. **Route Permission Mapping**
**File**: `/src/config/routePermissions.ts`
- Centralized permission mapping for all routes
- Easy to maintain and update
- Helper functions for permission lookup

### 5. **Example Implementation**
**File**: `/src/app/master/karyawan/page.tsx`
- Protected with `withPermission` HOC
- Requires `karyawan.index` permission
- Auto-redirects to /forbidden if no access

---

## 🚀 How to Protect Other Pages

### Method 1: Using `withPermission` HOC (Recommended)

**Step 1**: Import the HOC
```typescript
import { withPermission } from '@/hoc/withPermission';
```

**Step 2**: Change `export default` to named function
```typescript
// Before:
export default function MyPage() {
  // ...
}

// After:
function MyPage() {
  // ...
}
```

**Step 3**: Export with withPermission wrapper
```typescript
export default withPermission(MyPage, {
  permissions: ['permission.name']
});
```

**Complete Example**:
```typescript
'use client';

import { withPermission } from '@/hoc/withPermission';

function DepartemenPage() {
  return (
    <MainLayout>
      {/* Your page content */}
    </MainLayout>
  );
}

export default withPermission(DepartemenPage, {
  permissions: ['departemen.index']
});
```

---

### Method 2: Using PermissionGuard Directly

```typescript
'use client';

import PermissionGuard from '@/components/guards/PermissionGuard';

export default function MyPage() {
  return (
    <PermissionGuard permissions={['permission.name']}>
      <MainLayout>
        {/* Your page content */}
      </MainLayout>
    </PermissionGuard>
  );
}
```

---

## 📋 Pages to Protect

### Data Master
- [ ] `/master/departemen` → `departemen.index`
- [ ] `/master/jabatan` → `jabatan.index`
- [ ] `/master/cabang` → `cabang.index`
- [ ] `/master/patrolpoint` → `patrolpoint.index`
- [ ] `/master/cuti` → `cuti.index`
- [ ] `/master/jamkerja` → `jamkerja.index`
- [ ] `/master/jadwal` → `jadwal.index`
- [ ] `/master/dept-task-point` → `depttaskpoint.index`
- [ ] `/master/walkiechannel` → `walkiechannel.index`
- [x] `/master/karyawan` → `karyawan.index` ✅ DONE

### Monitoring
- [ ] `/presensi` → `presensi.index`

### Security
- [ ] `/security/patrol` → `giatpatrol.index`
- [ ] `/security/safety` → `safety.index`
- [ ] `/security/barang` → `barang.index`
- [ ] `/security/tamu` → `tamu.index`
- [ ] `/security/turlalin` → `turlalin.index`
- [ ] `/security/surat` → `surat.index`
- [ ] `/security/teams` → `teams.index`
- [ ] `/security/map-tracking` → `tracking.index`
- [ ] `/security/tracking` → `tracking.index`
- [ ] `/security/reports` → `laporan.index`

### Cleaning
- [ ] `/cleaning/tasks` → `cleaning.index`

### Utilities
- [ ] `/utilities/users` → `users.index`
- [ ] `/utilities/roles` → `roles.index`
- [ ] `/utilities/permissions` → `permissions.index`
- [ ] `/utilities/group-permissions` → `permissiongroups.index`
- [ ] `/utilities/role-permission` → `['roles.index', 'permissions.index']`
- [ ] `/utilities/logs` → `logs.index`
- [ ] `/utilities/security-reports` → `securityreports.index`
- [ ] `/utilities/multi-device` → `multidevice.index`
- [ ] `/utilities/chat-management` → `chat.index`

### Reports
- [ ] `/reports/presensi` → `laporan.index`
- [ ] `/reports/salary` → `laporan.index`
- [ ] `/reports/patrol-monitoring` → `monitoringpatrol.index`

### Payroll
- [ ] `/payroll/jenis-tunjangan` → `jenistunjangan.index`
- [ ] `/payroll/gaji-pokok` → `gajipokok.index`
- [ ] `/payroll/tunjangan` → `tunjangan.index`
- [ ] `/payroll/bpjs-kesehatan` → `bpjskesehatan.index`
- [ ] `/payroll/bpjs-tenagakerja` → `bpjstenagakerja.index`
- [ ] `/payroll/penyesuaian-gaji` → `penyesuaiangaji.index`
- [ ] `/payroll/slip-gaji` → `slipgaji.index`

### Others
- [ ] `/izin` → `['izinabsen.index', 'izincuti.index', 'izinsakit.index', 'izindinas.index']`
- [ ] `/lembur` → `lembur.index`
- [ ] `/settings/general` → `generalsetting.index`
- [ ] `/settings/jam-kerja-dept` → `jamkerjadepartemen.index`
- [ ] `/settings/hari-libur` → `harilibur.index`
- [ ] `/settings/users` → `users.index`

---

## 🔧 Advanced Options

### Require ALL Permissions
```typescript
export default withPermission(MyPage, {
  permissions: ['permission1', 'permission2'],
  requireAll: true  // User must have BOTH permissions
});
```

### Custom Fallback Path
```typescript
export default withPermission(MyPage, {
  permissions: ['permission.name'],
  fallbackPath: '/custom-error-page'
});
```

---

## ✅ Testing

### Test Scenario 1: Super Admin
1. Login as super admin
2. Try accessing any protected page
3. **Expected**: Access granted (super admin bypasses all checks)

### Test Scenario 2: User with Permission
1. Login as user with `karyawan.index` permission
2. Navigate to `/master/karyawan`
3. **Expected**: Page loads normally

### Test Scenario 3: User without Permission
1. Login as user WITHOUT `karyawan.index` permission
2. Try to access `/master/karyawan` directly via URL
3. **Expected**: Redirected to `/forbidden` page

### Test Scenario 4: Sidebar Hiding
1. Login as user with limited permissions
2. Check sidebar
3. **Expected**: Only see menus for which user has permissions

---

## 🎯 Next Steps

1. **Apply to All Pages**: Use the checklist above to protect all pages
2. **Button-Level Permissions**: Hide Create/Edit/Delete buttons based on permissions
3. **API-Level Permissions**: Add backend permission checks
4. **Testing**: Test with different user roles

---

## 📝 Notes

- **Super Admin**: Always has access to everything (bypasses all checks)
- **Loading State**: Shows spinner while checking permissions
- **Auto-Redirect**: Automatically redirects to /forbidden if no permission
- **Client-Side**: Protection happens on client (backend should also validate)
- **Performance**: Permission check is cached in PermissionContext

---

## 🚨 Important

**This is client-side protection only!**

You MUST also implement:
1. **Backend API validation** - Check permissions before executing actions
2. **Button-level permissions** - Hide/disable action buttons
3. **Route middleware** - Server-side route protection (optional but recommended)

Client-side protection improves UX but is NOT a security measure by itself!
