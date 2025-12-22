#!/usr/bin/env python3
"""
Inkscape extension to save an ungrouped copy to a specific folder
"""

import inkex
from pathlib import Path

# Hard-coded output folder
OUTPUT_FOLDER = Path(r"C:\projects\brainsequences\brainsequences\app\images")


class SaveAndUngroup(inkex.EffectExtension):
    """Extension to save document and create an _ungroup copy"""
    
    def effect(self):
        # Get the document name
        doc_name = self.svg.get('sodipodi:docname')
        
        if not doc_name:
            inkex.errormsg("Document must be saved with a filename first.")
            return
        
        # Ungroup all groups recursively
        count = self.ungroup_all(self.document.getroot())
        
        # Create output filename
        path = Path(doc_name)
        new_filename = f"{path.stem}_ungroup{path.suffix}"
        output_path = OUTPUT_FOLDER / new_filename
        
        # Ensure the output folder exists
        OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
        
        # Write the modified document to the new file
        self.document.write(str(output_path))
        
        inkex.utils.debug(f"Saved ungrouped copy to: {output_path}\nUngrouped {count} group(s).")
    
    def ungroup_all(self, element):
        """Recursively ungroup all groups in the document"""
        count = 0
        # Find all group elements
        groups = element.findall('.//{http://www.w3.org/2000/svg}g')
        
        # Process groups from deepest to shallowest to avoid issues
        for group in reversed(groups):
            parent = group.getparent()
            if parent is not None:
                # Get the group's transform if any
                transform = group.get('transform', '')
                
                # Move all children of the group to the parent
                index = list(parent).index(group)
                for child in list(group):
                    # Check if this is a text element with textPath (text-on-path)
                    has_textpath = child.tag == '{http://www.w3.org/2000/svg}text' and \
                                   child.find('.//{http://www.w3.org/2000/svg}textPath') is not None
                    
                    # If group has a transform, apply it to children (except text-on-path)
                    if transform and not has_textpath:
                        child_transform = child.get('transform', '')
                        if child_transform:
                            child.set('transform', f"{transform} {child_transform}")
                        else:
                            child.set('transform', transform)
                    
                    parent.insert(index, child)
                    index += 1
                
                # Remove the now-empty group
                parent.remove(group)
                count += 1
        
        return count


if __name__ == '__main__':
    SaveAndUngroup().run()
