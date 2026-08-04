#!/usr/bin/env python3
"""
Genera íconos PNG para la PWA de Bricu basados en el isotipo oficial CSS.

Renderiza geométricamente las 7 piezas del logo (3 bloques base, 2 centro, 2 techo)
usando supersampling para garantizar bordes suaves en todas las resoluciones.
"""

import os
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public",
    "icons",
)

#  CONFIGURACIÓN DE ÍCONOS Y COLORES
# Azul Bricu: #173a6a | Blanco: #ffffff
ICON_CONFIGS = [
    {"name": "icon-72x72.png", "size": 72, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-96x96.png", "size": 96, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-128x128.png", "size": 128, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-144x144.png", "size": 144, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-152x152.png", "size": 152, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-192x192.png", "size": 192, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-384x384.png", "size": 384, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-512x512.png", "size": 512, "bg": "#173a6a", "icon": "#ffffff"},
    # Badge para notificaciones de la PWA (Monocromático)
    {"name": "badge-72x72.png", "size": 72, "bg": "#173a6a", "icon": "#ffffff"},
]


def create_bricu_icon(target_size, bg_color, icon_color):
    """Genera el logo Bricu escalado vectorialmente a la dimensión deseada."""
    # Renderizado en Canvas de alta resolución (1024x1024) para Antialiasing
    HI_RES = 1024
    img_hi = Image.new("RGBA", (HI_RES, HI_RES), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img_hi)

    # 1. DIBUJAR FONDO CON BORDES REDONDEADOS
    margin = int(HI_RES * 0.04)
    radius = int(HI_RES * 0.22)
    draw.rounded_rectangle(
        [margin, margin, HI_RES - margin, HI_RES - margin],
        radius=radius,
        fill=bg_color,
    )

    # 2. PROPORCIONES DEL LOGO BRICU (basadas en el CSS original de 220px)
    # Escala para que ocupe el ~50% del contenedor
    scale = (HI_RES * 0.50) / 220.0
    center_x = HI_RES / 2.0
    center_y = HI_RES / 2.0 + (18 * scale)  # Ajuste visual leve hacia abajo

    gap = 6 * scale
    h_block = 34 * scale
    r_corner = max(2, int(2 * scale))

    # --- BLOQUES INFERIORES (3 Ladrillos) ---
    w_b_left = 38 * scale
    w_b_center = 74 * scale
    w_b_right = 38 * scale
    total_w_blocks = w_b_left + gap + w_b_center + gap + w_b_right

    x_start = center_x - (total_w_blocks / 2.0)
    y_bottom = center_y + gap

    # Ladrillo Inferior Izquierdo
    draw.rounded_rectangle(
        [x_start, y_bottom, x_start + w_b_left, y_bottom + h_block],
        radius=r_corner,
        fill=icon_color,
    )
    # Ladrillo Inferior Centro
    x_c = x_start + w_b_left + gap
    draw.rounded_rectangle(
        [x_c, y_bottom, x_c + w_b_center, y_bottom + h_block],
        radius=r_corner,
        fill=icon_color,
    )
    # Ladrillo Inferior Derecho
    x_r = x_c + w_b_center + gap
    draw.rounded_rectangle(
        [x_r, y_bottom, x_r + w_b_right, y_bottom + h_block],
        radius=r_corner,
        fill=icon_color,
    )

    # --- BLOQUES SUPERIORES (2 Ladrillos) ---
    w_top = 78 * scale
    y_top = y_bottom - h_block - gap

    # Ladrillo Superior Izquierdo
    draw.rounded_rectangle(
        [x_start, y_top, x_start + w_top, y_top + h_block],
        radius=r_corner,
        fill=icon_color,
    )
    # Ladrillo Superior Derecho
    x_top_r = x_start + w_top + gap
    draw.rounded_rectangle(
        [x_top_r, y_top, x_top_r + w_top, y_top + h_block],
        radius=r_corner,
        fill=icon_color,
    )

    # --- TECHO (2 Barras inclinadas a 35°) ---
    w_roof = 116 * scale
    h_roof = 25 * scale
    angle = -35

    # Crear imagen independiente para rotar la viga sin serruchar bordes
    beam = Image.new("RGBA", (int(w_roof), int(h_roof)), (0, 0, 0, 0))
    beam_draw = ImageDraw.Draw(beam)
    beam_draw.rounded_rectangle(
        [0, 0, w_roof, h_roof], radius=r_corner, fill=icon_color
    )

    beam_left = beam.rotate(-angle, resample=Image.Resampling.BICUBIC, expand=True)
    beam_right = beam.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)

    # Posicionamiento exacto del techo sobre los bloques
    offset_x = 52 * scale
    offset_y = 20 * scale

    # Pegar vigas usando su canal de transparencia Alpha
    img_hi.paste(
        beam_left,
        (
            int(center_x - offset_x - beam_left.width / 2),
            int(y_top - offset_y - beam_left.height / 2),
        ),
        beam_left,
    )
    img_hi.paste(
        beam_right,
        (
            int(center_x + offset_x - beam_right.width / 2),
            int(y_top - offset_y - beam_right.height / 2),
        ),
        beam_right,
    )

    # 3. ESCALAR AL TAMAÑO FINAL CON REAMUESTREO LANCZOS (SUAVE Y NÍTIDO)
    return img_hi.resize((target_size, target_size), resample=Image.Resampling.LANCZOS)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f" Generando íconos oficiales Briku en: {OUTPUT_DIR}\n")

    for cfg in ICON_CONFIGS:
        path = os.path.join(OUTPUT_DIR, cfg["name"])
        img = create_bricu_icon(cfg["size"], cfg["bg"], cfg["icon"])
        img.save(path, "PNG")
        print(f"  ✓ {cfg['name']:22s}  {cfg['size']}×{cfg['size']} px")

    print("\n Íconos generados correctamente para la PWA.")


if __name__ == "__main__":
    main()
