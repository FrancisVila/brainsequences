import xml.etree.ElementTree as ET

# Parse the SVG file
svg_file = 'app/images/tim_taylor.svg'
output_file = 'svg_tags_output.txt'

# Parse the XML
tree = ET.parse(svg_file)
root = tree.getroot()

# Define the Inkscape namespace
namespaces = {
    'inkscape': 'http://www.inkscape.org/namespaces/inkscape',
    'svg': 'http://www.w3.org/2000/svg'
}

# Open output file
with open(output_file, 'w', encoding='utf-8') as f:
    # Iterate through all elements in the SVG
    for elem in root.iter():
        # Get id attribute
        elem_id = elem.get('id')
        
        # Get inkscape:label attribute
        inkscape_label = elem.get('{http://www.inkscape.org/namespaces/inkscape}label')
        
        # Only write if both attributes exist and they are different (case insensitive, treating spaces and underscores as equivalent)
        if elem_id and inkscape_label:
            # Normalize by replacing spaces with underscores for comparison
            normalized_id = elem_id.lower().replace(' ', '_')
            normalized_label = inkscape_label.lower().replace(' ', '_')
            if normalized_id != normalized_label:
                line = f"id={elem_id}, inkscape:label={inkscape_label} ***"
                f.write(line + '\n')

print(f"Output written to {output_file}")
