import os
from PIL import Image
import numpy as np
from collections import deque

def extract_env_asset(img, box, out_path, bg_color=None, tol=25):
    crop = img.crop(box)
    if bg_color is None:
        crop.save(out_path)
        return

    arr = np.array(crop)
    h, w, c = arr.shape
    if c == 4:
        rgb = arr[:, :, :3]
    else:
        rgb = arr

    diffs = np.max(np.abs(rgb.astype(int) - bg_color), axis=2)
    visited = np.zeros((h, w), dtype=bool)
    is_bg = np.zeros((h, w), dtype=bool)
    q = deque([(0, x) for x in range(w)] + [(h-1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w-1) for y in range(h)])

    while q:
        cy, cx = q.popleft()
        if cy < 0 or cy >= h or cx < 0 or cx >= w or visited[cy, cx]:
            continue
        visited[cy, cx] = True
        if diffs[cy, cx] <= tol:
            is_bg[cy, cx] = True
            q.append((cy-1, cx))
            q.append((cy+1, cx))
            q.append((cy, cx-1))
            q.append((cy, cx+1))

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = np.where(is_bg, 0, 255)
    out_img = Image.fromarray(rgba, 'RGBA')
    out_img.save(out_path)

def process_all_env(base_dir):
    out_dir = os.path.join(base_dir, 'public', 'assets', 'environment')
    os.makedirs(out_dir, exist_ok=True)

    img1 = Image.open(os.path.join(base_dir, 'scene example1.png'))
    img2 = Image.open(os.path.join(base_dir, 'scene example2.png'))
    img_cinematic = Image.open(os.path.join(base_dir, 'scene1.png'))

    # Save cinematic scene
    img_cinematic.save(os.path.join(out_dir, 'scene_cinematic.png'))
    print('Saved scene_cinematic.png')

    # Save background sky layer
    sky_crop = img2.crop((0, 0, 1672, 670))
    sky_crop.save(os.path.join(out_dir, 'bg_sky_panoramic.png'))
    print('Saved bg_sky_panoramic.png')

    # Save distant sky from scene example 1
    sky1_crop = img1.crop((0, 0, 1672, 700))
    sky1_crop.save(os.path.join(out_dir, 'bg_sky_daylight.png'))
    print('Saved bg_sky_daylight.png')

    # Floating platform large
    plat_large = img1.crop((738, 418, 1002, 532))
    # Make outer sky transparent
    # Sky color around plat_large is around [30, 100, 190]
    plat_arr = np.array(plat_large)
    h, w, _ = plat_arr.shape
    sky_bg = np.array([30, 95, 175])
    diffs = np.max(np.abs(plat_arr.astype(int) - sky_bg), axis=2)
    visited = np.zeros((h, w), dtype=bool)
    is_bg = np.zeros((h, w), dtype=bool)
    q = deque([(0, x) for x in range(w)] + [(h-1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w-1) for y in range(h)])
    while q:
        cy, cx = q.popleft()
        if cy < 0 or cy >= h or cx < 0 or cx >= w or visited[cy, cx]:
            continue
        visited[cy, cx] = True
        # If blueish sky color
        if diffs[cy, cx] <= 55 and plat_arr[cy, cx, 2] > plat_arr[cy, cx, 0] + 30:
            is_bg[cy, cx] = True
            q.append((cy-1, cx))
            q.append((cy+1, cx))
            q.append((cy, cx-1))
            q.append((cy, cx+1))
    rgba_plat = np.zeros((h, w, 4), dtype=np.uint8)
    rgba_plat[:, :, :3] = plat_arr
    rgba_plat[:, :, 3] = np.where(is_bg, 0, 255)
    Image.fromarray(rgba_plat, 'RGBA').save(os.path.join(out_dir, 'platform_hover_large.png'))
    print('Saved platform_hover_large.png')

    # Small hover platform
    plat_small = img1.crop((908, 775, 1056, 856))
    plat_small.save(os.path.join(out_dir, 'platform_hover_small.png'))
    print('Saved platform_hover_small.png')

    # Metal ground walkway modular tile (from scene example 2)
    # y: 665 to 735, x: 200 to 500
    walkway = img2.crop((200, 665, 520, 735))
    walkway.save(os.path.join(out_dir, 'metal_walkway.png'))
    print('Saved metal_walkway.png')

    # Crates
    # Stack of crates from scene 2: x: 468 to 610, y: 560 to 672
    crates_stack = img2.crop((468, 560, 610, 672))
    crates_stack.save(os.path.join(out_dir, 'crate_stack.png'))
    print('Saved crate_stack.png')

    # Hazard stripe crate from scene 2: x: 1135 to 1295, y: 540 to 672
    hazard_crate = img2.crop((1135, 540, 1295, 672))
    hazard_crate.save(os.path.join(out_dir, 'crate_hazard.png'))
    print('Saved crate_hazard.png')

    # Base building 01 entrance from scene 2: x: 0 to 310, y: 400 to 675
    base_entrance = img2.crop((0, 400, 310, 675))
    base_entrance.save(os.path.join(out_dir, 'base_entrance_01.png'))
    print('Saved base_entrance_01.png')

    # Dual Street Lamp from scene 2: x: 340 to 395, y: 415 to 670
    lamp = img2.crop((340, 415, 395, 670))
    # Make transparent background around the thin pole
    lamp_arr = np.array(lamp)
    lh, lw, _ = lamp_arr.shape
    # sky color behind lamp is dark blue [20, 45, 80]
    sky_lamp = np.array([22, 48, 85])
    diffs = np.max(np.abs(lamp_arr.astype(int) - sky_lamp), axis=2)
    is_bg = np.zeros((lh, lw), dtype=bool)
    visited = np.zeros((lh, lw), dtype=bool)
    q = deque([(0, x) for x in range(lw)] + [(lh-1, x) for x in range(lw)] + [(y, 0) for y in range(lh)] + [(y, lw-1) for y in range(lh)])
    while q:
        cy, cx = q.popleft()
        if cy < 0 or cy >= lh or cx < 0 or cx >= lw or visited[cy, cx]:
            continue
        visited[cy, cx] = True
        if diffs[cy, cx] <= 40:
            is_bg[cy, cx] = True
            q.append((cy-1, cx))
            q.append((cy+1, cx))
            q.append((cy, cx-1))
            q.append((cy, cx+1))
    rgba_lamp = np.zeros((lh, lw, 4), dtype=np.uint8)
    rgba_lamp[:, :, :3] = lamp_arr
    rgba_lamp[:, :, 3] = np.where(is_bg, 0, 255)
    Image.fromarray(rgba_lamp, 'RGBA').save(os.path.join(out_dir, 'street_lamp.png'))
    print('Saved street_lamp.png')

    # Banner from scene 2: x: 1540 to 1660, y: 250 to 670
    banner = img2.crop((1540, 250, 1660, 670))
    banner.save(os.path.join(out_dir, 'eagle_banner.png'))
    print('Saved eagle_banner.png')

    # Base B-03 right docking bay from scene 1: x: 1530 to 1672, y: 410 to 630
    dock_bay = img1.crop((1530, 410, 1672, 630))
    dock_bay.save(os.path.join(out_dir, 'dock_terminal.png'))
    print('Saved dock_terminal.png')

if __name__ == '__main__':
    process_all_env(r'c:\Antigravity\Warhammer909')
