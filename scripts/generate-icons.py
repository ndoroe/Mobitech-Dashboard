#!/usr/bin/env python3
"""Generate favicon.ico, logo192.png, and logo512.png from a SIM card SVG icon."""

import cairosvg
from PIL import Image
import io
import os

# A compact SIM card icon optimized for small sizes (favicon)
ICON_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1976d2"/>
      <stop offset="100%" stop-color="#0d47a1"/>
    </linearGradient>
    <linearGradient id="chip" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5e6a3"/>
      <stop offset="40%" stop-color="#ffd700"/>
      <stop offset="100%" stop-color="#b8860b"/>
    </linearGradient>
    <linearGradient id="contact" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e6c84d"/>
      <stop offset="100%" stop-color="#a67c00"/>
    </linearGradient>
  </defs>

  <!-- Rounded square background -->
  <rect x="2" y="2" width="60" height="60" rx="12" ry="12" fill="url(#bg)"/>

  <!-- SIM card shape (white outline, corner cut) -->
  <path d="M16,10 L40,10 L52,22 L52,54 Q52,56 50,56 L16,56 Q14,56 14,54 L14,12 Q14,10 16,10 Z"
    fill="white" fill-opacity="0.15" stroke="white" stroke-width="1.5" stroke-opacity="0.6"/>

  <!-- Corner cut line -->
  <path d="M40,10 L40,22 L52,22" fill="none" stroke="white" stroke-width="1" stroke-opacity="0.4"/>

  <!-- Chip body -->
  <rect x="22" y="28" width="22" height="16" rx="3" ry="3" fill="url(#chip)" stroke="#b8860b" stroke-width="0.8"/>

  <!-- Chip contact pads -->
  <rect x="24" y="30" width="6" height="4.5" rx="1" fill="url(#contact)" stroke="#9a7b0a" stroke-width="0.4"/>
  <rect x="24" y="37" width="6" height="4.5" rx="1" fill="url(#contact)" stroke="#9a7b0a" stroke-width="0.4"/>
  <rect x="31" y="30" width="4" height="4.5" rx="1" fill="url(#contact)" stroke="#9a7b0a" stroke-width="0.4"/>
  <rect x="31" y="37" width="4" height="4.5" rx="1" fill="url(#contact)" stroke="#9a7b0a" stroke-width="0.4"/>
  <rect x="36" y="30" width="6" height="4.5" rx="1" fill="url(#contact)" stroke="#9a7b0a" stroke-width="0.4"/>
  <rect x="36" y="37" width="6" height="4.5" rx="1" fill="url(#contact)" stroke="#9a7b0a" stroke-width="0.4"/>

  <!-- Chip cross lines -->
  <line x1="24" y1="35.5" x2="42" y2="35.5" stroke="#9a7b0a" stroke-width="0.8"/>
  <line x1="33" y1="30" x2="33" y2="42" stroke="#9a7b0a" stroke-width="0.8"/>
</svg>'''

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public')

def generate():
    # Generate high-res PNG first (512px)
    png_512 = cairosvg.svg2png(bytestring=ICON_SVG.encode(), output_width=512, output_height=512)
    img_512 = Image.open(io.BytesIO(png_512)).convert('RGBA')
    img_512.save(os.path.join(PUBLIC_DIR, 'logo512.png'), 'PNG')
    print('✓ logo512.png generated')

    # 192px
    img_192 = img_512.resize((192, 192), Image.LANCZOS)
    img_192.save(os.path.join(PUBLIC_DIR, 'logo192.png'), 'PNG')
    print('✓ logo192.png generated')

    # favicon.ico (multi-size: 16, 24, 32, 48, 64)
    sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)]
    ico_images = [img_512.resize(s, Image.LANCZOS) for s in sizes]
    ico_images[0].save(
        os.path.join(PUBLIC_DIR, 'favicon.ico'),
        format='ICO',
        sizes=sizes,
        append_images=ico_images[1:]
    )
    print('✓ favicon.ico generated')

    print(f'\nAll icons saved to {PUBLIC_DIR}')

if __name__ == '__main__':
    generate()
