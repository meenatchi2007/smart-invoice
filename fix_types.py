import os
import re

directories = ['app', 'components']
files_to_check = []

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                files_to_check.append(os.path.join(root, file))

for filepath in files_to_check:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False

    if "useQuery(" in content and "useQuery<any>(" not in content:
        content = content.replace("useQuery(", "useQuery<any>(")
        modified = True
        
    if "useMutation(" in content and "useMutation<any>(" not in content:
        content = content.replace("useMutation(", "useMutation<any>(")
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
