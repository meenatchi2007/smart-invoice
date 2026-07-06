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

    # import { ApolloProvider } from '@apollo/client';
    if "import { ApolloProvider } from '@apollo/client';" in content:
        content = content.replace("import { ApolloProvider } from '@apollo/client';", "import { ApolloProvider } from '@apollo/client/react';")
        modified = True

    # import { gql, useQuery } from '@apollo/client';
    if "import { gql, useQuery } from '@apollo/client';" in content:
        content = content.replace("import { gql, useQuery } from '@apollo/client';", "import { gql } from '@apollo/client/core';\nimport { useQuery } from '@apollo/client/react';")
        modified = True

    # import { gql, useQuery, useMutation } from '@apollo/client';
    if "import { gql, useQuery, useMutation } from '@apollo/client';" in content:
        content = content.replace("import { gql, useQuery, useMutation } from '@apollo/client';", "import { gql } from '@apollo/client/core';\nimport { useQuery, useMutation } from '@apollo/client/react';")
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
