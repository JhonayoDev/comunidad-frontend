#!/usr/bin/env python3
"""
Generador completo de activos PWA para briku:
- Iconos de App (incluyendo 180x180 para iOS)
- Splash Screens exactas para iOS / iPhone
"""

import os
from PIL import Image, ImageDraw

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_DIR = os.path.join(BASE_DIR, "public", "icons")
SPLASH_DIR = os.path.join(BASE_DIR, "public", "splash")

COLOR_PRIMARY = "#003366"  # Azul briku
COLOR_BG_LIGHT = "#F4F4F7"  # Fondo claro briku
COLOR_WHITE = "#ffffff"

# 1. Configuración de Iconos
ICON_CONFIGS = [
    {"name": "icon-72x72.png", "size": 72},
    {"name": "icon-96x96.png", "size": 96},
    {"name": "icon-128x128.png", "size": 128},
    {"name": "icon-144x144.png", "size": 144},
    {"name": "icon-152x152.png", "size": 152},
    {"name": "icon-180x180.png", "size": 180},  # Requerido por iOS apple-touch-icon
    {"name": "icon-192x192.png", "size": 192},
    {"name": "icon-384x384.png", "size": 384},
    {"name": "icon-512x512.png", "size": 512},
]

# 2. resoluciones exactas para Splash Screens de iOS
SPLASH_CONFIGS = [
    {
        "name": "splash-1290x2796.png",
        "w": 1290,
        "h": 2796,
    },  # iPhone 16 Pro Max, 15 Pro Max, 14 Pro Max
    {
        "name": "splash-1179x2556.png",
        "w": 1179,
        "h": 2556,
    },  # iPhone 16 Pro, 15 Pro, 15, 14 Pro
    {
        "name": "splash-1170x2532.png",
        "w": 1170,
        "h": 2532,
    },  # iPhone 14, 13, 13 Pro, 12, 12 Pro
    {"name": "splash-1242x2688.png", "w": 1242, "h": 2688},  # iPhone XS Max, 11 Pro Max
    {"name": "splash-1125x2436.png", "w": 1125, "h": 2436},  # iPhone X, XS, 11 Pro
    {"name": "splash-828x1792.png", "w": 828, "h": 1792},  # iPhone XR, 11
    {
        "name": "splash-750x1334.png",
        "w": 750,
        "h": 1334,
    },  # iPhone 8, 7, SE (2da/3ra gen)
    {"name": "splash-2048x2732.png", "w": 2048, "h": 2732},  # iPad Pro 12.9"
]


def draw_rounded_rect(draw, bbox, radius, fill):
    x0, y0, x1, y1 = bbox
    r = min(radius, (x1 - x0) // 2, (y1 - y0) // 2)
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * r, y0 + 2 * r], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * r, y0, x1, y0 + 2 * r], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * r, x0 + 2 * r, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * r, y1 - 2 * r, x1, y1], 0, 90, fill=fill)


def render_option_b_logo(draw, offset_x, offset_y, size, fg_color, bg_color):
    """Renderiza el isotipo 'b' modular escalado."""
    pad = int(size * 0.15)
    w = size - 2 * pad

    stem_w = int(w * 0.22)
    r = int(stem_w * 0.4)

    # Tallo vertical
    x_stem = offset_x + pad + int(w * 0.1)
    y_stem_top = offset_y + pad + int(w * 0.1)
    draw_rounded_rect(
        draw,
        [x_stem, y_stem_top, x_stem + stem_w, y_stem_top + int(w * 0.8)],
        r,
        fg_color,
    )

    # Bucle circular
    loop_bbox = [
        offset_x + pad + int(w * 0.22),
        offset_y + pad + int(w * 0.42),
        offset_x + pad + int(w * 0.9),
        offset_y + pad + int(w * 0.9),
    ]
    draw_rounded_rect(draw, loop_bbox, int(w * 0.24), fg_color)

    # Hueco interior
    inner_pad = int(w * 0.18)
    inner_bbox = [
        loop_bbox[0] + inner_pad,
        loop_bbox[1] + inner_pad,
        loop_bbox[2] - inner_pad,
        loop_bbox[3] - inner_pad,
    ]
    draw_rounded_rect(draw, inner_bbox, int(w * 0.1), bg_color)


def generate_icons():
    os.makedirs(ICON_DIR, exist_ok=True)
    print("📱 Generando íconos de la app...")
    for cfg in ICON_CONFIGS:
        size = cfg["size"]
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Fondo contenedor del icono
        radius = int(size * 0.22)
        draw_rounded_rect(draw, [0, 0, size, size], radius, COLOR_PRIMARY)

        # Isotipo 'b' en blanco
        render_option_b_logo(draw, 0, 0, size, COLOR_WHITE, COLOR_PRIMARY)

        img.save(os.path.join(ICON_DIR, cfg["name"]), "PNG")
        print(f"  ✓ {cfg['name']}")


def generate_splash_screens():
    os.makedirs(SPLASH_DIR, exist_ok=True)
    print("\n🌅 Generando Splash Screens para iOS...")
    for cfg in SPLASH_CONFIGS:
        w, h = cfg["w"], cfg["h"]
        img = Image.new("RGB", (w, h), COLOR_BG_LIGHT)
        draw = ImageDraw.Draw(img)

        # Tamaño del logo central en el splash screen (proporcional a la pantalla)
        logo_size = int(min(w, h) * 0.35)
        offset_x = (w - logo_size) // 2
        offset_y = (h - logo_size) // 2

        # Tarjeta contenedora azul del logo
        card_radius = int(logo_size * 0.22)
        draw_rounded_rect(
            draw,
            [offset_x, offset_y, offset_x + logo_size, offset_y + logo_size],
            card_radius,
            COLOR_PRIMARY,
        )

        # Isotipo 'b'
        render_option_b_logo(
            draw, offset_x, offset_y, logo_size, COLOR_WHITE, COLOR_PRIMARY
        )

        img.save(os.path.join(SPLASH_DIR, cfg["name"]), "PNG")
        print(f"  ✓ {cfg['name']} ({w}x{h} px)")


if __name__ == "__main__":
    generate_icons()
    generate_splash_screens()
    print("\n✅ ¡Todos los activos generados correctamente!")
