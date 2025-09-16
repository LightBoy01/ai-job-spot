import re
import os
import sys
import yaml

# --- CONFIGURATION ---
COLORS = {
    "primary_dark": "#0F1A2E",
    "primary_light": "#2A3D5E",
    "title_text": "#F5F5F5",
    "watermark": "#FFFFFF",
}

ACCENT_COLOR_MAP = {
    "default": "#C8A25C", # Muted Gold
    "Psychology": "#4A6B5B", # Deep Muted Green
    "Mindfulness": "#4A6B5B",
    "Mental Models": "#4A6B5B",
    "AI Ethics": "#6B8C7C", # Lighter Muted Green
    "Technology": "#6B8C7C",
    "AI": "#6B8C7C",
    "Career Strategy": "#A17B45", # Dark Gold
    "Future of Work": "#A17B45",
}

def get_accent_color(tags):
    if not tags: return ACCENT_COLOR_MAP["default"]
    primary_tag = tags[0]
    return ACCENT_COLOR_MAP.get(primary_tag, ACCENT_COLOR_MAP["default"])

def generate_svg(title, tags, volume, issue):
    width = 1200
    height = 630
    font_serif = "'Playfair Display', Georgia, serif"
    font_sans = "'Lato', 'Helvetica Neue', sans-serif"
    accent_color = get_accent_color(tags)

    # --- DYNAMIC FONT SIZING ---
    title_len = len(title)
    if title_len > 85:
        font_size = 52
        line_height = 65
        title_y_start = 290
    elif title_len > 55:
        font_size = 64
        line_height = 75
        title_y_start = 280
    else:
        font_size = 72
        line_height = 85
        title_y_start = 270

    # --- SVG FILTERS (for text shadow and background texture) ---
    filters = f'''<defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blur"/>
      <feOffset dx="4" dy="4" result="offsetBlur"/>
      <feFlood flood-color="black" flood-opacity="0.6" result="offsetColor"/>
      <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="faint-texture" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="white" surfaceScale="8" result="light">
        <feDistantLight azimuth="225" elevation="45"/>
      </feDiffuseLighting>
      <feBlend in="SourceGraphic" in2="light" mode="multiply"/>
    </filter>
  </defs>'''

    # --- BACKGROUND & WATERMARK ---
    gradient = f'''<defs><radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style="stop-color:{COLORS["primary_light"]};stop-opacity:1" /><stop offset="100%" style="stop-color:{COLORS["primary_dark"]};stop-opacity:1" /></radialGradient></defs><rect width="100%" height="100%" fill="url(#grad1)" filter="url(#faint-texture)" />'''
    watermark_text = (tags[0] if tags else "Wisdom").upper()
    watermark = f'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="{font_serif}" font-size="250" font-weight="700" fill="{COLORS["watermark"]}" opacity="0.08">{watermark_text}</text>'

    # --- LAYOUT & BRANDING ---
    left_bar = f'<rect x="0" y="0" width="15" height="{height}" fill="{accent_color}" />'
    vol_issue_text = f"VOL. {volume} | ISSUE NO. {issue}"
    top_info = f'<text x="55" y="70" dominant-baseline="middle" text-anchor="start" font-family="{font_sans}" font-size="18" font-weight="700" fill="{accent_color}" letter-spacing="2" opacity="0.8">{vol_issue_text}</text>'
    monogram = f'<text x="1145" y="570" dominant-baseline="middle" text-anchor="end" font-family="{font_serif}" font-size="32" font-weight="700" fill="{accent_color}" opacity="0.6">AJS</text>'

    # --- TITLE ---
    title_lines = []
    words = title.split()
    current_line = ""
    char_limit = 35 if font_size < 72 else 28
    for word in words:
        if len(current_line + " " + word) > char_limit:
            title_lines.append(current_line.strip())
            current_line = word
        else:
            current_line += " " + word
    title_lines.append(current_line.strip())
    if len(title_lines) > 3:
        title_lines = title_lines[:3]
        title_lines[2] += "..."
    
    title_svg = ""
    title_y_start = 280
    for i, line in enumerate(title_lines):
        y = title_y_start + (i * line_height)
        line = line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;').replace("'", '&apos;')
        title_svg += f'<text x="55" y="{y}" dominant-baseline="hanging" text-anchor="start" font-family="{font_serif}" font-size="{font_size}" font-weight="700" fill="{COLORS["title_text"]}" filter="url(#shadow)">{line}</text>'

    # --- TAGS ---
    tags_svg = ""
    if tags:
        tags_line = " | ".join(tags)
        tags_svg = f'<text x="55" y="570" dominant-baseline="middle" text-anchor="start" font-family="{font_sans}" font-size="18" font-weight="400" fill="{accent_color}" opacity="0.7">{tags_line}</text>'

    # --- ACCESSIBILITY ---
    svg_title = title.replace('"', '&quot;') # Escape quotes for XML attribute
    svg_desc = f"""Placeholder image for the article titled '{svg_title}' with tags: {tags_line if tags else 'None'}."""