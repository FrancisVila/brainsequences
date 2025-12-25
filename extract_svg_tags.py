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
        
        # Only write if at least one attribute exists
        if elem_id or inkscape_label:
            line_parts = []
            
            if elem_id:
                line_parts.append(f"id={elem_id}")
            
            if inkscape_label:
                line_parts.append(f"inkscape:label={inkscape_label}")
            
            line = ", ".join(line_parts)
            
            # Check if they are different (case insensitive)
            if elem_id and inkscape_label:
                if elem_id.lower() != inkscape_label.lower():
                    line += " ***"
            
            f.write(line + '\n')

print(f"Output written to {output_file}")
