1) In HighlightedImage.tsx:
* add a parameter called links.
* links is an array of objects, with attributes from, to, and label.
* from and to are each the id of a brainpart
* label is a string
2) In HighlightedImage.tsx, modifiy the tim_taylor.svg file as follows:
* for each link object in the links array, duplicate the link0 group
* rename it link1, or link2 if link1 is already taken (take the index of the link in the array + 1)
* transform the line so that the start of the line in on the corner of the path whose id is equal to 'from', and the end is on the corner of the path with id equal to 'to' . Chose the corner that is the closest to the center of the other 
3) In sequence.tsx, call HighlightedImage.tsx with a link equal to [{from: 'VTA', to: 'Frontal_Pole', label:'dopamine'}]