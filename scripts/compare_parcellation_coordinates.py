"""
Compare coordinate systems between DiFuMo and Julich-Brain parcellations
"""

import siibra
import numpy as np

print("🔍 Comparing parcellation coordinate systems...")

# Load atlas
atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS
template_space = siibra.spaces.MNI_152_ICBM_2009C_NONLINEAR_ASYMMETRIC

# Test DiFuMo 64
print("\n" + "="*60)
print("DIFUMO 64")
print("="*60)
parcellation_difumo = atlas.get_parcellation('difumo 64')
region_difumo = parcellation_difumo.get_region('Cuneus')
parcel_map_difumo = parcellation_difumo.get_map(space=template_space, maptype='labelled')
volume_difumo = parcel_map_difumo.fetch()

print(f"Region: {region_difumo.name}")
print(f"Volume shape: {volume_difumo.shape}")
print(f"Affine matrix:\n{volume_difumo.affine}")
print(f"Voxel spacing: {volume_difumo.header.get_zooms()}")

# Test Julich-Brain
print("\n" + "="*60)
print("JULICH-BRAIN 3.1")
print("="*60)
parcellation_julich = atlas.get_parcellation('julich 3.1')
region_julich = parcellation_julich.get_region('Cerebellum')
# Get a leaf region
leaf_regions = [r for r in region_julich.descendants if not list(r.children)]
region_julich_leaf = leaf_regions[0]
print(f"Leaf region: {region_julich_leaf.name}")

parcel_map_julich = parcellation_julich.get_map(space=template_space, maptype='labelled')
volume_julich = parcel_map_julich.fetch()

print(f"Volume shape: {volume_julich.shape}")
print(f"Affine matrix:\n{volume_julich.affine}")
print(f"Voxel spacing: {volume_julich.header.get_zooms()}")

# Compare
print("\n" + "="*60)
print("COMPARISON")
print("="*60)
print(f"Shape match: {volume_difumo.shape == volume_julich.shape}")
print(f"Affine match: {np.allclose(volume_difumo.affine, volume_julich.affine)}")
print(f"Spacing match: {volume_difumo.header.get_zooms() == volume_julich.header.get_zooms()}")

# Check origin
print(f"\nDiFuMo origin (affine translation): {volume_difumo.affine[:3, 3]}")
print(f"Julich origin (affine translation): {volume_julich.affine[:3, 3]}")

# Check a sample voxel transformation
test_voxel = np.array([100, 100, 100, 1])
world_difumo = volume_difumo.affine @ test_voxel
world_julich = volume_julich.affine @ test_voxel
print(f"\nTest voxel [100, 100, 100] in world coords:")
print(f"  DiFuMo: {world_difumo[:3]}")
print(f"  Julich: {world_julich[:3]}")
