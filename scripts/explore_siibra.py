"""
Explore siibra capabilities for mesh generation
This script tests different approaches to extract volumetric data from siibra
"""

import siibra
import numpy as np

print("🔍 Exploring siibra API capabilities...\n")

# Load atlas and parcellation
atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS
print(f"Atlas: {atlas.name}")

parcellation = atlas.get_parcellation('julich 2.9')
print(f"Parcellation: {parcellation.name}")
print(f"Parcellation type: {type(parcellation)}")
print(f"Parcellation attributes: {[a for a in dir(parcellation) if not a.startswith('_')]}\n")

# Try to get a specific region
region_name = "hOc1"  # V1 left hemisphere
try:
    region = parcellation.get_region(region_name)
    print(f"Test Region: {region.name}")
    print(f"Region type: {type(region)}")
    print(f"Region attributes: {[a for a in dir(region) if not a.startswith('_')]}\n")
except Exception as e:
    print(f"❌ Could not get region: {e}")
    region = None

# Test 1: Try to get maps for this region
print("=" * 60)
print("TEST 1: Region maps")
print("=" * 60)
if region:
    try:
        maps = region.get_regional_maps()
        print(f"✓ Found {len(maps)} maps for {region.name}")
        for i, m in enumerate(maps):
            print(f"  {i+1}. {m}")
    except Exception as e:
        print(f"❌ get_regional_maps() failed: {e}")
else:
    print("⚠ Skipping - no region loaded")

# Test 2: Try parcellation-level map
print("\n" + "=" * 60)
print("TEST 2: Parcellation map")
print("=" * 60)
try:
    template_space = siibra.spaces.MNI_152_ICBM_2009C_NONLINEAR_ASYMMETRIC
    parcel_map = parcellation.get_map(
        space=template_space,
        maptype='labelled'
    )
    print(f"✓ Got parcellation map")
    print(f"  Map type: {type(parcel_map)}")
    print(f"  Map attributes: {[a for a in dir(parcel_map) if not a.startswith('_')]}")
    
    # Try to fetch the volume
    print("\n  Fetching volume data...")
    volume = parcel_map.fetch()
    print(f"  ✓ Volume type: {type(volume)}")
    data = volume.get_fdata()
    print(f"  ✓ Data shape: {data.shape}")
    print(f"  ✓ Data range: {data.min():.1f} to {data.max():.1f}")
    print(f"  ✓ Unique labels: {len(np.unique(data))}")
    print(f"  ✓ Non-zero voxels: {(data > 0).sum()}")
    
    # Check if we can get region-specific label
    print(f"\n  Looking for region-specific label...")
    if region:
        print(f"  Region ID: {region.id if hasattr(region, 'id') else 'N/A'}")
        print(f"  Region name: {region.name}")
    else:
        print(f"  ⚠ No region loaded to check")
    
except Exception as e:
    print(f"❌ Parcellation map fetch failed: {e}")
    import traceback
    traceback.print_exc()

# Test 3: Check available spaces
print("\n" + "=" * 60)
print("TEST 3: Available reference spaces")
print("=" * 60)
try:
    spaces = siibra.spaces
    space_list = [s for s in dir(spaces) if not s.startswith('_') and s.isupper()]
    print("Available spaces:")
    for space_name in space_list[:10]:
        print(f"  - {space_name}")
except Exception as e:
    print(f"❌ Failed: {e}")

# Test 4: Try to get bounding box or spatial extent
print("\n" + "=" * 60)
print("TEST 4: Region spatial information")
print("=" * 60)
if region:
    try:
        if hasattr(region, 'spatial_props'):
            print(f"Spatial properties: {region.spatial_props}")
        if hasattr(region, 'get_bounding_box'):
            bbox = region.get_bounding_box()
            print(f"Bounding box: {bbox}")
        if hasattr(region, 'attrs'):
            print(f"Attributes: {region.attrs}")
        
        # Try different methods
        for method in ['get_regional_map', 'get_map', 'get_mask', 'map', 'masks']:
            if hasattr(region, method):
                print(f"✓ Region has method: {method}")
    except Exception as e:
        print(f"❌ Failed: {e}")
else:
    print("⚠ Skipping - no region loaded")

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
print("For mesh generation, we need to:")
print("1. Get volumetric data (3D array) for a specific region")
print("2. Identify which voxels belong to that region")
print("3. Run marching cubes to create mesh")
print("4. Export as .glb format")
