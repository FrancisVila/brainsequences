import xml.etree.ElementTree as ET

# Parse the SVG file
svg_file = '../app/images/tim_taylor.svg'
output_file = 'svg_ids.txt'

# Parse the XML
tree = ET.parse(svg_file)
root = tree.getroot()

# Open output file
with open(output_file, 'w', encoding='utf-8') as f:
    # Iterate through all elements in the SVG
    for elem in root.iter():
        # Get id attribute
        elem_id = elem.get('id')
        
        # Only write if id exists
        if elem_id:
            f.write(elem_id + '\n')

print(f"Output written to {output_file}")
