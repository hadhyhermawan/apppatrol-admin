#!/usr/bin/env python3
"""
Bulk apply button-level permissions to all pages
Adds usePermissions hook and wraps CRUD buttons with permission checks
"""

import os
import re

# Pages to apply button permissions
PAGES_TO_UPDATE = [
    # Data Master
    ("master/jabatan/page.tsx", "jabatan"),
    ("master/cabang/page.tsx", "cabang"),
    ("master/patrolpoint/page.tsx", "patrolpoint"),
    ("master/cuti/page.tsx", "cuti"),
    ("master/jamkerja/page.tsx", "jamkerja"),
    ("master/jadwal/page.tsx", "jadwal"),
    ("master/dept-task-point/page.tsx", "depttaskpoint"),
    ("master/walkiechannel/page.tsx", "walkiechannel"),
    
    # Monitoring
    ("presensi/page.tsx", "presensi"),
    
    # Security
    ("security/patrol/page.tsx", "giatpatrol"),
    ("security/safety/page.tsx", "safety"),
    ("security/barang/page.tsx", "barang"),
    ("security/tamu/page.tsx", "tamu"),
    ("security/turlalin/page.tsx", "turlalin"),
    ("security/surat/page.tsx", "surat"),
    ("security/teams/page.tsx", "teams"),
    
    # Cleaning
    ("cleaning/tasks/page.tsx", "cleaning"),
    
    # Utilities
    ("utilities/users/page.tsx", "users"),
    ("utilities/roles/page.tsx", "roles"),
    ("utilities/permissions/page.tsx", "permissions"),
    ("utilities/group-permissions/page.tsx", "permissiongroups"),
    ("utilities/logs/page.tsx", "logs"),
    ("utilities/multi-device/page.tsx", "multidevice"),
    
    # Payroll
    ("payroll/jenis-tunjangan/page.tsx", "jenistunjangan"),
    ("payroll/gaji-pokok/page.tsx", "gajipokok"),
    ("payroll/tunjangan/page.tsx", "tunjangan"),
    ("payroll/bpjs-kesehatan/page.tsx", "bpjskesehatan"),
    ("payroll/bpjs-tenagakerja/page.tsx", "bpjstenagakerja"),
    ("payroll/penyesuaian-gaji/page.tsx", "penyesuaiangaji"),
    ("payroll/slip-gaji/page.tsx", "slipgaji"),
    
    # Others
    ("lembur/page.tsx", "lembur"),
    ("settings/general/page.tsx", "generalsetting"),
    ("settings/jam-kerja-dept/page.tsx", "jamkerjadepartemen"),
    ("settings/hari-libur/page.tsx", "harilibur"),
]

BASE_DIR = "/var/www/apppatrol-admin/src/app"

def has_use_permissions(content):
    """Check if file already uses usePermissions hook"""
    return "usePermissions" in content and "canCreate" in content

def add_import(content):
    """Add usePermissions import if not exists"""
    if "usePermissions" in content:
        return content
    
    # Find withPermission import line
    pattern = r"(import { withPermission } from '@/hoc/withPermission';)"
    match = re.search(pattern, content)
    
    if match:
        insert_pos = match.end()
        import_line = "\nimport { usePermissions } from '@/contexts/PermissionContext';"
        content = content[:insert_pos] + import_line + content[insert_pos:]
    
    return content

def add_hook_usage(content, resource):
    """Add usePermissions hook usage at start of component"""
    # Find function component declaration
    pattern = r"(function \w+\(\) {)"
    match = re.search(pattern, content)
    
    if match:
        insert_pos = match.end()
        hook_line = f"\n    const {{ canCreate, canUpdate, canDelete }} = usePermissions();"
        content = content[:insert_pos] + hook_line + content[insert_pos:]
    
    return content

def wrap_add_button(content, resource):
    """Wrap 'Tambah Data' or 'Add' button with canCreate check"""
    patterns = [
        # Link button pattern
        (r'(<Link\s+href="[^"]+/create"[^>]*>\s*<\w+[^>]*>\s*<\w+[^/]*/>.*?</Link>)', 
         lambda m: f"{{canCreate('{resource}') && (\n                            {m.group(1)}\n                        )}}"),
        
        # Button with onClick pattern for modal
        (r'(<button\s+onClick={[^}]+Create}[^>]*>\s*<Plus[^/]*/>.*?</button>)',
         lambda m: f"{{canCreate('{resource}') && (\n                            {m.group(1)}\n                        )}}"),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
            break
    
    return content

def wrap_edit_button(content, resource):
    """Wrap Edit button with canUpdate check"""
    patterns = [
        # Link edit button
        (r'(<Link\s+href={`[^`]+/edit/[^`]+`}[^>]*>\s*<Edit[^/]*/>.*?</Link>)',
         lambda m: f"{{canUpdate('{resource}') && (\n                                                    {m.group(1)}\n                                                )}}"),
        
        # Button edit with onClick
        (r'(<button\s+onClick={\(\) => handleOpenEdit\([^)]+\)}[^>]*>\s*<Edit[^/]*/>.*?</button>)',
         lambda m: f"{{canUpdate('{resource}') && (\n                                                    {m.group(1)}\n                                                )}}"),
    ]
    
    for pattern, replacement in patterns:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
            break
    
    return content

def wrap_delete_button(content, resource):
    """Wrap Delete button with canDelete check"""
    pattern = r'(<button\s+onClick={\(\) => handleDelete\([^)]+\)}[^>]*>\s*<Trash[^/]*/>.*?</button>)'
    
    if re.search(pattern, content, re.DOTALL):
        replacement = lambda m: f"{{canDelete('{resource}') && (\n                                                    {m.group(1)}\n                                                )}}"
        content = re.sub(pattern, replacement, content, count=1, flags=re.DOTALL)
    
    return content

def apply_button_permissions(file_path, resource):
    """Apply button-level permissions to a page"""
    
    if not os.path.exists(file_path):
        print(f"⚠️  File not found: {file_path}")
        return False
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if has_use_permissions(content):
        print(f"⏭️  Already has button permissions: {file_path}")
        return False
    
    original_content = content
    
    # Step 1: Add import
    content = add_import(content)
    
    # Step 2: Add hook usage
    content = add_hook_usage(content, resource)
    
    # Step 3: Wrap buttons
    content = wrap_add_button(content, resource)
    content = wrap_edit_button(content, resource)
    content = wrap_delete_button(content, resource)
    
    # Only write if changes were made
    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Applied button permissions: {file_path} → {resource}")
        return True
    else:
        print(f"⏭️  No changes needed: {file_path}")
        return False

def main():
    print("🔘 Starting bulk button permission application...\n")
    
    applied = 0
    skipped = 0
    failed = 0
    
    for page_path, resource in PAGES_TO_UPDATE:
        full_path = os.path.join(BASE_DIR, page_path)
        
        try:
            if apply_button_permissions(full_path, resource):
                applied += 1
            else:
                skipped += 1
        except Exception as e:
            print(f"❌ Error processing {page_path}: {e}")
            failed += 1
    
    print(f"\n✅ Summary:")
    print(f"   Applied: {applied}")
    print(f"   Skipped: {skipped}")
    print(f"   Failed: {failed}")
    print(f"   Total: {applied + skipped + failed}")

if __name__ == "__main__":
    main()
