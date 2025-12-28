import xml.etree.ElementTree as ET
import re

# Parse the SVG file
svg_file = r'c:\projects\brainsequences\brainsequences\app\images\tim_taylor.svg'
tree = ET.parse(svg_file)
root = tree.getroot()

# Define SVG and Inkscape namespaces
namespaces = {
    'svg': 'http://www.w3.org/2000/svg',
    'inkscape': 'http://www.inkscape.org/namespaces/inkscape'
}

# Register namespaces to preserve them in output
for prefix, uri in namespaces.items():
    ET.register_namespace(prefix, uri)

# Also register other namespaces found in the file
ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('sodipodi', 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')

count = 0

# Find all elements with class containing 'body_part'
for elem in root.iter():
    class_attr = elem.get('class', '')
    if 'body_part' in class_attr:
        # Get the inkscape:label attribute
        label = elem.get('{http://www.inkscape.org/namespaces/inkscape}label')
        if label:
            # Set the id to the label value
            old_id = elem.get('id', 'none')
            elem.set('id', label)
            count += 1
            print(f"Updated: {old_id} -> {label}")

print(f"\nTotal elements updated: {count}")

# Write the modified SVG back to the file
tree.write(svg_file, encoding='utf-8', xml_declaration=True)
print(f"Updated SVG saved to: {svg_file}")
