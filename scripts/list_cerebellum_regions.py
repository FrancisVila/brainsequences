"""
List all leaf regions under a given ancestor region in a parcellation
"""

import siibra
from typing import List, Optional


def get_leaf_regions(ancestor_name: str, parcellation_name: str, verbose: bool = True) -> List:
    """
    Get all leaf regions (regions with no children) under a given ancestor region.
    
    Args:
        ancestor_name: Name of the ancestor region to search under
        parcellation_name: Name of the parcellation to use (e.g., 'julich 3.1', 'difumo 64')
        verbose: Whether to print progress information
    
    Returns:
        List of leaf region objects, or empty list if ancestor not found
    """
    if verbose:
        print(f"🔍 Loading parcellation: {parcellation_name}...")
    
    # Load atlas and parcellation
    atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS
    parcellation = atlas.get_parcellation(parcellation_name)
    
    if verbose:
        print(f"✓ Atlas: {atlas.name}")
        print(f"✓ Parcellation: {parcellation.name}")
    
    # Find ancestor region
    if verbose:
        print(f"\n🔍 Searching for '{ancestor_name}' region...")
    
    ancestor = None
    try:
        ancestor = parcellation.get_region(ancestor_name)
        if verbose:
            print(f"✓ Found: {ancestor.name}")
    except Exception as e:
        if verbose:
            print(f"❌ Error finding '{ancestor_name}': {e}")
            print(f"\nTrying to find regions with '{ancestor_name.lower()}' in the name...")
            all_regions = list(parcellation.regions)
            matching_regions = [r for r in all_regions if ancestor_name.lower() in r.name.lower()]
            if matching_regions:
                print(f"\nFound {len(matching_regions)} matching regions:")
                for r in matching_regions[:10]:
                    print(f"  - {r.name}")
        return []
    
    # Get all descendant regions
    if verbose:
        print(f"\n📋 Getting all descendant regions of {ancestor.name}...")
    descendants = list(ancestor.descendants)
    if verbose:
        print(f"✓ Found {len(descendants)} descendant regions")
    
    # Filter for leaf regions only (regions with no children)
    leaf_regions = [r for r in descendants if not list(r.children)]
    if verbose:
        print(f"✓ Found {len(leaf_regions)} leaf regions")
    
    return leaf_regions


if __name__ == "__main__":
    # Example usage: Get Cerebellum leaf regions from Julich-Brain v3.1
    ancestor_name = "Cerebellum"
    parcellation_name = "julich 3.1"
    
    leaf_regions = get_leaf_regions(ancestor_name, parcellation_name, verbose=True)
    
    if leaf_regions:
        # Print all leaf regions
        print(f"\n{'='*60}")
        print(f"LEAF REGIONS UNDER {ancestor_name.upper()} ({len(leaf_regions)} total)")
        print('='*60)
        
        for i, region in enumerate(sorted(leaf_regions, key=lambda r: r.name), 1):
            print(f"{i:3d}. {region.name}")
            # Show parent if available
            if hasattr(region, 'parent') and region.parent:
                print(f"      Parent: {region.parent.name}")
        
        print(f"\n{'='*60}")
        print(f"✅ Complete! Found {len(leaf_regions)} leaf regions under {ancestor_name}")
        print('='*60)
    else:
        print(f"\n❌ No leaf regions found under '{ancestor_name}'")
        print(f"   Parcellation: {parcellation_name}")
