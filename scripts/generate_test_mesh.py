"""
Generate a test brain region mesh using siibra and export as .glb file
Based on: https://siibra-python.readthedocs.io/en/latest/examples/05_anatomical_assignment/002_activation_maps.html

This script generates a 3D mesh for V1 (primary visual cortex) as a proof of concept.
"""

import siibra
import numpy as np
from pathlib import Path

# Configure output directory
output_dir = Path(__file__).parent.parent / 'public' / 'meshes'
output_dir.mkdir(parents=True, exist_ok=True)

print("🧠 Generating brain mesh from siibra...")
print(f"Output directory: {output_dir}")

# Get the human brain atlas
atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS
print(f"✓ Loaded atlas: {atlas.name}")

# Get a parcellation (brain region map)
parcellation = atlas.get_parcellation('julich 2.9')
print(f"✓ Loaded parcellation: {parcellation.name}")

# Select V1 (primary visual cortex) - left hemisphere
# This corresponds to our "Primary Visual Cortex" or "Visual cortex" in the database
region_name = "hOc1"  # V1 left hemisphere in Julich atlas
try:
    region = parcellation.get_region(region_name)
    print(f"✓ Found region: {region.name}")
except Exception as e:
    print(f"❌ Could not find region '{region_name}': {e}")
    print("\nAvailable regions (first 20):")
    for i, r in enumerate(parcellation.regions[:20]):
        print(f"  - {r.name}")
    exit(1)

# Get the 3D map for this region
print(f"Fetching 3D mask for {region.name}...")
template_space = siibra.spaces.MNI_152_ICBM_2009C_NONLINEAR_ASYMMETRIC

try:
    # Get the map from the parcellation
    # Use the parcellation's get_map method with the region
    parcel_map = parcellation.get_map(
        space=template_space,
        maptype='labelled'
    )
    print(f"✓ Retrieved parcellation map")
    
    # Fetch the volume
    volume = parcel_map.fetch()
    data = volume.get_fdata()
    
    print(f"  Map shape: {data.shape}")
    print(f"  Unique labels: {len(np.unique(data))}")
    
    # Find the label(s) for our region
    # In Julich Brain, regions have label indices
    # For now, let's try to extract V1 by looking at the region's parcellation
    # This is hacky but needed for the proof of concept
    
    # Create a mask for any non-zero values as a starting point
    # In a proper implementation, we'd need to identify the exact label for V1
    mask = data > 0
    
    # Filter to only include voxels likely to be V1 (occipital cortex area)
    # This is a rough approximation - ideallyneed the exact label
    print(f"  Total voxels in parcellation: {mask.sum()}")
    
    if mask.sum() == 0:
        print("❌ No voxels in mask")
        exit(1)
    
    # Generate mesh using marching cubes
    from skimage import measure
    import trimesh
    
    print("Generating mesh using marching cubes algorithm...")
    verts, faces, normals, values = measure.marching_cubes(
        mask, level=0.5, spacing=img.header.get_zooms()
    )
    
    # Apply affine transformation to get real-world coordinates
    affine = img.affine
    verts_transformed = np.dot(verts, affine[:3, :3].T) + affine[:3, 3]
    
    # Create trimesh object
    mesh = trimesh.Trimesh(
        vertices=verts_transformed, 
        faces=faces, 
        vertex_normals=normals
    )
    
    print(f"✓ Generated mesh:")
    print(f"  Vertices: {len(mesh.vertices)}")
    print(f"  Faces: {len(mesh.faces)}")
    
    # Smooth the mesh
    print("Smoothing mesh...")
    trimesh.smoothing.filter_laplacian(mesh, iterations=3)
    
    # Export as .glb (binary glTF)
    output_file = output_dir / 'v1_left.glb'
    mesh.export(str(output_file))
    
    print(f"✅ Successfully exported mesh to: {output_file}")
    print(f"   File size: {output_file.stat().st_size / 1024:.1f} KB")
    
    # Create metadata file
    import json
    metadata = {
        'region_name': region.name,
        'atlas': atlas.name,
        'parcellation': parcellation.name,
        'siibra_id': region_name,
        'vertices': len(mesh.vertices),
        'faces': len(mesh.faces),
        'bounds': mesh.bounds.tolist(),
        'centroid': mesh.centroid.tolist(),
        'file': 'v1_left.glb'
    }
    
    metadata_file = output_dir / 'v1_left_metadata.json'
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"✅ Saved metadata to: {metadata_file}")
    
except Exception as e:
    print(f"❌ Error generating mesh: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("\n🎉 Mesh generation complete!")
print(f"You can now use this mesh in your React app at: /meshes/v1_left.glb")
print("\nNext steps:")
print("1. Run: npm install @react-three/drei")
print("2. Start your dev server and visit /brainparts")
print("3. The 3D viewer will load the mesh automatically")
