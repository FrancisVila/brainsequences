"""
Generate leaf region meshes and combine them into a single mesh for an ancestor region.

This script:
1. Gets all leaf regions under an ancestor in a parcellation
2. Generates meshes for each leaf region
3. Combines all meshes into a single mesh named after the ancestor
"""

import sys
from pathlib import Path

# Add scripts directory to path to import our modules
sys.path.insert(0, str(Path(__file__).parent))

from list_cerebellum_regions import get_leaf_regions
from generate_siibra_mesh import generate_region_mesh
import json


def combine_meshes(mesh_paths, output_name, output_dir):
    """
    Combine multiple mesh files into a single mesh.
    
    Args:
        mesh_paths: List of paths to .glb mesh files
        output_name: Name for the combined mesh
        output_dir: Directory to save the combined mesh
    
    Returns:
        Path to the combined mesh file, or None if failed
    """
    import trimesh
    
    print(f"\n{'='*60}")
    print(f"🔗 COMBINING MESHES INTO '{output_name}'")
    print('='*60)
    
    if not mesh_paths:
        print("❌ No mesh paths provided")
        return None
    
    meshes = []
    for mesh_path in mesh_paths:
        if mesh_path.exists():
            try:
                mesh = trimesh.load(str(mesh_path))
                meshes.append(mesh)
                print(f"✓ Loaded: {mesh_path.name}")
            except Exception as e:
                print(f"❌ Failed to load {mesh_path.name}: {e}")
        else:
            print(f"⚠️  Not found: {mesh_path.name}")
    
    if not meshes:
        print("❌ No meshes were successfully loaded")
        return None
    
    print(f"\n🔗 Combining {len(meshes)} meshes...")
    try:
        # Combine all meshes into one
        combined = trimesh.util.concatenate(meshes)
        print(f"✓ Combined mesh created")
        print(f"  Vertices: {len(combined.vertices):,}")
        print(f"  Faces: {len(combined.faces):,}")
        
        # Create safe filename
        import re
        safe_filename = re.sub(r'[^\w\s-]', '', output_name.lower())
        safe_filename = re.sub(r'[-\s]+', '_', safe_filename)
        
        # Save combined mesh
        output_file = output_dir / f'{safe_filename}.glb'
        combined.export(str(output_file))
        file_size = output_file.stat().st_size
        
        print(f"\n✅ Combined mesh saved!")
        print(f"   File: {output_file}")
        print(f"   Size: {file_size / 1024:.1f} KB")
        
        # Create metadata
        metadata = {
            'name': output_name,
            'type': 'combined_mesh',
            'source_meshes': [p.name for p in mesh_paths if p.exists()],
            'num_source_meshes': len(meshes),
            'vertices': len(combined.vertices),
            'faces': len(combined.faces),
            'bounds': combined.bounds.tolist(),
            'centroid': combined.centroid.tolist(),
            'file': f'{safe_filename}.glb',
            'file_size_bytes': file_size
        }
        
        metadata_file = output_dir / f'{safe_filename}_metadata.json'
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
        print(f"   Metadata: {metadata_file}")
        
        return output_file
        
    except Exception as e:
        print(f"❌ Failed to combine meshes: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    # 1. Define variables
    ancestor_name = "frontal cingulate gyrus"
    parcellation_name = "julich 3.1"
    
    print("="*60)
    print("GENERATING COMBINED MESH FOR ANCESTOR REGION")
    print("="*60)
    print(f"Ancestor: {ancestor_name}")
    print(f"Parcellation: {parcellation_name}")
    print("="*60)
    
    # 2. Get leaf regions
    print(f"\n📋 Step 1: Getting leaf regions...")
    leaf_regions = get_leaf_regions(ancestor_name, parcellation_name, verbose=True)
    
    if not leaf_regions:
        print(f"❌ No leaf regions found under '{ancestor_name}'")
        return
    
    print(f"\n✓ Found {len(leaf_regions)} leaf regions to process")
    
    # 3. Generate mesh for each region
    print(f"\n{'='*60}")
    print(f"🧠 Step 2: Generating meshes for {len(leaf_regions)} leaf regions")
    print('='*60)
    
    output_dir = Path(__file__).parent.parent / 'public' / 'meshes'
    output_dir.mkdir(parents=True, exist_ok=True)
    
    generated_meshes = []
    failed_regions = []
    
    for i, region in enumerate(leaf_regions, 1):
        region_name = region.name
        print(f"\n[{i}/{len(leaf_regions)}] Processing: {region_name}")
        
        # Generate mesh
        result = generate_region_mesh(region_name, output_dir, parcellation_name)
        
        if result:
            # Find the generated mesh file
            import re
            safe_filename = re.sub(r'[^\w\s-]', '', region_name.lower())
            safe_filename = re.sub(r'[-\s]+', '_', safe_filename)
            mesh_path = output_dir / f'{safe_filename}.glb'
            
            if mesh_path.exists():
                generated_meshes.append(mesh_path)
                print(f"✅ Mesh generated successfully")
            else:
                failed_regions.append(region_name)
                print(f"⚠️  Mesh file not found: {mesh_path}")
        else:
            failed_regions.append(region_name)
            print(f"❌ Failed to generate mesh")
    
    # Summary of generation
    print(f"\n{'='*60}")
    print("📊 MESH GENERATION SUMMARY")
    print('='*60)
    print(f"Total regions: {len(leaf_regions)}")
    print(f"✅ Successful: {len(generated_meshes)}")
    print(f"❌ Failed: {len(failed_regions)}")
    
    if failed_regions:
        print("\n⚠️  Failed regions:")
        for region in failed_regions:
            print(f"  - {region}")
    
    # 4. Combine all generated meshes
    if generated_meshes:
        combine_meshes(generated_meshes, ancestor_name, output_dir)
    else:
        print("\n❌ No meshes were generated, cannot create combined mesh")
    
    print(f"\n{'='*60}")
    print("🎉 PROCESS COMPLETE")
    print('='*60)


if __name__ == "__main__":
    main()
