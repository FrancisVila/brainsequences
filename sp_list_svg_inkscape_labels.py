import xml.etree.ElementTree as ET

# Parse the SVG file
svg_file = 'app/images/tim_taylor.svg'
output_file = 'svg_ids.txt'

# Define the Inkscape namespace
inkscape_ns = '{http://www.inkscape.org/namespaces/inkscape}'

# Parse the XML
tree = ET.parse(svg_file)
root = tree.getroot()

# Collect all labels
labels = []
for elem in root.iter():
    # Get inkscape:label attribute using the full namespace
    elem_id = elem.get(f'{inkscape_ns}label')
    
    # Only add if id exists
    if elem_id:
        labels.append(elem_id)

# Filter out unwanted items
filtered_labels = [
    label for label in labels 
    if label not in ["Film Grain", "Opacity"]
    and not label.startswith("path")
    and not label.startswith("rect")
]

# Sort alphabetically
filtered_labels.sort()

# Write sorted labels to output file
with open(output_file, 'w', encoding='utf-8') as f:
    for label in filtered_labels:
        f.write(label + '\n')

print(f"Output written to {output_file}")
