#!/usr/bin/env python3
"""Create LibCheck feature graphic for Google Play Store (1024x500px)."""

import math
from PIL import Image, ImageDraw, ImageFont

CANVAS_FONTS = "/Users/satoutatsuya/.claude/plugins/cache/anthropic-agent-skills/document-skills/1ed29a03dc85/skills/canvas-design/canvas-fonts"

# Colors
TEAL_DEEP    = (0,   93,  82)   # #005D52 — darkest anchor
TEAL_MID     = (0,  121, 107)   # #00796B — brand color
TEAL_LIGHT   = (0,  150, 136)   # #009688 — accent layer
TEAL_BRIGHT  = (38, 198, 179)   # #26C6B3 — highlight
IVORY        = (240, 240, 230)  # warm white for text
GOLD         = (220, 185, 100)  # warm accent
GOLD_DIM     = (180, 145,  70)

W, H = 1024, 500

img = Image.new("RGB", (W, H), TEAL_MID)
draw = ImageDraw.Draw(img)

# ── Background gradient layers (horizontal bands) ──────────────────────────
for y in range(H):
    t = y / H
    r = int(TEAL_DEEP[0] * (1 - t) + TEAL_LIGHT[0] * t)
    g = int(TEAL_DEEP[1] * (1 - t) + TEAL_LIGHT[1] * t)
    b = int(TEAL_DEEP[2] * (1 - t) + TEAL_LIGHT[2] * t)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# ── Subtle grid cartography lines ──────────────────────────────────────────
GRID_COLOR = (255, 255, 255, 18)
grid_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
grid_draw = ImageDraw.Draw(grid_img)

step = 40
for x in range(0, W + 1, step):
    grid_draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 12), width=1)
for y in range(0, H + 1, step):
    grid_draw.line([(0, y), (W, y)], fill=(255, 255, 255, 12), width=1)

img = Image.alpha_composite(img.convert("RGBA"), grid_img).convert("RGB")
draw = ImageDraw.Draw(img)

# ── Abstract book stack — left side sculpture ───────────────────────────────
# A cluster of geometric book-spine rectangles, slightly rotated, left quadrant
book_data = [
    # (x, y, w, h, angle, fill)
    (90,  160, 18, 190,  2,  (0, 90, 80)),
    (112, 150, 22, 200,  0,  (0, 105, 92)),
    (138, 155, 16, 195, -1,  (0, 80, 70)),
    (158, 148, 26, 205,  1,  (0, 115, 100)),
    (188, 158, 14, 188, -2,  (0, 95, 85)),
    (206, 153, 20, 198,  0,  (0, 110, 95)),
    (230, 160, 12, 182,  1,  (0, 85, 76)),
]

# Draw book spines as thin rectangles with slight tilt
for bx, by, bw, bh, angle, col in book_data:
    # Create a small image for each spine
    spine = Image.new("RGBA", (bw, bh), col + (200,))
    spine_draw = ImageDraw.Draw(spine)
    # Add a subtle highlight on the left edge
    spine_draw.line([(0, 0), (0, bh)], fill=(255, 255, 255, 60), width=1)
    # Add a subtle shadow on the right
    spine_draw.line([(bw - 1, 0), (bw - 1, bh)], fill=(0, 0, 0, 40), width=1)
    rotated = spine.rotate(angle, expand=True)
    rx = bx - rotated.width // 2
    ry = by - rotated.height // 2
    img.paste(rotated, (rx, ry), rotated)

draw = ImageDraw.Draw(img)

# Top shelf line above books
draw.line([(70, 148), (260, 148)], fill=GOLD_DIM, width=2)
# Bottom shelf line below books
draw.line([(70, 355), (260, 355)], fill=GOLD_DIM, width=2)

# ── Compass/circle motif — right quadrant ───────────────────────────────────
cx, cy = 820, 250
# Outer ring
for i in range(3):
    r_out = 145 - i * 28
    draw.ellipse(
        [(cx - r_out, cy - r_out), (cx + r_out, cy + r_out)],
        outline=(255, 255, 255, 0),
        width=0
    )

# Use overlay for rings
ring_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ring_draw = ImageDraw.Draw(ring_img)
for i, alpha in zip(range(3), [35, 25, 18]):
    r_ring = 145 - i * 28
    ring_draw.ellipse(
        [(cx - r_ring, cy - r_ring), (cx + r_ring, cy + r_ring)],
        outline=(255, 255, 255, alpha),
        width=1,
    )
img = Image.alpha_composite(img.convert("RGBA"), ring_img).convert("RGB")
draw = ImageDraw.Draw(img)

# Compass tick marks
for deg in range(0, 360, 15):
    rad = math.radians(deg)
    major = deg % 90 == 0
    r_inner = 120 if major else 128
    r_outer = 145
    x1 = cx + r_inner * math.cos(rad)
    y1 = cy + r_inner * math.sin(rad)
    x2 = cx + r_outer * math.cos(rad)
    y2 = cy + r_outer * math.sin(rad)
    alpha = 80 if major else 40
    tick_img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    tick_draw = ImageDraw.Draw(tick_img)
    tick_draw.line([(x1, y1), (x2, y2)], fill=(255, 255, 255, alpha), width=2 if major else 1)
    img = Image.alpha_composite(img.convert("RGBA"), tick_img).convert("RGB")

draw = ImageDraw.Draw(img)

# Inner open-book icon (simple geometric form at center of compass)
bk_cx, bk_cy = cx, cy
bk_w, bk_h = 56, 44
# Left page
lpts = [
    (bk_cx - bk_w // 2, bk_cy - bk_h // 2),
    (bk_cx,              bk_cy - bk_h // 2 + 6),
    (bk_cx,              bk_cy + bk_h // 2 - 6),
    (bk_cx - bk_w // 2, bk_cy + bk_h // 2),
]
# Right page
rpts = [
    (bk_cx,              bk_cy - bk_h // 2 + 6),
    (bk_cx + bk_w // 2, bk_cy - bk_h // 2),
    (bk_cx + bk_w // 2, bk_cy + bk_h // 2),
    (bk_cx,              bk_cy + bk_h // 2 - 6),
]
book_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
book_draw = ImageDraw.Draw(book_overlay)
book_draw.polygon(lpts, fill=(255, 255, 255, 50), outline=(255, 255, 255, 130))
book_draw.polygon(rpts, fill=(255, 255, 255, 40), outline=(255, 255, 255, 130))
# Spine line
book_draw.line([(bk_cx, bk_cy - bk_h // 2 + 6), (bk_cx, bk_cy + bk_h // 2 - 6)],
               fill=(255, 255, 255, 180), width=2)
img = Image.alpha_composite(img.convert("RGBA"), book_overlay).convert("RGB")
draw = ImageDraw.Draw(img)

# ── Diagonal divider accent line ─────────────────────────────────────────────
div_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
div_draw = ImageDraw.Draw(div_overlay)
div_draw.line([(300, 0), (340, H)], fill=(255, 255, 255, 20), width=1)
img = Image.alpha_composite(img.convert("RGBA"), div_overlay).convert("RGB")
draw = ImageDraw.Draw(img)

# ── Typography ────────────────────────────────────────────────────────────────
FONT_DIR = CANVAS_FONTS
JA_FONT_PATH = "/Users/satoutatsuya/Library/Fonts/NotoSansJP[wght].ttf"

try:
    font_main = ImageFont.truetype(f"{FONT_DIR}/BricolageGrotesque-Bold.ttf", 96)
    font_sub  = ImageFont.truetype(f"{FONT_DIR}/InstrumentSans-Regular.ttf", 22)
    font_tag  = ImageFont.truetype(JA_FONT_PATH, 28)
    font_tiny = ImageFont.truetype(f"{FONT_DIR}/Jura-Light.ttf", 13)
except Exception as e:
    print(f"Font error: {e}")
    font_main = ImageFont.load_default()
    font_sub  = font_main
    font_tag  = font_main
    font_tiny = font_main

# Center zone for text  — between books (left) and compass (right)
TEXT_X = 370
TEXT_CENTER = 530  # midpoint of center zone

# App name "LibCheck"
app_name = "LibCheck"
bb = draw.textbbox((0, 0), app_name, font=font_main)
tw = bb[2] - bb[0]
tx = TEXT_CENTER - tw // 2
ty = 145

# Subtle shadow
draw.text((tx + 3, ty + 3), app_name, font=font_main, fill=(0, 50, 45))
# Main text
draw.text((tx, ty), app_name, font=font_main, fill=IVORY)

# Gold underline accent
ul_y = ty + (bb[3] - bb[1]) + 10
ul_margin = 30
draw.line([(tx + ul_margin, ul_y), (tx + tw - ul_margin, ul_y)], fill=GOLD, width=2)

# Japanese tagline
tagline = "図書館の蔵書をかんたん検索"
bb2 = draw.textbbox((0, 0), tagline, font=font_tag)
tw2 = bb2[2] - bb2[0]
tx2 = TEXT_CENTER - tw2 // 2
ty2 = ul_y + 22
draw.text((tx2, ty2), tagline, font=font_tag, fill=(210, 235, 230))

# Subtle descriptor
descriptor = "Scan · Search · Discover"
bb3 = draw.textbbox((0, 0), descriptor, font=font_sub)
tw3 = bb3[2] - bb3[0]
tx3 = TEXT_CENTER - tw3 // 2
ty3 = ty2 + 60
draw.text((tx3, ty3), descriptor, font=font_sub, fill=(160, 210, 200))

# ── Corner cartography marks ──────────────────────────────────────────────────
corner_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
corner_draw = ImageDraw.Draw(corner_overlay)
margin = 20
arm = 16
alpha_c = 50
for (ox, oy), (dx, dy) in [
    ((margin, margin),         (1, 1)),
    ((W - margin, margin),     (-1, 1)),
    ((margin, H - margin),     (1, -1)),
    ((W - margin, H - margin), (-1, -1)),
]:
    corner_draw.line([(ox, oy), (ox + arm * dx, oy)],       fill=(255, 255, 255, alpha_c), width=1)
    corner_draw.line([(ox, oy), (ox, oy + arm * dy)],       fill=(255, 255, 255, alpha_c), width=1)
img = Image.alpha_composite(img.convert("RGBA"), corner_overlay).convert("RGB")
draw = ImageDraw.Draw(img)

# ── Fine metadata label (bottom) ─────────────────────────────────────────────
label = "LIBRARY DISCOVERY  ·  BARCODE & ISBN  ·  日本語対応"
bb4 = draw.textbbox((0, 0), label, font=font_tiny)
tw4 = bb4[2] - bb4[0]
draw.text(((W - tw4) // 2, H - 30), label, font=font_tiny, fill=(140, 190, 180))

# ── Save ──────────────────────────────────────────────────────────────────────
out_path = "/Users/satoutatsuya/Projects/private/libcheck/screenshots/feature_graphic.png"
img.save(out_path, "PNG", optimize=True)
print(f"Saved: {out_path}  ({W}x{H}px)")
