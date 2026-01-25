create a jsx component in the components/ folder
name: HighlightedImage
Attributes:
    highlightedSvg (mandatory, string) : name of the svg file with paths to highlight
    backgroundImage (optional, string) : name of background image 
    highlightedIds (optional, string or integer) : array of id of highlighted paths. Paths with no id should be automatically given an id equal to the path's nth number position in the svg.
    cssFile (mandatory, string): name of the css file to connect to
the component should diplay the backgroundImage with the highlightedSvg on top. 
the component should add the highlighted style to the paths whose ids are equivalent to the ids in the highlightedIds array (either equal, or equal after converting from string to integer or vice versa)

Incorporate the contents of highlightedSvg.css into highlightedSvg.tsx, remove the cssFile attribute of highlightedSvg.tsx