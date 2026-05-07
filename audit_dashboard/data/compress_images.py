from PIL import Image
import os

input_root = r"N:\01.DESIGN LAB\25-06_BSF SMALL GRANTS PROGRAMME\02_Implementation\04_Dashboard\Decoding Stormwater Tools\02. Github Repo - DO NOT OPEN\mod-foundation\audit_dashboard\data\media"
output_root = r"N:\01.DESIGN LAB\25-06_BSF SMALL GRANTS PROGRAMME\02_Implementation\04_Dashboard\Decoding Stormwater Tools\02. Github Repo - DO NOT OPEN\mod-foundation\audit_dashboard\data\media_compressed"

total = sum(
    1 for _, _, files in os.walk(input_root)
    for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png'))
)

done = 0

for dirpath, dirnames, filenames in os.walk(input_root):
    for filename in filenames:
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            input_path = os.path.join(dirpath, filename)
            relative_path = os.path.relpath(dirpath, input_root)
            output_dir = os.path.join(output_root, relative_path)
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, filename)

            if not os.path.exists(output_path):
                try:
                    img = Image.open(input_path)
                    exif = img.info.get('exif', b'')
                    if img.mode in ('RGBA', 'P'):
                        img = img.convert('RGB')
                    if img.width > 1920:
                        ratio = 1920 / img.width
                        img = img.resize((1920, int(img.height * ratio)), Image.LANCZOS)
                    img.save(output_path, format='JPEG', quality=75, optimize=True, exif=exif)
                except Exception as e:
                    print(f"\nFAILED: {filename} — {e}")

            done += 1
            print(f"\r{done}/{total} files done", end='')

print("\nAll done.")