import sys

filepath = '/var/www/apppatrol-admin/src/app/reports/presensi/[id]/page.tsx'

with open(filepath, 'r') as f:
    content = f.read()

start_marker = 'return ('
end_marker = 'export default withPermission(LaporanDetailKaryawanPage'

# need to find the specific one for Component
start_idx = content.find(start_marker, content.find('const events = data.map'))
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    before = content[:start_idx]
    after = content[end_idx:]
    
    with open('/var/www/apppatrol-admin/new_layout.tsx', 'r') as f2:
        new_return = f2.read()
    
    with open(filepath, 'w') as f:
        f.write(before + new_return + '\n\n' + after)
    print('Successfully replaced.')
else:
    print('Markers not found.', start_idx, end_idx)
