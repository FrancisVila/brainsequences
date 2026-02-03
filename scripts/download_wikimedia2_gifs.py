import os
import re
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin, unquote

# Read the URLs from wikimedia2.txt
script_dir = os.path.dirname(os.path.abspath(__file__))
wikimedia_txt_path = os.path.join(os.path.dirname(script_dir), 'app', 'images', 'wikimedia', 'wikimedia2.txt')
output_dir = os.path.join(os.path.dirname(script_dir), 'app', 'images', 'wikimedia', 'wikimedia2')
error_report_path = os.path.join(os.path.dirname(script_dir), 'app', 'images', 'wikimedia', 'wikimedia2_download_report.txt')

# Create output directory if it doesn't exist
os.makedirs(output_dir, exist_ok=True)

# Read URLs from file
with open(wikimedia_txt_path, 'r', encoding='utf-8') as f:
    urls = [line.strip() for line in f if line.strip()]

print(f"Found {len(urls)} URLs to process")

# Track statistics and errors
downloaded_count = 0
already_exists_count = 0
errors = []
no_gif_found = []

# Regex pattern to find img tags with .gif src
gif_pattern = re.compile(r'<img[^>]*src="([^"]*\.gif[^"]*)"', re.IGNORECASE)

for idx, url in enumerate(urls, 1):
    print(f"[{idx}/{len(urls)}] Processing: {url}")
    
    try:
        # Add delay to be respectful to the server (increased to 2 seconds)
        time.sleep(2)
        
        # Fetch the page
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        # Retry logic for rate limiting
        max_retries = 3
        for retry in range(max_retries):
            try:
                response = requests.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                break
            except requests.exceptions.HTTPError as e:
                if response.status_code == 429:
                    if retry < max_retries - 1:
                        wait_time = (retry + 1) * 10  # 10, 20, 30 seconds
                        print(f"  ⚠️  Rate limited, waiting {wait_time} seconds...")
                        time.sleep(wait_time)
                        continue
                raise
        
        # Find all .gif images in the HTML
        matches = gif_pattern.findall(response.text)
        
        if not matches:
            no_gif_found.append(url)
            print(f"  ⚠️  No .gif images found")
            continue
        
        # Filter to only get thumbnail versions to avoid rate limiting
        # Prefer 120px or other small thumbnails over full-size images
        thumbnail_matches = [m for m in matches if ('120px' in m or 'thumb' in m)]
        if thumbnail_matches:
            matches = thumbnail_matches
        else:
            # If no thumbnails found, take only the first full-size image to minimize requests
            matches = matches[:1]
        
        print(f"  Found {len(matches)} .gif image(s) to download")
        
        # Download each gif
        for gif_url in matches:
            # Make absolute URL
            if not gif_url.startswith('http'):
                gif_url = urljoin(url, gif_url)
            
            # Get filename from URL
            filename = os.path.basename(unquote(gif_url.split('?')[0]))
            
            # Clean filename - remove problematic characters
            filename = re.sub(r'[<>:"|?*]', '_', filename)
            
            if not filename.endswith('.gif'):
                filename += '.gif'
            
            filepath = os.path.join(output_dir, filename)
            
            # Check if already exists
            if os.path.exists(filepath):
                already_exists_count += 1
                print(f"  ✓ Already exists: {filename}")
                continue
            
            try:
                # Download the image with retry logic for rate limiting
                time.sleep(1)  # Additional delay before downloading
                
                max_img_retries = 5
                for img_retry in range(max_img_retries):
                    try:
                        img_response = requests.get(gif_url, headers=headers, timeout=30)
                        img_response.raise_for_status()
                        break
                    except requests.exceptions.HTTPError as e:
                        if img_response.status_code == 429:
                            if img_retry < max_img_retries - 1:
                                wait_time = (img_retry + 1) * 30  # 15, 30, 45 seconds
                                print(f"    ⚠️  Rate limited on image, waiting {wait_time} seconds...")
                                time.sleep(wait_time)
                                continue
                        raise
                
                with open(filepath, 'wb') as f:
                    f.write(img_response.content)
                
                downloaded_count += 1
                print(f"  ✓ Downloaded: {filename}")
                
            except Exception as e:
                error_msg = f"Failed to download {gif_url}: {str(e)}"
                errors.append(error_msg)
                print(f"  ✗ {error_msg}")
    
    except Exception as e:
        error_msg = f"Failed to process {url}: {str(e)}"
        errors.append(error_msg)
        print(f"  ✗ {error_msg}")

# Write report
with open(error_report_path, 'w', encoding='utf-8') as f:
    f.write("=" * 80 + "\n")
    f.write("Wikimedia2 GIF Download Report\n")
    f.write("=" * 80 + "\n\n")
    
    f.write(f"Total URLs processed: {len(urls)}\n")
    f.write(f"GIFs downloaded: {downloaded_count}\n")
    f.write(f"GIFs already existed: {already_exists_count}\n")
    f.write(f"Pages with no GIF found: {len(no_gif_found)}\n")
    f.write(f"Errors encountered: {len(errors)}\n\n")
    
    if no_gif_found:
        f.write("=" * 80 + "\n")
        f.write("Pages where no .gif images were found:\n")
        f.write("=" * 80 + "\n")
        for url in no_gif_found:
            f.write(f"{url}\n")
        f.write("\n")
    
    if errors:
        f.write("=" * 80 + "\n")
        f.write("Errors:\n")
        f.write("=" * 80 + "\n")
        for error in errors:
            f.write(f"{error}\n")
        f.write("\n")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total URLs processed: {len(urls)}")
print(f"GIFs downloaded: {downloaded_count}")
print(f"GIFs already existed: {already_exists_count}")
print(f"Pages with no GIF found: {len(no_gif_found)}")
print(f"Errors encountered: {len(errors)}")
print(f"\nReport saved to: {error_report_path}")
