#!/usr/bin/env python3
"""
Genera iconos PNG para la PWA de Briku basados en el isotipo oficial CSS.
Renderiza fielmente las 7 piezas del logo (3 bloques base, 2 centro, 2 techo)
respetando los pivots de rotacion exactos del CSS original.
Tambien genera favicon.svg vectorial con color configurable.
"""

import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public",
    "icons",
)

ICON_CONFIGS = [
    {"name": "icon-72x72.png", "size": 72, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-96x96.png", "size": 96, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-128x128.png", "size": 128, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-144x144.png", "size": 144, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-152x152.png", "size": 152, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-192x192.png", "size": 192, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-384x384.png", "size": 384, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "icon-512x512.png", "size": 512, "bg": "#173a6a", "icon": "#ffffff"},
    {"name": "badge-72x72.png", "size": 72, "bg": "#173a6a", "icon": "#ffffff"},
]


def create_briku_icon(target_size: int, bg_color: str, icon_color: str) -> Image.Image:
    """
    Genera el logo Briku escalado a target_size px, reproduciendo fielmente el CSS.

    Logica del CSS (logo de 220px de ancho):
      - .bottom: 3 ladrillos (38 + gap6 + 74 + gap6 + 38 = 162px), height=34
      - .top:    2 ladrillos (78 + gap6 + 78 = 162px), height=34
      - .roof:   div height=78px sobre .top
          - .left:  left=22, width=116, height=25, top=50, rotate(-35 deg) desde LEFT CENTER
          - .right: right=22, width=116, height=25, top=50, rotate(+35 deg) desde RIGHT CENTER

    Nota sobre ejes en Pillow:
      El eje Y crece hacia ABAJO, por eso subir (ir hacia el vertice del techo)
      significa RESTAR al componente Y. Ambas vigas restan sin(rad) en su cy.
    """
    HI_RES = 1024
    transparent: tuple[int, int, int, int] = (0, 0, 0, 0)
    img_hi = Image.new("RGBA", (HI_RES, HI_RES), transparent)
    draw = ImageDraw.Draw(img_hi)

    # Fondo redondeado
    margin = int(HI_RES * 0.04)
    radius = int(HI_RES * 0.22)
    draw.rounded_rectangle(
        [margin, margin, HI_RES - margin, HI_RES - margin],
        radius=radius,
        fill=bg_color,
    )

    # Escala: el logo CSS mide 220px de ancho, lo ocupamos al 50% del canvas
    scale = (HI_RES * 0.50) / 220.0
    center_x = HI_RES / 2.0
    center_y = HI_RES / 2.0 + (18 * scale)
    gap = 6 * scale
    h_block = 34 * scale
    r_corner = max(2, int(2 * scale))

    # Fila inferior (3 ladrillos)
    w_b_left = 38 * scale
    w_b_center = 74 * scale
    w_b_right = 38 * scale
    total_w = w_b_left + gap + w_b_center + gap + w_b_right
    x_start = center_x - (total_w / 2.0)
    y_bottom = center_y + gap

    draw.rounded_rectangle(
        [x_start, y_bottom, x_start + w_b_left, y_bottom + h_block],
        radius=r_corner,
        fill=icon_color,
    )
    x_c = x_start + w_b_left + gap
    draw.rounded_rectangle(
        [x_c, y_bottom, x_c + w_b_center, y_bottom + h_block],
        radius=r_corner,
        fill=icon_color,
    )
    x_r = x_c + w_b_center + gap
    draw.rounded_rectangle(
        [x_r, y_bottom, x_r + w_b_right, y_bottom + h_block],
        radius=r_corner,
        fill=icon_color,
    )

    # Fila superior (2 ladrillos)
    w_top = 78 * scale
    y_top = y_bottom - h_block - gap

    draw.rounded_rectangle(
        [x_start, y_top, x_start + w_top, y_top + h_block],
        radius=r_corner,
        fill=icon_color,
    )
    x_top_r = x_start + w_top + gap
    draw.rounded_rectangle(
        [x_top_r, y_top, x_top_r + w_top, y_top + h_block],
        radius=r_corner,
        fill=icon_color,
    )

    # Techo (2 vigas inclinadas a +/-35 grados)
    x_logo_left = center_x - (220 * scale / 2.0)
    x_logo_right = center_x + (220 * scale / 2.0)
    y_roof_top = y_top - 78 * scale
    y_bar_center = y_roof_top + (50 + 12.5) * scale

    left_pivot_x = x_logo_left + 22 * scale
    right_pivot_x = x_logo_right - 22 * scale

    w_roof = 116 * scale
    h_roof = 25 * scale
    angle = 35
    rad = math.radians(angle)

    # Centro de cada viga tras rotacion (restar sin -> sube en pantalla)
    left_cx = left_pivot_x + (w_roof / 2) * math.cos(rad)
    left_cy = y_bar_center - (w_roof / 2) * math.sin(rad)
    right_cx = right_pivot_x - (w_roof / 2) * math.cos(rad)
    right_cy = y_bar_center - (w_roof / 2) * math.sin(rad)

    beam = Image.new("RGBA", (int(w_roof), int(h_roof)), transparent)
    beam_draw = ImageDraw.Draw(beam)
    beam_draw.rounded_rectangle(
        [0, 0, int(w_roof) - 1, int(h_roof) - 1],
        radius=r_corner,
        fill=icon_color,
    )

    beam_left = beam.rotate(angle, resample=Image.Resampling.BICUBIC, expand=True)
    beam_right = beam.rotate(-angle, resample=Image.Resampling.BICUBIC, expand=True)

    img_hi.paste(
        beam_left,
        (int(left_cx - beam_left.width / 2), int(left_cy - beam_left.height / 2)),
        beam_left,
    )
    img_hi.paste(
        beam_right,
        (int(right_cx - beam_right.width / 2), int(right_cy - beam_right.height / 2)),
        beam_right,
    )

    return img_hi.resize((target_size, target_size), resample=Image.Resampling.LANCZOS)


def generate_favicon_svg(color: str = "#173a6a") -> str:
    """
    Genera el isotipo Briku como SVG vectorial.
    Usa transform='rotate(deg, pivot_x, pivot_y)' que es equivalente exacto
    al transform-origin: left/right center del CSS original.

    Parametros:
        color: color de relleno del isotipo (hex, rgb, nombre CSS...)

    Retorna el SVG como string listo para guardar en .svg.
    Para cambiar el color basta con llamar generate_favicon_svg(color="#ff0000").
    """
    c = color
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">\n'
        f'  <rect x="29"  y="134" width="38"  height="34" rx="2" fill="{c}"/>\n'
        f'  <rect x="73"  y="134" width="74"  height="34" rx="2" fill="{c}"/>\n'
        f'  <rect x="153" y="134" width="38"  height="34" rx="2" fill="{c}"/>\n'
        f'  <rect x="29"  y="94"  width="78"  height="34" rx="2" fill="{c}"/>\n'
        f'  <rect x="113" y="94"  width="78"  height="34" rx="2" fill="{c}"/>\n'
        f'  <rect x="22"  y="66"  width="116" height="25" rx="2" fill="{c}"'
        ' transform="rotate(-35, 22, 78.5)"/>\n'
        f'  <rect x="82"  y="66"  width="116" height="25" rx="2" fill="{c}"'
        ' transform="rotate(35, 198, 78.5)"/>\n'
        "</svg>\n"
    )


def main() -> None:
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # PNGs
    print("Generando iconos Briku en:", OUTPUT_DIR, "\n")
    for cfg in ICON_CONFIGS:
        p = os.path.join(OUTPUT_DIR, cfg["name"])
        img = create_briku_icon(cfg["size"], cfg["bg"], cfg["icon"])
        img.save(p, "PNG")
        print(f"  OK  {cfg['name']:22s}  {cfg['size']}x{cfg['size']} px")

    # SVG favicon
    svg_path = os.path.join(OUTPUT_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(generate_favicon_svg(color="#173a6a"))
    print("  OK  favicon.svg              vectorial")

    print("\nIconos generados correctamente para la PWA.")


if __name__ == "__main__":
    main()
