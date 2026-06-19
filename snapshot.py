import os

def create_snapshot():
    output_file = 'PROJEKT_SNAPSHOT.txt'
    # We only want these root-level files and directories
    allowed_dirs = {'src', 'supabase', 'public'}
    allowed_root_files = {
        'package.json', 'package-lock.json', 'vite.config.js', 'tailwind.config.js',
        'postcss.config.js', 'index.html', '.env.example', '.gitignore', 'netlify.toml',
        'UEBERGABE.md'
    }

    header = """================================================================================
TASK-RPG-PWA – ÜBERGABE-PROTOKOLL / VOLLSTÄNDIGER PROJEKT-SNAPSHOT
Erstellt: 2026-05-30
Format: >>>FILE: pfad/zur/datei ... >>>END
Eine KI kann dieses Dokument einlesen und alle Dateien exakt rekonstruieren.
================================================================================
"""

    files_content = []
    file_count = 0

    for root, dirs, files in os.walk('.'):
        rel_root = os.path.relpath(root, '.')
        
        # Decide if we enter this directory
        if rel_root == '.':
            # At root, we'll pick allowed files and enter allowed dirs
            dirs[:] = [d for d in dirs if d in allowed_dirs]
        else:
            # Inside an allowed dir, we process everything unless it's a hidden/exclude dir
            # (though with current logic, only src/supabase/public are reachable)
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, '.')
            
            # Check if it's an allowed root file or inside an allowed dir
            is_allowed = False
            if rel_path in allowed_root_files:
                is_allowed = True
            else:
                parts = rel_path.split(os.sep)
                if parts[0] in allowed_dirs:
                    is_allowed = True
            
            if not is_allowed:
                continue

            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                files_content.append(f">>>FILE: {rel_path}\n{content}\n>>>END\n")
                file_count += 1
            except Exception as e:
                # Silently skip binaries or unreadable files if any
                pass

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(header)
        f.write(f"\nHINWEISE:\n  - package-lock.json & node_modules/ & dist/ ausgelassen (regenerierbar).\n  - Anzahl Dateien: {file_count}\n")
        f.write("================================================================================\n\n")
        for fc in files_content:
            f.write(fc)

    print(f"Snapshot created: {output_file} with {file_count} files.")

if __name__ == "__main__":
    create_snapshot()
