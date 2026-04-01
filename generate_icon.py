#!/usr/bin/env python3
"""Generate the TimeZap app icon (1024x1024 PNG)."""
import math
from PIL import Image, ImageDraw

SIZE = 1024
CORNER_RADIUS = 220

# Colors
BG_TOP    = (15,  23,  42)   # slate-900
BG_BOTTOM = (30,  41,  59)   # slate-800
RING_COLOR = (56, 189, 248)  # sky-400
HAND_COLOR = (248, 250, 252) # white
ZAP_COLOR  = (250, 204,  21) # yellow-400
SHADOW     = (0,   0,   0, 80)

def rounded_rect_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask

def draw_icon():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # --- Gradient background (simulated with a vertical linear blend) ---
    bg = Image.new("RGBA", (SIZE, SIZE))
    for y in range(SIZE):
        t = y / SIZE
        r = int(BG_TOP[0] + t * (BG_BOTTOM[0] - BG_TOP[0]))
        g = int(BG_TOP[1] + t * (BG_BOTTOM[1] - BG_TOP[1]))
        b = int(BG_TOP[2] + t * (BG_BOTTOM[2] - BG_TOP[2]))
        for x in range(SIZE):
            bg.putpixel((x, y), (r, g, b, 255))
    mask = rounded_rect_mask(SIZE, CORNER_RADIUS)
    img.paste(bg, (0, 0), mask)

    draw = ImageDraw.Draw(img)

    cx, cy = SIZE // 2, SIZE // 2

    # --- Outer glow ring (clock face) ---
    ring_r = 340
    glow_width = 28
    # Glow layers (decreasing opacity)
    for i in range(6, 0, -1):
        alpha = int(30 * i)
        color = (*RING_COLOR, alpha)
        offset = i * 4
        draw.ellipse(
            [cx - ring_r - offset, cy - ring_r - offset,
             cx + ring_r + offset, cy + ring_r + offset],
            outline=color, width=3
        )
    # Main ring
    draw.ellipse(
        [cx - ring_r, cy - ring_r, cx + ring_r, cy + ring_r],
        outline=(*RING_COLOR, 230), width=glow_width
    )

    # --- Hour tick marks ---
    for hour in range(12):
        angle = math.radians(hour * 30 - 90)
        is_cardinal = (hour % 3 == 0)
        tick_len = 48 if is_cardinal else 28
        tick_w   = 14 if is_cardinal else 8
        outer_r = ring_r - glow_width // 2 - 4
        inner_r = outer_r - tick_len
        x1 = cx + math.cos(angle) * outer_r
        y1 = cy + math.sin(angle) * outer_r
        x2 = cx + math.cos(angle) * inner_r
        y2 = cy + math.sin(angle) * inner_r
        alpha = 220 if is_cardinal else 140
        draw.line([(x1, y1), (x2, y2)], fill=(*HAND_COLOR, alpha), width=tick_w)

    # --- Clock hands (showing ~10:10 — classic watch pose) ---
    # Hour hand  (pointing ~10)
    hour_angle  = math.radians(300 - 90)   # 300° = 10 o'clock
    hour_len    = 190
    draw.line(
        [(cx, cy),
         (cx + math.cos(hour_angle) * hour_len,
          cy + math.sin(hour_angle) * hour_len)],
        fill=(*HAND_COLOR, 255), width=28
    )
    # Minute hand (pointing ~2)
    min_angle = math.radians(60 - 90)   # 60° = 2 o'clock
    min_len   = 265
    draw.line(
        [(cx, cy),
         (cx + math.cos(min_angle) * min_len,
          cy + math.sin(min_angle) * min_len)],
        fill=(*HAND_COLOR, 255), width=20
    )

    # Center dot
    dot_r = 26
    draw.ellipse(
        [cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r],
        fill=(*RING_COLOR, 255)
    )

    # --- Lightning bolt (bottom-right quadrant) ---
    # Classic ⚡ shape: top-right to bottom-left diagonal with notch
    bolt_ox, bolt_oy = cx + 215, cy + 155
    s = 3.4   # scale
    #  Outline of a proper zig-zag lightning bolt (tip up, tip down)
    bolt_points = [
        (bolt_ox + s * 14,   bolt_oy + s * -46),   # top-right of upper body
        (bolt_ox + s * -2,   bolt_oy + s * 2),      # inner notch right
        (bolt_ox + s * 14,   bolt_oy + s * 2),      # notch outer right
        (bolt_ox + s * -14,  bolt_oy + s * 46),     # bottom tip
        (bolt_ox + s * 2,    bolt_oy + s * -2),     # inner notch left
        (bolt_ox + s * -14,  bolt_oy + s * -2),     # notch outer left
    ]
    shadow_pts = [(x + 5, y + 5) for x, y in bolt_points]
    draw.polygon(shadow_pts, fill=(0, 0, 0, 80))
    draw.polygon(bolt_points, fill=(*ZAP_COLOR, 255))
    draw.polygon(bolt_points, outline=(*HAND_COLOR, 60), width=3)

    return img


def main():
    img = draw_icon()
    out_path = "resources/icon.png"
    img.save(out_path, "PNG")
    print(f"Saved {out_path}")

if __name__ == "__main__":
    main()
