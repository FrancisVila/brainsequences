import xml.etree.ElementTree as ET
import re

# File paths
svg_file = 'app/images/tim_taylor.svg'
replace_file = 'svg_tags_replace.txt'
output_svg = 'app/images/tim_taylor.svg'

# Define the Inkscape namespace
namespaces = {
    'inkscape': 'http://www.inkscape.org/namespaces/inkscape',
    'svg': 'http://www.w3.org/2000/svg'
}

# Register namespace to avoid ns0: prefixes
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('inkscape', 'http://www.inkscape.org/namespaces/inkscape')
ET.register_namespace('sodipodi', 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

# Parse the SVG file
tree = ET.parse(svg_file)
root = tree.getroot()

# Read the replacement file
replacements = []
with open(replace_file, 'r', encoding='utf-8') as f:
    for line in f:
        line = line.strip()
        if not line:
            continue
        
        # Parse the line to extract id and inkscape:label
        id_match = re.search(r'id=([^,]+)', line)
        label_match = re.search(r'inkscape:label=(.+?)(?:\s+\*\*\*)?$', line)
        
        if id_match and label_match:
            old_id = id_match.group(1).strip()
            new_id = label_match.group(1).strip()
            replacements.append((old_id, new_id))

print(f"Found {len(replacements)} replacements to make")

# Apply replacements
updated_count = 0
for old_id, new_id in replacements:
    # Find element with matching id and inkscape:label
    for elem in root.iter():
        elem_id = elem.get('id')
        inkscape_label = elem.get('{http://www.inkscape.org/namespaces/inkscape}label')
        
        if elem_id == old_id and inkscape_label == new_id:
            # Update the id to match the inkscape:label
            elem.set('id', new_id)
            updated_count += 1
            print(f"Updated: id='{old_id}' -> id='{new_id}'")
            break

print(f"\nTotal elements updated: {updated_count}")

# Write the modified SVG back to file
tree.write(output_svg, encoding='UTF-8', xml_declaration=True)
print(f"Updated SVG saved to {output_svg}")
