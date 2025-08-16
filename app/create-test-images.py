#!/usr/bin/env python3
"""
Create test images for browser upload testing
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_test_image(filename, width=800, height=600, size_mb=None):
    """Create a test image with specific dimensions and optional file size"""
    
    # Create image with gradient background
    image = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(image)
    
    # Create gradient
    for y in range(height):
        r = int(255 * (y / height))
        g = int(255 * (1 - y / height))
        b = 128
        color = (r, g, b)
        draw.line([(0, y), (width, y)], fill=color)
    
    # Add text
    try:
        # Try to use a default font
        font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", 36)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    text = f"Test Image\n{filename}\n{width}x{height}"
    
    # Calculate text position
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (width - text_width) // 2
    y = (height - text_height) // 2
    
    # Draw text with outline
    for adj in range(-2, 3):
        for adj2 in range(-2, 3):
            draw.text((x+adj, y+adj2), text, font=font, fill=(0, 0, 0))
    draw.text((x, y), text, font=font, fill=(255, 255, 255))
    
    # Save image
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    if size_mb:
        # Adjust quality to reach target file size
        quality = 95
        while quality > 10:
            image.save(filepath, 'JPEG', quality=quality)
            file_size = os.path.getsize(filepath)
            target_size = size_mb * 1024 * 1024
            
            if file_size <= target_size:
                break
            quality -= 5
    else:
        image.save(filepath, 'JPEG', quality=85)
    
    actual_size = os.path.getsize(filepath) / (1024 * 1024)
    print(f"Created {filename}: {width}x{height}, {actual_size:.2f}MB")
    return filepath

def main():
    """Create various test images for upload testing"""
    
    print("Creating test images for browser upload testing...")
    
    # Small valid image
    create_test_image('test-small.jpg', 400, 300, 0.5)
    
    # Medium valid image
    create_test_image('test-medium.jpg', 800, 600, 2.0)
    
    # Large valid image (near limit)
    create_test_image('test-large.jpg', 1920, 1080, 10.0)
    
    # Oversized image (should fail)
    create_test_image('test-oversized.jpg', 4000, 3000, 20.0)
    
    # Multiple small images for batch testing
    for i in range(1, 6):
        create_test_image(f'test-batch-{i}.jpg', 300, 200, 0.2)
    
    print("\nTest images created successfully!")
    print("Files created:")
    for file in os.listdir(os.path.dirname(__file__)):
        if file.startswith('test-') and file.endswith('.jpg'):
            size = os.path.getsize(os.path.join(os.path.dirname(__file__), file)) / (1024 * 1024)
            print(f"  {file}: {size:.2f}MB")

if __name__ == "__main__":
    main()