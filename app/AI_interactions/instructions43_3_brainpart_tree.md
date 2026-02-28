

1) For each one of brainparts with is_part_of attribute NOT equal to -1 , search for one of the root sections (list below), first in the description, then in the wikipedia page describing the brainpart. If you find it, set the :
* Frontal lobe
* Parietal lobe
* Temporal lobe
* Occipital lobe
* Limbic system
* Endocrine system
* Senses
* Brain stem

2) build a component that shows a tree with:
* brainparts with is_part_of attribute of -1 at the top level
* under each brainpart, the brainparts with is_part_of pointing towards it
* at the end of the tree, a root element called Others
* un Others, all brainparts without any is_part_of attribute, or an is_part_of attribute not pointing to any existing brainpart

3) insert the component at the top of the brainparts route