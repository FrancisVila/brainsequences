"""
Generate a 3D mesh for a specific brain region using siibra
Successfully tested approach based on exploration results
"""

import siibra
import numpy as np
from pathlib import Path
import json
import re


def generate_region_mesh(region_name: str, output_dir: Path = None, parcellation_name: str = 'difumo 64'):
    """
    Generate a 3D mesh for a specific brain region using siibra.
    
    Args:
        region_name: Name of the brain region to generate mesh for
        output_dir: Directory to save the mesh and metadata files. 
                   Defaults to public/meshes relative to script location.
        parcellation_name: Name of the parcellation to use (default: 'difumo 64')
    
    Returns:
        dict: Metadata about the generated mesh, or None if generation failed
    """
    print(f"🧠 Generating brain region mesh for '{region_name}' from siibra...")
    print(f"   Using parcellation: {parcellation_name}")
    
    # Configure output
    if output_dir is None:
        output_dir = Path(__file__).parent.parent / 'public' / 'meshes'
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {output_dir}")
    
    # Load atlas and parcellation
    atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS
    parcellation = atlas.get_parcellation(parcellation_name)
    print(f"✓ Atlas: {atlas.name}")
    print(f"✓ Parcellation: {parcellation.name}")
    
    # Get target region
    region = parcellation.get_region(region_name)
    print(f"✓ Region: {region.name}")
    
    # Get the parcellation map (entire brain with all regions labeled)
    template_space = siibra.spaces.MNI_152_ICBM_2009C_NONLINEAR_ASYMMETRIC
    print(f"\nFetching full parcellation map...")
    parcel_map = parcellation.get_map(
        space=template_space,
        maptype='labelled'
    )
    
    # Fetch the volume
    volume = parcel_map.fetch()
    data = volume.get_fdata()
    print(f"✓ Volume data: shape={data.shape}, labels={len(np.unique(data))}")
    
    # Find which label(s) correspond to our region
    # The map has a method to get indices for a region
    print(f"\nLooking for region-specific label...")
    try:
        # Get the label index/indices for our region
        indices = parcel_map.find_indices(region)
        print(f"✓ Found indices for {region.name}: {indices}")
        
        if not indices or len(indices) == 0:
            print("❌ No indices found for this region")
            return None
        
        # Create binary mask for this region
        mask = np.zeros_like(data, dtype=bool)
        for idx in indices:
            # idx is a MapIndex object with volume, label, and fragment
            label = idx.label
            print(f"  Including voxels with label: {label}")
            mask |= (data == label)
        
        voxel_count = mask.sum()
        print(f"✓ Created mask: {voxel_count} voxels")
        
        if voxel_count == 0:
            print("❌ Mask is empty")
            return None
        
        # Generate mesh using marching cubes
        print(f"\nGenerating mesh using marching cubes...")
        from skimage import measure
        import trimesh
        
        # Get voxel spacing from the volume header
        spacing = volume.header.get_zooms()
        print(f"  Voxel spacing: {spacing}")
        
        # Run marching cubes
        verts, faces, normals, values = measure.marching_cubes(
            mask.astype(float), 
            level=0.5, 
            spacing=spacing
        )
        
        # Apply affine transformation to get real-world coordinates (mm)
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
        print(f"  Bounds: {mesh.bounds[0]} to {mesh.bounds[1]}")
        print(f"  Centroid: {mesh.centroid}")
        
        # Smooth the mesh
        print(f"\nSmoothing mesh...")
        mesh = trimesh.smoothing.filter_laplacian(mesh, iterations=3)
        print(f"✓ Mesh smoothed")
        
        # Create sanitized filename from region name
        safe_filename = re.sub(r'[^\w\s-]', '', region_name.lower())
        safe_filename = re.sub(r'[-\s]+', '_', safe_filename)
        
        # Export as .glb (binary glTF)
        output_file = output_dir / f'{safe_filename}.glb'
        mesh.export(str(output_file))
        file_size = output_file.stat().st_size
        
        print(f"\n✅ Successfully exported mesh!")
        print(f"   File: {output_file}")
        print(f"   Size: {file_size / 1024:.1f} KB")
        
        # Create metadata file
        metadata = {
            'region_name': region.name,
            'region_id': region.id,
            'atlas': atlas.name,
            'parcellation': parcellation.name,
            'reference_space': template_space.name,
            'siibra_version': siibra.__version__,
            'vertices': len(mesh.vertices),
            'faces': len(mesh.faces),
            'voxels': int(voxel_count),
            'bounds': mesh.bounds.tolist(),
            'centroid': mesh.centroid.tolist(),
            'file': f'{safe_filename}.glb',
            'file_size_bytes': file_size
        }
        
        metadata_file = output_dir / f'{safe_filename}_metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"   Metadata: {metadata_file}")
        
        print(f"\n🎉 Mesh generation complete!")
        return metadata
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None


if __name__ == "__main__":
    # Default region when running as script
    region_name = "Fornix"
    generate_region_mesh(region_name)
