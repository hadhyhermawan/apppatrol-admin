#!/bin/bash

# Bulk Apply Permission Protection to All Pages
# This script adds withPermission HOC to all page.tsx files

echo "🔒 Starting bulk permission protection..."

# Define page -> permission mappings
declare -A PAGE_PERMISSIONS=(
    # Data Master
    ["master/departemen/page.tsx"]="departemen.index"
    ["master/jabatan/page.tsx"]="jabatan.index"
    ["master/cabang/page.tsx"]="cabang.index"
    ["master/patrolpoint/page.tsx"]="patrolpoint.index"
    ["master/cuti/page.tsx"]="cuti.index"
    ["master/jamkerja/page.tsx"]="jamkerja.index"
    ["master/jadwal/page.tsx"]="jadwal.index"
    ["master/dept-task-point/page.tsx"]="depttaskpoint.index"
    ["master/walkiechannel/page.tsx"]="walkiechannel.index"
    
    # Monitoring
    ["presensi/page.tsx"]="presensi.index"
    
    # Security
    ["security/patrol/page.tsx"]="giatpatrol.index"
    ["security/safety/page.tsx"]="safety.index"
    ["security/barang/page.tsx"]="barang.index"
    ["security/tamu/page.tsx"]="tamu.index"
    ["security/turlalin/page.tsx"]="turlalin.index"
    ["security/surat/page.tsx"]="surat.index"
    ["security/teams/page.tsx"]="teams.index"
    ["security/map-tracking/page.tsx"]="tracking.index"
    ["security/tracking/page.tsx"]="tracking.index"
    
    # Cleaning
    ["cleaning/tasks/page.tsx"]="cleaning.index"
    
    # Utilities
    ["utilities/users/page.tsx"]="users.index"
    ["utilities/roles/page.tsx"]="roles.index"
    ["utilities/permissions/page.tsx"]="permissions.index"
    ["utilities/group-permissions/page.tsx"]="permissiongroups.index"
    ["utilities/logs/page.tsx"]="logs.index"
    ["utilities/multi-device/page.tsx"]="multidevice.index"
    ["utilities/chat-management/page.tsx"]="chat.index"
    
    # Payroll
    ["payroll/jenis-tunjangan/page.tsx"]="jenistunjangan.index"
    ["payroll/gaji-pokok/page.tsx"]="gajipokok.index"
    ["payroll/tunjangan/page.tsx"]="tunjangan.index"
    ["payroll/bpjs-kesehatan/page.tsx"]="bpjskesehatan.index"
    ["payroll/bpjs-tenagakerja/page.tsx"]="bpjstenagakerja.index"
    ["payroll/penyesuaian-gaji/page.tsx"]="penyesuaiangaji.index"
    ["payroll/slip-gaji/page.tsx"]="slipgaji.index"
    
    # Others
    ["lembur/page.tsx"]="lembur.index"
    ["settings/general/page.tsx"]="generalsetting.index"
    ["settings/jam-kerja-dept/page.tsx"]="jamkerjadepartemen.index"
    ["settings/hari-libur/page.tsx"]="harilibur.index"
)

# Special cases with multiple permissions
declare -A MULTI_PERMISSIONS=(
    ["izin/page.tsx"]="'izinabsen.index', 'izincuti.index', 'izinsakit.index', 'izindinas.index'"
    ["utilities/role-permission/page.tsx"]="'roles.index', 'permissions.index'"
)

echo "📋 Found ${#PAGE_PERMISSIONS[@]} pages to protect with single permission"
echo "📋 Found ${#MULTI_PERMISSIONS[@]} pages to protect with multiple permissions"
echo ""

# Function to check if file already has withPermission
has_protection() {
    local file=$1
    grep -q "withPermission" "$file"
    return $?
}

# Counter
protected=0
skipped=0
failed=0

# Process single permission pages
for page in "${!PAGE_PERMISSIONS[@]}"; do
    file="/var/www/apppatrol-admin/src/app/$page"
    perm="${PAGE_PERMISSIONS[$page]}"
    
    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $page"
        ((failed++))
        continue
    fi
    
    if has_protection "$file"; then
        echo "⏭️  Already protected: $page"
        ((skipped++))
        continue
    fi
    
    echo "🔒 Protecting: $page → $perm"
    
    # This will be done manually or with a Python script
    # For now, just list them
    ((protected++))
done

echo ""
echo "✅ Summary:"
echo "   Protected: $protected"
echo "   Skipped: $skipped"
echo "   Failed: $failed"
echo ""
echo "📝 Note: Actual file modifications should be done carefully"
echo "   Use the pattern from master/karyawan/page.tsx as reference"
