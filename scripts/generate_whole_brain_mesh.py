"""
Generate a whole brain surface mesh using siibra
This will be used as the base mesh with specific regions highlighted
"""

import siibra
import numpy as np
from pathlib import Path
import json
import trimesh

print("🧠 Generating whole brain surface mesh from siibra...")

# Configure output
output_dir = Path(__file__).parent.parent / 'public' / 'meshes'
output_dir.mkdir(parents=True, exist_ok=True)
print(f"Output directory: {output_dir}")

# Load template space
template_space = siibra.spaces.MNI_152_ICBM_2009C_NONLINEAR_ASYMMETRIC
print(f"✓ Template space: {template_space.name}")

# Get the whole brain surface mesh
print(f"\nGenerating from parcellation...")
try:
    # Generate from full parcellation
    atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS
    parcellation = atlas.get_parcellation('difumo 64')
    
    parcel_map = parcellation.get_map(
        space=template_space,
        maptype='labelled'
    )
    
    volume = parcel_map.fetch()
    data = volume.get_fdata()
    
    # Create mask for any non-zero voxels (whole brain)
    mask = data > 0
    voxel_count = mask.sum()
    print(f"✓ Created whole brain mask: {voxel_count} voxels")
    
    # Generate mesh using marching cubes
    from skimage import measure
    
    spacing = volume.header.get_zooms()
    print(f"  Voxel spacing: {spacing}")
    
    # Run marching cubes
    verts, faces, normals, values = measure.marching_cubes(
        mask.astype(float), 
        level=0.5, 
        spacing=spacing
    )
    
    # Apply affine transformation
    affine = volume.affine
    verts_transformed = np.dot(verts, affine[:3, :3].T) + affine[:3, 3]
    
    # Create trimesh object
    mesh = trimesh.Trimesh(
        vertices=verts_transformed, 
        faces=faces, 
        vertex_normals=normals
    )
    
    print(f"✓ Generated mesh:")
    print(f"  Vertices: {len(mesh.vertices):,}")
    print(f"  Faces: {len(mesh.faces):,}")
    
    # Simplify the mesh to reduce file size
    print(f"\nSimplifying mesh...")
    target_faces = 50000
    target_reduction = max(0.0, 1.0 - (target_faces / len(mesh.faces)))
    if target_reduction > 0:
        mesh = mesh.simplify_quadric_decimation(target_reduction)
        print(f"✓ Simplified to {len(mesh.faces):,} faces")
    else:
        print(f"✓ Mesh already has {len(mesh.faces):,} faces (no simplification needed)")
    
    # Smooth the mesh
    print(f"Smoothing mesh...")
    mesh = trimesh.smoothing.filter_laplacian(mesh, iterations=5)
    print(f"✓ Mesh smoothed")
    
    print(f"  Final vertices: {len(mesh.vertices):,}")
    print(f"  Final faces: {len(mesh.faces):,}")
    print(f"  Bounds: {mesh.bounds[0]} to {mesh.bounds[1]}")
    print(f"  Centroid: {mesh.centroid}")
    
    # Export as .glb (binary glTF)
    output_file = output_dir / 'whole_brain.glb'
    mesh.export(str(output_file))
    file_size = output_file.stat().st_size
    
    print(f"\n✅ Successfully exported mesh!")
    print(f"   File: {output_file}")
    print(f"   Size: {file_size / 1024:.1f} KB")
    
    # Create metadata file
    metadata = {
        'name': 'Whole Brain Surface',
        'source': 'DiFuMo 64 parcellation',
        'reference_space': template_space.name,
        'siibra_version': siibra.__version__,
        'vertices': len(mesh.vertices),
        'faces': len(mesh.faces),
        'voxels': int(voxel_count),
        'bounds': mesh.bounds.tolist(),
        'centroid': mesh.centroid.tolist(),
        'file': 'whole_brain.glb',
        'file_size_bytes': file_size
    }
    
    metadata_file = output_dir / 'whole_brain_metadata.json'
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"   Metadata: {metadata_file}")
    
    print(f"\n🎉 Whole brain mesh generation complete!")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
