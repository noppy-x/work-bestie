#!/usr/bin/env python3
"""Generate Work Bestie extension icons with purple-to-pink gradient and WB monogram."""

from PIL import Image, ImageDraw, ImageFont
import math
import os

def lerp_color(c1, c2, t):
    """Linear interpolate between two RGB colors."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def create_icon(size, output_path):
    """Create a rounded-square icon with gradient background and WB text."""
    # Create image with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Colors
    purple = (139, 92, 246)   # #8B5CF6
    mid = (168, 85, 247)      # #A855F7
    pink = (236, 72, 153)     # #EC4899

    # Draw rounded rectangle with gradient
    corner_radius = int(size * 0.22)
    padding = max(1, int(size * 0.03))

    # Create gradient background pixel by pixel on a temp image
    bg = Image.new('RGB', (size, size), purple)
    bg_pixels = bg.load()

    for y in range(size):
        for x in range(size):
            # Diagonal gradient (top-left to bottom-right)
            t = (x + y) / (2 * size)
            if t < 0.5:
                color = lerp_color(purple, mid, t * 2)
            else:
                color = lerp_color(mid, pink, (t - 0.5) * 2)
            bg_pixels[x, y] = color

    # Create rounded rectangle mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle(
        [padding, padding, size - padding - 1, size - padding - 1],
        radius=corner_radius,
        fill=255
    )

    # Apply mask to gradient
    img.paste(bg, (0, 0), mask)

    # Add subtle shine (lighter top-left area)
    shine = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    shine_draw = ImageDraw.Draw(shine)
    for y in range(size // 2):
        for x in range(size // 2):
            dist = math.sqrt(x**2 + y**2) / (size * 0.7)
            if dist < 1.0:
                alpha = int(40 * (1 - dist))
                shine.putpixel((x, y), (255, 255, 255, alpha))
    img = Image.alpha_composite(img, shine)

    # Draw "WB" text
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.38)

    # Try to use a bold font
    font = None
    bold_fonts = [
        '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
        '/System/Library/Fonts/Supplemental/Helvetica Bold.ttf',
        '/System/Library/Fonts/Supplemental/Impact.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/TTF/DejaVuSans-Bold.ttf',
    ]
    for font_path in bold_fonts:
        if os.path.exists(font_path):
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except Exception:
                continue

    if font is None:
        font = ImageFont.load_default(size=font_size)

    text = "WB"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (size - text_w) // 2
    text_y = (size - text_h) // 2 - int(size * 0.02)

    # Draw text with slight shadow
    if size >= 48:
        shadow_offset = max(1, size // 64)
        draw.text((text_x + shadow_offset, text_y + shadow_offset), text,
                  fill=(0, 0, 0, 60), font=font)

    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)

    # Add sparkle for larger sizes
    if size >= 48:
        sparkle_size = max(2, size // 16)
        sx, sy = int(size * 0.78), int(size * 0.18)
        # Draw a 4-point star
        draw.line([(sx, sy - sparkle_size), (sx, sy + sparkle_size)],
                  fill=(253, 230, 138, 220), width=max(1, sparkle_size // 3))
        draw.line([(sx - sparkle_size, sy), (sx + sparkle_size, sy)],
                  fill=(253, 230, 138, 220), width=max(1, sparkle_size // 3))

    # Convert to RGB for PNG (no transparency needed for extension icons)
    final = Image.new('RGB', (size, size), (255, 255, 255))
    final.paste(img, (0, 0), img)

    final.save(output_path, 'PNG')
    print(f"Created {output_path} ({size}x{size})")

if __name__ == '__main__':
    icons_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    create_icon(16, os.path.join(icons_dir, 'icon16.png'))
    create_icon(48, os.path.join(icons_dir, 'icon48.png'))
    create_icon(128, os.path.join(icons_dir, 'icon128.png'))
    print("Done! All icons generated.")
