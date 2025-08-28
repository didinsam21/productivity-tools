#!/usr/bin/env python3
"""
Simple script to generate basic PNG icons for the PWA.
Requires Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("Pillow not found. Installing...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont
    import os

def create_productivity_icon(size, filename):
    """Create a black and white productivity tools icon"""
    # Create image with RGBA mode for transparency support
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw rounded rectangle background (white with black border)
    radius = size // 8
    # Main background
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=max(2, size//64))
    
    # Scale factors for different sizes
    scale = size / 512
    
    # Checklist clipboard background
    clipboard_x = int(128 * scale)
    clipboard_y = int(80 * scale)
    clipboard_w = int(256 * scale)
    clipboard_h = int(320 * scale)
    clipboard_r = max(2, int(12 * scale))
    
    # Outer clipboard (black)
    draw.rounded_rectangle([clipboard_x, clipboard_y, clipboard_x + clipboard_w, clipboard_y + clipboard_h], 
                          radius=clipboard_r, fill=(0, 0, 0, 255))
    
    # Inner clipboard (white)
    inner_x = clipboard_x + int(8 * scale)
    inner_y = clipboard_y + int(8 * scale)
    inner_w = clipboard_w - int(16 * scale)
    inner_h = clipboard_h - int(16 * scale)
    inner_r = max(1, int(8 * scale))
    draw.rounded_rectangle([inner_x, inner_y, inner_x + inner_w, inner_y + inner_h], 
                          radius=inner_r, fill=(255, 255, 255, 255))
    
    # Checklist items
    item_size = max(4, int(20 * scale))
    line_height = max(2, int(8 * scale))
    line_thickness = max(1, int(2 * scale))
    
    # Item 1 - completed (filled checkbox)
    item1_x = int(160 * scale)
    item1_y = int(120 * scale)
    draw.rectangle([item1_x, item1_y, item1_x + item_size, item1_y + item_size], fill=(0, 0, 0, 255))
    
    # Checkmark for item 1
    if size >= 192:
        check_size = max(1, int(3 * scale))
        cx, cy = item1_x + item_size//3, item1_y + item_size//2
        draw.line([cx, cy, cx + item_size//4, cy + item_size//4], fill=(255, 255, 255, 255), width=check_size)
        draw.line([cx + item_size//4, cy + item_size//4, cx + item_size*2//3, cy - item_size//4], fill=(255, 255, 255, 255), width=check_size)
    
    # Line for item 1
    line1_x = int(200 * scale)
    line1_y = int(125 * scale)
    line1_w = int(120 * scale)
    draw.rectangle([line1_x, line1_y, line1_x + line1_w, line1_y + line_height], fill=(0, 0, 0, 255))
    
    # Item 2 - completed
    item2_y = int(160 * scale)
    draw.rectangle([item1_x, item2_y, item1_x + item_size, item2_y + item_size], fill=(0, 0, 0, 255))
    
    # Checkmark for item 2
    if size >= 192:
        cx, cy = item1_x + item_size//3, item2_y + item_size//2
        draw.line([cx, cy, cx + item_size//4, cy + item_size//4], fill=(255, 255, 255, 255), width=check_size)
        draw.line([cx + item_size//4, cy + item_size//4, cx + item_size*2//3, cy - item_size//4], fill=(255, 255, 255, 255), width=check_size)
    
    # Line for item 2
    line2_y = int(165 * scale)
    line2_w = int(100 * scale)
    draw.rectangle([line1_x, line2_y, line1_x + line2_w, line2_y + line_height], fill=(0, 0, 0, 255))
    
    # Item 3 - in progress (empty checkbox)
    item3_y = int(200 * scale)
    draw.rectangle([item1_x, item3_y, item1_x + item_size, item3_y + item_size], 
                  fill=None, outline=(0, 0, 0, 255), width=line_thickness)
    
    # Line for item 3
    line3_y = int(205 * scale)
    line3_w = int(140 * scale)
    draw.rectangle([line1_x, line3_y, line1_x + line3_w, line3_y + line_height], fill=(0, 0, 0, 255))
    
    # Item 4 - pending (empty checkbox)
    item4_y = int(240 * scale)
    draw.rectangle([item1_x, item4_y, item1_x + item_size, item4_y + item_size], 
                  fill=None, outline=(0, 0, 0, 255), width=line_thickness)
    
    # Line for item 4
    line4_y = int(245 * scale)
    line4_w = int(80 * scale)
    draw.rectangle([line1_x, line4_y, line1_x + line4_w, line4_y + line_height], fill=(0, 0, 0, 255))
    
    # Clock icon
    clock_x = int(320 * scale)
    clock_y = int(320 * scale)
    clock_r = max(5, int(30 * scale))
    clock_width = max(1, int(4 * scale))
    
    # Clock circle
    draw.ellipse([clock_x - clock_r, clock_y - clock_r, clock_x + clock_r, clock_y + clock_r], 
                fill=None, outline=(0, 0, 0, 255), width=clock_width)
    
    # Clock hands
    hand_width = max(1, int(3 * scale))
    # Hour hand (vertical)
    draw.line([clock_x, clock_y - clock_r + int(5 * scale), clock_x, clock_y], 
             fill=(0, 0, 0, 255), width=hand_width)
    # Minute hand (diagonal)
    hand_end_x = clock_x + int(15 * scale)
    hand_end_y = clock_y + int(15 * scale)
    draw.line([clock_x, clock_y, hand_end_x, hand_end_y], 
             fill=(0, 0, 0, 255), width=hand_width)
    
    # Calendar icon (smaller icons only for larger sizes)
    if size >= 192:
        cal_x = int(160 * scale)
        cal_y = int(300 * scale)
        cal_size = max(8, int(40 * scale))
        cal_width = max(1, int(3 * scale))
        
        # Calendar outline
        draw.rectangle([cal_x, cal_y, cal_x + cal_size, cal_y + cal_size], 
                      fill=None, outline=(0, 0, 0, 255), width=cal_width)
        
        # Calendar header
        header_h = max(1, int(4 * scale))
        draw.rectangle([cal_x, cal_y + int(10 * scale), cal_x + cal_size, cal_y + int(10 * scale) + header_h], 
                      fill=(0, 0, 0, 255))
        
        # Calendar dots
        dot_r = max(1, int(2 * scale))
        dot1_x = cal_x + int(10 * scale)
        dot1_y = cal_y + int(5 * scale)
        dot2_x = cal_x + int(30 * scale)
        
        draw.ellipse([dot1_x - dot_r, dot1_y - dot_r, dot1_x + dot_r, dot1_y + dot_r], fill=(0, 0, 0, 255))
        draw.ellipse([dot2_x - dot_r, dot1_y - dot_r, dot2_x + dot_r, dot1_y + dot_r], fill=(0, 0, 0, 255))
        
        # Target icon
        target_x = int(240 * scale)
        target_y = int(320 * scale)
        target_r1 = max(4, int(20 * scale))
        target_r2 = max(2, int(12 * scale))
        target_r3 = max(1, int(4 * scale))
        target_width = max(1, int(3 * scale))
        
        # Outer circle
        draw.ellipse([target_x - target_r1, target_y - target_r1, target_x + target_r1, target_y + target_r1], 
                    fill=None, outline=(0, 0, 0, 255), width=target_width)
        # Middle circle
        draw.ellipse([target_x - target_r2, target_y - target_r2, target_x + target_r2, target_y + target_r2], 
                    fill=None, outline=(0, 0, 0, 255), width=max(1, target_width//2))
        # Center dot
        draw.ellipse([target_x - target_r3, target_y - target_r3, target_x + target_r3, target_y + target_r3], 
                    fill=(0, 0, 0, 255))
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    """Generate icon files"""
    print("Generating productivity tools icons...")
    
    # Create icons directory if it doesn't exist
    os.makedirs('.', exist_ok=True)
    
    # Generate different sizes
    create_productivity_icon(192, 'icon-192x192.png')
    create_productivity_icon(512, 'icon-512x512.png')
    
    print("Icons generated successfully!")
    print("Black and white productivity-themed icons created.")

if __name__ == "__main__":
    main()
