import os
import re

def reconstruct(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find all file blocks
    # Using a non-greedy match for content but ensuring it ends with \n>>>END
    pattern = re.compile(r'^>>>FILE: (.*?)\n(.*?)\n>>>END', re.DOTALL | re.MULTILINE)
    matches = pattern.findall(content)
    
    reconstructed_count = 0
    for path, data in matches:
        path = path.strip()
        
        if "pfad/zur/datei" in path:
            continue

        os.makedirs(os.path.dirname(path), exist_ok=True) if os.path.dirname(path) else None
        
        with open(path, 'w', encoding='utf-8') as out:
            out.write(data)
        reconstructed_count += 1
        print(f"Reconstructed: {path}")
    
    print(f"Total reconstructed: {reconstructed_count}")

if __name__ == "__main__":
    reconstruct('uploads/PROJEKT_SNAPSHOT.txt')
