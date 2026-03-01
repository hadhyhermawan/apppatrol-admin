import os
import glob

search_dir = '/var/www/apppatrol-admin/src/'
old_str = 'https://k3guard.com/storage/'
new_str = '${process.env.NEXT_PUBLIC_API_URL}/storage/'

old_str2 = 'http://k3guard.com:8000'
new_str2 = 'https://frontend.k3guard.com/api-py'

count = 0
for filepath in glob.iglob(search_dir + '**/*.tsx', recursive=True):
    with open(filepath, 'r') as f:
        content = f.read()
    
    modified = False
    if old_str in content:
        content = content.replace(old_str, new_str)
        modified = True

    if old_str2 in content:
        content = content.replace(old_str2, new_str2)
        modified = True

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
        count += 1
        
for filepath in glob.iglob(search_dir + '**/*.ts', recursive=True):
    with open(filepath, 'r') as f:
        content = f.read()
    
    modified = False
    if old_str in content:
        content = content.replace(old_str, new_str)
        modified = True

    if old_str2 in content:
        content = content.replace(old_str2, new_str2)
        modified = True

    if modified:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated {filepath}")
        count += 1

print(f"Total files updated: {count}")
