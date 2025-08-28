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

def create_gradient_icon(size, filename):
    """Create a simple gradient icon with 'P' text"""
    # Create image with RGBA mode for transparency support
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background (simple linear gradient approximation)
    for y in range(size):
        # Calculate gradient colors from blue to green
        ratio = y / size
        r = int(66 + (52 - 66) * ratio)    # 66 -> 52
        g = int(133 + (168 - 133) * ratio) # 133 -> 168
        b = int(244 + (83 - 244) * ratio)  # 244 -> 83
        
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw rounded rectangle mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    radius = size // 8
    mask_draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
    
    # Apply mask to create rounded corners
    img.putalpha(mask)
    
    # Draw 'P' text
    try:
        # Try to use a system font
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
    except (OSError, IOError):
        try:
            # Fallback to default font
            font = ImageFont.load_default()
        except:
            font = None
    
    if font:
        # Get text size and position
        bbox = draw.textbbox((0, 0), "P", font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (size - text_width) // 2
        y = (size - text_height) // 2 - size // 8
        
        draw.text((x, y), "P", fill=(255, 255, 255, 255), font=font)
        
        # Draw "PWA" text smaller
        try:
            small_font = ImageFont.truetype("arial.ttf", size // 8)
        except:
            small_font = font
            
        if small_font:
            bbox = draw.textbbox((0, 0), "PWA", font=small_font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            x = (size - text_width) // 2
            y = size - text_height - size // 6
            
            draw.text((x, y), "PWA", fill=(255, 255, 255, 230), font=small_font)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

def main():
    """Generate icon files"""
    print("Generating PWA icons...")
    
    # Create icons directory if it doesn't exist
    os.makedirs('.', exist_ok=True)
    
    # Generate different sizes
    create_gradient_icon(192, 'icon-192x192.png')
    create_gradient_icon(512, 'icon-512x512.png')
    
    print("Icons generated successfully!")
    print("Note: Icons are basic placeholders. Replace with your own design for production.")

if __name__ == "__main__":
    main()
