#!/usr/bin/env python3
"""
Genera íconos placeholder PNG para la PWA de Briku.

Los íconos son cuadrados de color sólido con un borde redondeado
y un texto "C" centrado (la letra de Briku).

Suficiente para desarrollo y pruebas — reemplazar con íconos reales
antes de producción.
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "public",
    "icons",
)

ICON_CONFIGS = [
    {"name": "icon-72x72.png", "size": 72, "bg": "#1e293b", "icon": "#60a5fa"},
    {"name": "icon-96x96.png", "size": 96, "bg": "#1e293b", "icon": "#60a5fa"},
    {"name": "icon-128x128.png", "size": 128, "bg": "#1e293b", "icon": "#60a5fa"},
    {"name": "icon-144x144.png", "size": 144, "bg": "#1e293b", "icon": "#60a5fa"},
    {"name": "icon-152x152.png", "size": 152, "bg": "#1e293b", "icon": "#60a5fa"},
    {"name": "icon-192x192.png", "size": 192, "bg": "#1e293b", "icon": "#60a5fa"},
    {"name": "icon-384x384.png", "size": 384, "bg": "#1e293b", "icon": "#60a5fa"},
    {"name": "icon-512x512.png", "size": 512, "bg": "#1e293b", "icon": "#60a5fa"},
    # badge debe ser monocromático (blanco sobre fondo oscuro) para el app badge
    {"name": "badge-72x72.png", "size": 72, "bg": "#1e293b", "icon": "#ffffff"},
]


def draw_icon(size, bg_color, icon_color):
    """Crea un ícono cuadrado con fondo de color y una 'C' centrada."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Fondo redondeado — dibujar rectángulo redondeado manualmente
    # (Pillow no tiene rounded_rectangle en versiones antiguas)
    margin = int(size * 0.08)
    radius = int(size * 0.22)

    # Crear máscara para bordes redondeados
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)

    def rounded_rect(d, rect, r, fill):
        x0, y0, x1, y1 = rect
        # Rectángulo central
        d.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
        d.rectangle([x0, y0 + r, x1, y1 - r], fill=fill)
        # Esquinas
        d.pieslice([x0, y0, x0 + r * 2, y0 + r * 2], 180, 270, fill=fill)
        d.pieslice([x1 - r * 2, y0, x1, y0 + r * 2], 270, 360, fill=fill)
        d.pieslice([x0, y1 - r * 2, x0 + r * 2, y1], 90, 180, fill=fill)
        d.pieslice([x1 - r * 2, y1 - r * 2, x1, y1], 0, 90, fill=fill)

    rounded_rect(mask_draw, [margin, margin, size - margin, size - margin], radius, 255)

    # Aplicar bg_color con la máscara
    bg_rgba = tuple(int(bg_color.lstrip("#")[i : i + 2], 16) for i in (0, 2, 4)) + (
        255,
    )
    color_layer = Image.new("RGBA", (size, size), bg_rgba)
    img = Image.composite(
        color_layer, Image.new("RGBA", (size, size), (0, 0, 0, 0)), mask
    )

    # Dibujar la letra "C" centrada
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.55)
    try:
        font = ImageFont.truetype(
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size
        )
    except (IOError, OSError):
        try:
            font = ImageFont.truetype(
                "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf", font_size
            )
        except (IOError, OSError):
            font = ImageFont.load_default()

    text = "C"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1]
    draw.text((x, y), text, fill=icon_color, font=font)

    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Generando íconos en: {OUTPUT_DIR}")

    for cfg in ICON_CONFIGS:
        path = os.path.join(OUTPUT_DIR, cfg["name"])
        img = draw_icon(cfg["size"], cfg["bg"], cfg["icon"])
        img.save(path, "PNG")
        print(f"  ✓ {cfg['name']:22s}  {cfg['size']}×{cfg['size']}")

    print(
        "\n✅ Todos los placeholders generados. Reemplazar con íconos reales antes de producción."
    )


if __name__ == "__main__":
    main()
