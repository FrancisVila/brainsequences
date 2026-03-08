write a script that:
1 defines variables for ancestor_name and parcellation_name (values: "Cerebellum", "julich 3.1" )
2 launches get_leaf_regions to list the names of leaf regions under the ancestor in the parcellation
3 for each region, launch generate_region_mesh
4 from this list of generated meshes, create a combined mesh that is the union of those generated meshes. Give this combined mesh the name of the ancestor.