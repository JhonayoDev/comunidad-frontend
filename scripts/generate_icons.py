#!/usr/bin/env python3
"""
Generador de íconos de producción / prototipo para la PWA de briku.
Soporta 4 diseños de marca basados en la paleta azul institucional.
"""

import os
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public",
    "icons",
)

# Cambia esta variable para probar las distintas opciones ("A", "B", "C", "D")
SELECTED_OPTION = "B"

ICON_CONFIGS = [
    {"name": "icon-72x72.png", "size": 72},
    {"name": "icon-96x96.png", "size": 96},
    {"name": "icon-128x128.png", "size": 128},
    {"name": "icon-144x144.png", "size": 144},
    {"name": "icon-152x152.png", "size": 152},
    {"name": "icon-192x192.png", "size": 192},
    {"name": "icon-384x384.png", "size": 384},
    {"name": "icon-512x512.png", "size": 512},
    {"name": "badge-72x72.png", "size": 72, "mono": True},
]

# Tokens de color exactos de briku
COLOR_BG_LIGHT = "#F4F4F7"
COLOR_PRIMARY = "#003366"  # brand.DEFAULT
COLOR_MEDIUM = "#265e95"  # brand.hover
COLOR_LIGHT = "#4d8fce"  # brand.scale.400
COLOR_SOFT = "#b0cfef"  # brand.borderSecondary
COLOR_WHITE = "#ffffff"


def draw_rounded_rect(draw, bbox, radius, fill):
    """Dibuja un rectángulo redondeado compatible con versiones antiguas de Pillow."""
    x0, y0, x1, y1 = bbox
    r = min(radius, (x1 - x0) // 2, (y1 - y0) // 2)
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
    draw.pieslice([x0, y0, x0 + 2 * r, y0 + 2 * r], 180, 270, fill=fill)
    draw.pieslice([x1 - 2 * r, y0, x1, y0 + 2 * r], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2 * r, x0 + 2 * r, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2 * r, y1 - 2 * r, x1, y1], 0, 90, fill=fill)


def render_logo_design(draw, size, option, is_mono):
    """Renderiza el Isotipo seleccionado escalado proporcionalmente."""
    bg_main = COLOR_WHITE if is_mono else COLOR_PRIMARY
    fg_main = COLOR_WHITE if (is_mono or option == "B") else COLOR_LIGHT

    pad = int(size * 0.15)
    w = size - 2 * pad

    if option == "A":
        # Opción A: Bloques Conectados / Estructura
        b_w, b_h = int(w * 0.42), int(w * 0.42)
        r = int(b_w * 0.25)
        # Bloque 1 (Izquierda Arriba)
        draw_rounded_rect(
            draw,
            [pad, pad, pad + b_w, pad + b_h],
            r,
            COLOR_LIGHT if not is_mono else COLOR_WHITE,
        )
        # Bloque 2 (Derecha Arriba)
        draw_rounded_rect(
            draw,
            [pad + int(w * 0.58), pad, pad + w, pad + b_h],
            r,
            COLOR_MEDIUM if not is_mono else COLOR_WHITE,
        )
        # Bloque Base (Ladrillo Ancho abajo)
        draw_rounded_rect(
            draw,
            [pad, pad + int(w * 0.52), pad + w, pad + w],
            r,
            COLOR_PRIMARY if not is_mono else COLOR_WHITE,
        )

    elif option == "B":
        # Opción B: Letra 'b' Modular (Minimalista)
        stem_w = int(w * 0.22)
        r = int(stem_w * 0.4)
        # Tallo vertical
        draw_rounded_rect(
            draw,
            [
                pad + int(w * 0.1),
                pad + int(w * 0.1),
                pad + int(w * 0.1) + stem_w,
                pad + int(w * 0.9),
            ],
            r,
            fg_main,
        )
        # Bucle circular de la 'b'
        loop_bbox = [
            pad + int(w * 0.22),
            pad + int(w * 0.42),
            pad + int(w * 0.9),
            pad + int(w * 0.9),
        ]
        draw_rounded_rect(draw, loop_bbox, int(w * 0.24), fg_main)
        # Hueco interior
        inner_pad = int(w * 0.18)
        inner_bbox = [
            loop_bbox[0] + inner_pad,
            loop_bbox[1] + inner_pad,
            loop_bbox[2] - inner_pad,
            loop_bbox[3] - inner_pad,
        ]
        draw_rounded_rect(draw, inner_bbox, int(w * 0.1), bg_main)

    elif option == "C":
        # Opción C: Ladrillos Apilados (Ascenso)
        h_brick = int(w * 0.24)
        gap = int(w * 0.08)
        r = int(h_brick * 0.3)
        # Ladrillo 1 (Abajo)
        y3 = pad + w
        draw_rounded_rect(
            draw,
            [pad, y3 - h_brick, pad + w, y3],
            r,
            COLOR_PRIMARY if not is_mono else COLOR_WHITE,
        )
        # Ladrillo 2 (Centro)
        y2 = y3 - h_brick - gap
        draw_rounded_rect(
            draw,
            [pad + int(w * 0.15), y2 - h_brick, pad + w, y2],
            r,
            COLOR_MEDIUM if not is_mono else COLOR_WHITE,
        )
        # Ladrillo 3 (Arriba)
        y1 = y2 - h_brick - gap
        draw_rounded_rect(
            draw,
            [pad + int(w * 0.35), y1 - h_brick, pad + w, y1],
            r,
            COLOR_LIGHT if not is_mono else COLOR_WHITE,
        )

    elif option == "D":
        # Opción D: Techo / Hogar + Ladrillos
        # Techo (Triángulo / Chevron)
        top_y = pad + int(w * 0.1)
        mid_x = size // 2
        roof = [
            (mid_x, top_y),
            (pad, pad + int(w * 0.45)),
            (pad + int(w * 0.18), pad + int(w * 0.45)),
            (mid_x, top_y + int(w * 0.18)),
            (pad + w - int(w * 0.18), pad + int(w * 0.45)),
            (pad + w, pad + int(w * 0.45)),
        ]
        draw.polygon(roof, fill=COLOR_LIGHT if not is_mono else COLOR_WHITE)
        # Base de bloques
        b_h = int(w * 0.35)
        r = int(b_h * 0.2)
        draw_rounded_rect(
            draw,
            [pad, pad + int(w * 0.52), pad + int(w * 0.46), pad + int(w * 0.52) + b_h],
            r,
            COLOR_MEDIUM if not is_mono else COLOR_WHITE,
        )
        draw_rounded_rect(
            draw,
            [
                pad + int(w * 0.54),
                pad + int(w * 0.52),
                pad + w,
                pad + int(w * 0.52) + b_h,
            ],
            r,
            COLOR_PRIMARY if not is_mono else COLOR_WHITE,
        )


def generate_icon(cfg):
    size = cfg["size"]
    is_mono = cfg.get("mono", False)

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fondo redondeado de la app
    margin = 0 if is_mono else int(size * 0.02)
    radius = int(size * 0.22)
    bg_color = COLOR_PRIMARY if not is_mono else COLOR_PRIMARY

    draw_rounded_rect(
        draw, [margin, margin, size - margin, size - margin], radius, bg_color
    )

    # Renderizar el isotipo dentro del contenedor
    render_logo_design(draw, size, SELECTED_OPTION, is_mono)
    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(
        f"🚀 Generando íconos para 'briku' (Opción {SELECTED_OPTION}) en: {OUTPUT_DIR}\n"
    )

    for cfg in ICON_CONFIGS:
        path = os.path.join(OUTPUT_DIR, cfg["name"])
        img = generate_icon(cfg)
        img.save(path, "PNG")
        print(f"  ✓ {cfg['name']:22s}  {cfg['size']}×{cfg['size']} px")

    print(f"\n✅ Íconos de la Opción {SELECTED_OPTION} listos para usar.")


if __name__ == "__main__":
    main()
