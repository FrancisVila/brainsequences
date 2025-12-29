import re
import xml.etree.ElementTree as ET

# Register namespaces
namespaces = {
    'svg': 'http://www.w3.org/2000/svg',
    'inkscape': 'http://www.inkscape.org/namespaces/inkscape',
    'sodipodi': 'http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd',
    'xlink': 'http://www.w3.org/1999/xlink'
}

for prefix, uri in namespaces.items():
    ET.register_namespace(prefix, uri)

# Parse the SVG file
tree = ET.parse('app/images/tim_taylor.svg')
root = tree.getroot()

# Function to recursively process elements
def sync_ids(element):
    label = element.get('{http://www.inkscape.org/namespaces/inkscape}label')
    if label:
        # Replace spaces with underscores in the label
        new_id = label.replace(' ', '_')
        element.set('id', new_id)
    
    for child in element:
        sync_ids(child)

# Sync all IDs with labels
sync_ids(root)

# Write back to file
tree.write('app/images/tim_taylor.svg', encoding='UTF-8', xml_declaration=True)
print('IDs synced successfully')
