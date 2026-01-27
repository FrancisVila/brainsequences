#!/usr/bin/env python3
"""
Script to add inkscape:label attributes to path elements in an SVG file.
For each path that has an id but no inkscape:label, adds inkscape:label with the same value as id.
"""

import re
import sys

def process_svg_file(input_file, output_file):
    """Process the SVG file and add inkscape:label attributes where needed."""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Counter for modifications
    modifications = 0
    
    # Pattern to match path elements with id but no inkscape:label
    # This regex looks for <path elements that have an id attribute but no inkscape:label
    def add_label_to_path(match):
        nonlocal modifications
        path_tag = match.group(0)
        
        # Check if already has inkscape:label
        if 'inkscape:label=' in path_tag:
            return path_tag
        
        # Extract the id value
        id_match = re.search(r'id="([^"]*)"', path_tag)
        if not id_match:
            return path_tag
        
        id_value = id_match.group(1)
        
        # Find where to insert the inkscape:label attribute
        # Insert it right after the id attribute
        id_end = id_match.end()
        new_path_tag = path_tag[:id_end] + f' inkscape:label="{id_value}"' + path_tag[id_end:]
        
        modifications += 1
        return new_path_tag
    
    # Process all path elements
    # Match <path...> or <path.../> that contain id= but not inkscape:label=
    pattern = r'<path\s+[^>]*id="[^"]*"[^>]*(?:>|/>)'
    
    new_content = re.sub(pattern, add_label_to_path, content)
    
    # Write the result
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    return modifications

if __name__ == '__main__':
    input_file = r'c:\projects\brainsequences\brainsequences\app\images\tim_taylor.svg'
    output_file = input_file  # Overwrite the original file
    
    print(f"Processing {input_file}...")
    count = process_svg_file(input_file, output_file)
    print(f"Added {count} inkscape:label attributes to path elements.")
