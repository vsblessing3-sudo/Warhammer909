import os
import json
from collections import deque
from PIL import Image
import numpy as np

def floodfill_transparent(sub, bg_color, tol=16, extra_seeds=None):
    h, w, _ = sub.shape
    visited = np.zeros((h, w), dtype=bool)
    is_bg = np.zeros((h, w), dtype=bool)
    q = deque()

    # Outer borders
    for x in range(w):
        q.append((0, x))
        q.append((h - 1, x))
    for y in range(h):
        q.append((y, 0))
        q.append((y, w - 1))

    if extra_seeds:
        for sy, sx in extra_seeds:
            if 0 <= sy < h and 0 <= sx < w:
                q.append((sy, sx))

    diffs = np.max(np.abs(sub.astype(int) - bg_color), axis=2)

    while q:
        cy, cx = q.popleft()
        if cy < 0 or cy >= h or cx < 0 or cx >= w:
            continue
        if visited[cy, cx]:
            continue
        visited[cy, cx] = True

        if diffs[cy, cx] <= tol:
            is_bg[cy, cx] = True
            q.append((cy - 1, cx))
            q.append((cy + 1, cx))
            q.append((cy, cx - 1))
            q.append((cy, cx + 1))

    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = sub
    rgba[:, :, 3] = np.where(is_bg, 0, 255)
    return rgba

def prune_disconnected_border_artifacts(alpha, min_size=50):
    """
    Removes small disconnected pixel clusters touching left or right borders
    (e.g., neighbor frame's muzzle flash or arm bleed).
    """
    h, w = alpha.shape
    visited = np.zeros((h, w), dtype=bool)
    cleaned = alpha.copy()

    for y in range(h):
        for x in range(w):
            if cleaned[y, x] > 0 and not visited[y, x]:
                comp = []
                q = deque([(y, x)])
                visited[y, x] = True
                touches_left = False
                touches_right = False
                while q:
                    cy, cx = q.popleft()
                    comp.append((cy, cx))
                    if cx <= 1: touches_left = True
                    if cx >= w - 2: touches_right = True
                    for ny, nx in [(cy-1, cx), (cy+1, cx), (cy, cx-1), (cy, cx+1)]:
                        if 0 <= ny < h and 0 <= nx < w and cleaned[ny, nx] > 0 and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((ny, nx))
                if len(comp) < min_size and (touches_left or touches_right):
                    for py, px in comp:
                        cleaned[py, px] = 0
    return cleaned

def clean_stray_islands(alpha):
    """
    Keeps the main character component and any closely adjacent components,
    discarding isolated border fragments or stray background line artifacts.
    """
    h, w = alpha.shape
    visited = np.zeros((h, w), dtype=bool)
    comps = []
    for y in range(h):
        for x in range(w):
            if alpha[y, x] > 0 and not visited[y, x]:
                comp = []
                q = deque([(y, x)])
                visited[y, x] = True
                while q:
                    cy, cx = q.popleft()
                    comp.append((cy, cx))
                    for ny, nx in [(cy-1, cx), (cy+1, cx), (cy, cx-1), (cy, cx+1)]:
                        if 0 <= ny < h and 0 <= nx < w and alpha[ny, nx] > 0 and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((ny, nx))
                comps.append(comp)
    if not comps:
        return alpha
    # Sort by size descending: main character is largest component
    comps.sort(key=lambda c: len(c), reverse=True)
    main_comp = np.array(comps[0])
    main_min_y, main_max_y = main_comp[:, 0].min(), main_comp[:, 0].max()
    main_min_x, main_max_x = main_comp[:, 1].min(), main_comp[:, 1].max()

    cleaned = np.zeros_like(alpha)
    for py, px in comps[0]:
        cleaned[py, px] = alpha[py, px]

    for comp in comps[1:]:
        c_arr = np.array(comp)
        cy1, cy2 = c_arr[:, 0].min(), c_arr[:, 0].max()
        cx1, cx2 = c_arr[:, 1].min(), c_arr[:, 1].max()
        # Keep accessory components (gun tip, muzzle flash, fingers) if within 8px of main body
        if (main_min_y - 8 <= cy2 and cy1 <= main_max_y + 8 and
            main_min_x - 8 <= cx2 and cx1 <= main_max_x + 8):
            for py, px in comp:
                cleaned[py, px] = alpha[py, px]
    return cleaned

def clean_and_normalize(rgba, target_w=128, target_h=128, anchor_bottom_offset=14, is_enemy=False):
    alpha = rgba[:, :, 3]
    alpha = prune_disconnected_border_artifacts(alpha, min_size=35)
    if not is_enemy:
        alpha = clean_stray_islands(alpha)
    rgba[:, :, 3] = alpha

    fg_indices = np.argwhere(alpha > 0)
    if len(fg_indices) == 0:
        return Image.new('RGBA', (target_w, target_h), (0, 0, 0, 0))

    min_y, min_x = fg_indices.min(axis=0)
    max_y, max_x = fg_indices.max(axis=0)

    # For enemy bot, trim the 1-2px ground guideline mark if present
    if is_enemy:
        while max_y > min_y:
            row_alpha = alpha[max_y, :]
            row_rgb = rgba[max_y, :, :3]
            is_dark_line = np.sum((row_alpha > 0) & (np.all(row_rgb < 65, axis=1)))
            if is_dark_line > 25 and np.sum(row_alpha > 0) > 40 and max_y > fg_indices[:, 0].mean() + 40:
                max_y -= 1
            else:
                break

    while max_y > min_y and np.sum(alpha[max_y, :] > 0) <= 2:
        max_y -= 1

    cropped = rgba[min_y:max_y+1, min_x:max_x+1]
    ch, cw, _ = cropped.shape

    canvas = np.zeros((target_h, target_w, 4), dtype=np.uint8)

    dst_x = (target_w - cw) // 2
    dst_y = (target_h - anchor_bottom_offset) - ch

    src_y1 = max(0, -dst_y)
    dst_y = max(0, dst_y)
    src_y2 = min(ch, ch - (dst_y + ch - target_h)) if dst_y + ch > target_h else ch

    src_x1 = max(0, -dst_x)
    dst_x = max(0, dst_x)
    src_x2 = min(cw, cw - (dst_x + cw - target_w)) if dst_x + cw > target_w else cw

    canvas[dst_y:dst_y + (src_y2 - src_y1), dst_x:dst_x + (src_x2 - src_x1)] = cropped[src_y1:src_y2, src_x1:src_x2]
    return Image.fromarray(canvas, 'RGBA')

def process_marine(base_dir):
    marine_img = Image.open(os.path.join(base_dir, 'frames for main character (Marine).png'))
    arr = np.array(marine_img)
    bg = np.array([5, 23, 39])

    out_dir = os.path.join(base_dir, 'public', 'assets', 'sprites', 'marine')
    os.makedirs(out_dir, exist_ok=True)

    manifest = {'marine': {}}

    # Reference standing character height in run/punch frames is ~105px.
    # We proportionally scale idle frames from their oversized 125-129px to 105px so the
    # character has consistent visual size with zero shrinking/jittering when starting/stopping movement.
    singles = [
        ('idle_left', 55, 192, 20, 155),
        ('idle_right', 55, 192, 185, 325)
    ]
    target_standing_height = 105
    target_canvas_w = 128
    target_canvas_h = 128
    anchor_y = 114 # target_canvas_h - 14

    for anim_name, y1, y2, x1, x2 in singles:
        sub = arr[y1:y2, x1:x2]
        rgba = floodfill_transparent(sub, bg, tol=15)
        rgba[:, :, 3] = prune_disconnected_border_artifacts(rgba[:, :, 3], min_size=35)
        rgba[:, :, 3] = clean_stray_islands(rgba[:, :, 3])
        fg = np.argwhere(rgba[:, :, 3] > 0)
        min_y, min_x = fg.min(axis=0)
        max_y, max_x = fg.max(axis=0)
        cropped = rgba[min_y:max_y+1, min_x:max_x+1]
        raw_img = Image.fromarray(cropped, 'RGBA')

        # Proportionally scale idle frame to match 105px standing character height
        scale = target_standing_height / float(raw_img.height)
        scaled_w = int(round(raw_img.width * scale))
        scaled_img = raw_img.resize((scaled_w, target_standing_height), Image.Resampling.LANCZOS)

        canvas = Image.new('RGBA', (target_canvas_w, target_canvas_h), (0, 0, 0, 0))
        dst_x = (target_canvas_w - scaled_w) // 2
        dst_y = anchor_y - target_standing_height
        canvas.paste(scaled_img, (dst_x, dst_y))

        fname = f'{anim_name}_0.png'
        canvas.save(os.path.join(out_dir, fname))
        manifest['marine'][anim_name] = [fname]
        print(f'Processed Marine {anim_name}: scaled to {scaled_w}x{target_standing_height}, headroom={dst_y}px.')

    # Panels with safe crop bounds strictly inside the sheet's border divider lines:
    panels = [
        ('move_right', 55, 192, 350, 917, 200, 218),
        ('move_left', 55, 192, 938, 1515, 200, 218),
        ('jump', 273, 420, 13, 550, 424, 446),
        ('aim', 273, 420, 567, 1014, 424, 446),
        ('fire', 273, 420, 1029, 1522, 424, 446),
        ('crouch', 506, 644, 13, 696, 650, 672),
        ('punch', 506, 644, 712, 1521, 650, 672),
    ]

    # Monotonic aim & fire elevation ordering from steep up (-39 deg) to down (+33 deg):
    # Sheet indices: 2 (-39 deg), 4 (-30 deg), 5 (-25 deg), 7 (-20 deg), 3 (-12 deg), 6 (+4 deg horiz), 1 (+18 deg), 0 (+33 deg)
    aim_order = [2, 4, 5, 7, 3, 6, 1, 0]

    for anim_name, y1, y2, x1, x2, ny1, ny2 in panels:
        strip = arr[ny1:ny2, x1:x2]
        diff = np.max(np.abs(strip.astype(int) - bg), axis=2)
        fg = diff > 25
        col_sum = np.sum(fg, axis=0)
        clusters = []
        in_c = False
        s = 0
        for x in range(strip.shape[1]):
            if col_sum[x] > 2 and not in_c:
                in_c = True
                s = x
            elif col_sum[x] <= 2 and in_c:
                in_c = False
                clusters.append((s, x))
        if in_c:
            clusters.append((s, strip.shape[1]))

        valid = [c for c in clusters if 3 <= (c[1] - c[0]) <= 25]
        centers = [(c[0] + c[1]) / 2 for c in valid]
        w = x2 - x1
        if len(centers) < 8:
            centers = [(i + 0.5) * (w / 8) for i in range(8)]
        elif len(centers) > 8:
            centers = centers[:8]

        dividers = [0]
        for i in range(len(centers) - 1):
            dividers.append(int(round((centers[i] + centers[i+1]) / 2)))
        dividers.append(w)

        panel_sub = arr[y1:y2, x1:x2]
        raw_frames = []
        for fi in range(8):
            xs = dividers[fi]
            xe = dividers[fi+1]
            fsub = panel_sub[:, xs:xe]
            fsub_clean = fsub.copy()
            # Erase extreme 1px border slice if at outer ends of panel
            if fi == 0:
                fsub_clean[:, :1] = bg
            if fi == 7:
                fsub_clean[:, -1:] = bg
            rgba = floodfill_transparent(fsub_clean, bg, tol=15)
            raw_frames.append(rgba)

        frame_list = []
        for fi in range(8):
            src_idx = aim_order[fi] if (anim_name in ['aim', 'fire']) else fi
            rgba = raw_frames[src_idx]
            norm = clean_and_normalize(rgba, target_w=128, target_h=128, anchor_bottom_offset=14)
            fname = f'{anim_name}_{fi}.png'
            norm.save(os.path.join(out_dir, fname))
            frame_list.append(fname)
        manifest['marine'][anim_name] = frame_list
        print(f'Processed Marine {anim_name}: 8 frames saved cleanly.')

    # Idle default
    manifest['marine']['idle'] = manifest['marine']['idle_right']
    return manifest

def process_enemybot(base_dir, manifest):
    bot_img = Image.open(os.path.join(base_dir, 'enemybot1 (frames).png'))
    arr = np.array(bot_img)
    bg = np.array([120, 126, 111])

    out_dir = os.path.join(base_dir, 'public', 'assets', 'sprites', 'enemybot1')
    os.makedirs(out_dir, exist_ok=True)
    manifest['enemybot1'] = {}

    rows = [
        ('turn_left', 52, 212, 5),
        ('turn_right', 265, 425, 5),
        ('charge', 493, 638, 5),
        ('punch_left', 697, 830, 6),
        ('punch_right', 881, 1016, 6),
        ('walk', 1075, 1208, 8),
    ]

    for anim_name, y1, y2, n_frames in rows:
        sub = arr[y1:y2, :]
        diff = np.max(np.abs(sub.astype(int) - bg), axis=2)
        fg = diff > 20
        col_sum = np.sum(fg, axis=0)

        clusters = []
        in_c = False
        s = 0
        for x in range(sub.shape[1]):
            if col_sum[x] > 6 and not in_c:
                in_c = True
                s = x
            elif col_sum[x] <= 6 and in_c:
                in_c = False
                clusters.append((s, x))
        if in_c:
            clusters.append((s, sub.shape[1]))

        merged = []
        for c in clusters:
            if not merged:
                merged.append(list(c))
            else:
                if c[0] - merged[-1][1] <= 25:
                    merged[-1][1] = c[1]
                else:
                    merged.append(list(c))

        valid = [c for c in merged if c[1] - c[0] >= 30]
        if len(valid) != n_frames:
            w = sub.shape[1]
            valid = [[int(i * (w / n_frames)), int((i + 1) * (w / n_frames))] for i in range(n_frames)]

        frame_list = []
        for fi, (sx, ex) in enumerate(valid[:n_frames]):
            pad_s = max(0, sx - 4)
            pad_e = min(sub.shape[1], ex + 4)
            f_sub = sub[:, pad_s:pad_e]

            seeds = [(f_sub.shape[0] - 15, f_sub.shape[1] // 2)]
            rgba = floodfill_transparent(f_sub, bg, tol=15, extra_seeds=seeds)
            norm = clean_and_normalize(rgba, target_w=160, target_h=160, anchor_bottom_offset=14, is_enemy=True)
            fname = f'{anim_name}_{fi}.png'
            norm.save(os.path.join(out_dir, fname))
            frame_list.append(fname)

        manifest['enemybot1'][anim_name] = frame_list
        print(f'Processed Enemybot1 {anim_name}: {len(frame_list)} frames saved.')

    manifest['enemybot1']['idle'] = [manifest['enemybot1']['turn_left'][0]]
    return manifest

if __name__ == '__main__':
    base_dir = r'c:\Antigravity\Warhammer909'
    manifest = process_marine(base_dir)
    manifest = process_enemybot(base_dir, manifest)

    json_path = os.path.join(base_dir, 'public', 'assets', 'sprites', 'animations.json')
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)

    print('Extraction complete! Manifest written to:', json_path)
