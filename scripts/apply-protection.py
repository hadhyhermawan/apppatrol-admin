#!/usr/bin/env python3
"""
Bulk apply permission protection to Next.js pages
"""

import os
import re

# Define page -> permission mappings
PAGE_PERMISSIONS = {
    # Data Master
    "master/jabatan/page.tsx": ["jabatan.index"],
    "master/cabang/page.tsx": ["cabang.index"],
    "master/patrolpoint/page.tsx": ["patrolpoint.index"],
    "master/cuti/page.tsx": ["cuti.index"],
    "master/jamkerja/page.tsx": ["jamkerja.index"],
    "master/jadwal/page.tsx": ["jadwal.index"],
    "master/dept-task-point/page.tsx": ["depttaskpoint.index"],
    "master/walkiechannel/page.tsx": ["walkiechannel.index"],
    
    # Monitoring
    "presensi/page.tsx": ["presensi.index"],
    
    # Security
    "security/patrol/page.tsx": ["giatpatrol.index"],
    "security/safety/page.tsx": ["safety.index"],
    "security/barang/page.tsx": ["barang.index"],
    "security/tamu/page.tsx": ["tamu.index"],
    "security/turlalin/page.tsx": ["turlalin.index"],
    "security/surat/page.tsx": ["surat.index"],
    "security/teams/page.tsx": ["teams.index"],
    "security/map-tracking/page.tsx": ["tracking.index"],
    "security/tracking/page.tsx": ["tracking.index"],
    
    # Cleaning
    "cleaning/tasks/page.tsx": ["cleaning.index"],
    
    # Utilities
    "utilities/users/page.tsx": ["users.index"],
    "utilities/roles/page.tsx": ["roles.index"],
    "utilities/permissions/page.tsx": ["permissions.index"],
    "utilities/group-permissions/page.tsx": ["permissiongroups.index"],
    "utilities/logs/page.tsx": ["logs.index"],
    "utilities/multi-device/page.tsx": ["multidevice.index"],
    "utilities/chat-management/page.tsx": ["chat.index"],
    
    # Payroll
    "payroll/jenis-tunjangan/page.tsx": ["jenistunjangan.index"],
    "payroll/gaji-pokok/page.tsx": ["gajipokok.index"],
    "payroll/tunjangan/page.tsx": ["tunjangan.index"],
    "payroll/bpjs-kesehatan/page.tsx": ["bpjskesehatan.index"],
    "payroll/bpjs-tenagakerja/page.tsx": ["bpjstenagakerja.index"],
    "payroll/penyesuaian-gaji/page.tsx": ["penyesuaiangaji.index"],
    "payroll/slip-gaji/page.tsx": ["slipgaji.index"],
    
    # Others
    "lembur/page.tsx": ["lembur.index"],
    "settings/general/page.tsx": ["generalsetting.index"],
    "settings/jam-kerja-dept/page.tsx": ["jamkerjadepartemen.index"],
    "settings/hari-libur/page.tsx": ["harilibur.index"],
    
    # Multiple permissions
    "izin/page.tsx": ["izinabsen.index", "izincuti.index", "izinsakit.index", "izindinas.index"],
    "utilities/role-permission/page.tsx": ["roles.index", "permissions.index"],
}

BASE_DIR = "/var/www/apppatrol-admin/src/app"

def has_protection(content):
    """Check if file already has withPermission"""
    return "withPermission" in content

def apply_protection(file_path, permissions):
    """Apply permission protection to a page file"""
    
    if not os.path.exists(file_path):
        print(f"⚠️  File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if has_protection(content):
        print(f"⏭️  Already protected: {file_path}")
        return False
    
    # Add import if not exists
    if "withPermission" not in content:
        # Find the last import statement
        import_pattern = r"(import .+ from .+;)\n"
        imports = list(re.finditer(import_pattern, content))
        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end()
            import_statement = "import { withPermission } from '@/hoc/withPermission';\n"
            content = content[:insert_pos] + import_statement + content[insert_pos:]
    
    # Change export default to named function
    content = re.sub(
        r"export default function (\w+)\(",
        r"function \1(",
        content
    )
    
    # Add export with withPermission at the end
    permissions_str = ", ".join([f"'{p}'" for p in permissions])
    export_code = f"\n\n// Protect page with permission\nexport default withPermission({get_component_name(content)}, {{\n    permissions: [{permissions_str}]\n}});\n"
    
    # Remove trailing newlines and add our export
    content = content.rstrip() + export_code
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Protected: {file_path} → {permissions}")
    return True

def get_component_name(content):
    """Extract component name from content"""
    match = re.search(r"function (\w+)\(", content)
    if match:
        return match.group(1)
    return "Page"

def main():
    print("🔒 Starting bulk permission protection...\n")
    
    protected = 0
    skipped = 0
    failed = 0
    
    for page_path, permissions in PAGE_PERMISSIONS.items():
        full_path = os.path.join(BASE_DIR, page_path)
        
        try:
            if apply_protection(full_path, permissions):
                protected += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"❌ Error processing {page_path}: {e}")
            failed += 1
    
    print(f"\n✅ Summary:")
    print(f"   Protected: {protected}")
    print(f"   Skipped: {skipped}")
    print(f"   Failed: {failed}")
    print(f"   Total: {protected + skipped + failed}")

if __name__ == "__main__":
    main()
