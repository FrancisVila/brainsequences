"""
Diagnostic script to understand coordinate transformations
"""

import siibra
import numpy as np
from skimage import measure

print("🔬 Diagnosing coordinate transformations...")

# Load atlas
atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS
template_space = siibra.spaces.MNI_152_ICBM_2009C_NONLINEAR_ASYMMETRIC

def diagnose_parcellation(parcellation_name, region_name):
    print(f"\n{'='*60}")
    print(f"{parcellation_name.upper()}: {region_name}")
    print('='*60)
    
    parcellation = atlas.get_parcellation(parcellation_name)
    region = parcellation.get_region(region_name)
    parcel_map = parcellation.get_map(space=template_space, maptype='labelled')
    volume = parcel_map.fetch()
    data = volume.get_fdata()
    
    # Get region indices
    indices = parcel_map.find_indices(region)
    mask = np.zeros_like(data, dtype=bool)
    for idx in indices:
        mask |= (data == idx.label)
    
    # Get a sample voxel position
    voxel_positions = np.argwhere(mask)
    if len(voxel_positions) > 0:
        sample_voxel = voxel_positions[len(voxel_positions)//2]  # middle voxel
        print(f"Sample voxel (ijk): {sample_voxel}")
        
        # Apply affine directly to voxel
        voxel_homogeneous = np.append(sample_voxel, 1)
        world_coord_direct = volume.affine @ voxel_homogeneous
        print(f"Direct affine transform: {world_coord_direct[:3]}")
        
        # Method used in generate_siibra_mesh (with spacing)
        spacing = volume.header.get_zooms()
        print(f"Voxel spacing: {spacing}")
        
        # Simulate what marching_cubes does
        voxel_scaled = sample_voxel * np.array(spacing)
        print(f"After spacing multiplication: {voxel_scaled}")
        
        # Then apply rotation part of affine
        voxel_rotated = np.dot(voxel_scaled, volume.affine[:3, :3].T)
        print(f"After rotation (affine[:3,:3].T): {voxel_rotated}")
        
        # Then add translation
        voxel_final = voxel_rotated + volume.affine[:3, 3]
        print(f"After translation (+ affine[:3,3]): {voxel_final}")
        
        print(f"\nAffine matrix:")
        print(volume.affine)
        print(f"\nAffine[:3,:3] (rotation/scale):")
        print(volume.affine[:3, :3])
        print(f"\nAffine[:3,3] (translation):")
        print(volume.affine[:3, 3])
    
    return volume

# Test both
vol_difumo = diagnose_parcellation('difumo 64', 'Cuneus')
vol_julich = diagnose_parcellation('julich 3.1', 'Nfast (Cerebellum, Fastigial Nucleus) left')
