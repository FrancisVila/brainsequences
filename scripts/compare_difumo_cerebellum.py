"""
Compare cerebellum regions across different DiFuMo resolutions
"""

import siibra

print("🔍 Comparing cerebellum regions across DiFuMo parcellations...")

atlas = siibra.atlases.MULTILEVEL_HUMAN_ATLAS

parcellations = ['difumo 64', 'difumo 128', 'difumo 256', 'difumo 512', 'difumo 1024']

for parc_name in parcellations:
    print(f"\n{'='*60}")
    print(f"{parc_name.upper()}")
    print('='*60)
    
    try:
        parc = atlas.get_parcellation(parc_name)
        all_regions = list(parc)
        
        # Find cerebellar regions
        cerebellar = [r for r in all_regions if 'cerebell' in r.name.lower()]
        
        print(f"Total regions: {len(all_regions)}")
        print(f"Cerebellar regions: {len(cerebellar)}")
        
        if cerebellar:
            print("\nCerebellar regions found:")
            for i, region in enumerate(cerebellar, 1):
                print(f"  {i}. {region.name}")
                # Try to get some info about the region
                try:
                    if hasattr(region, 'id'):
                        print(f"     ID: {region.id}")
                except:
                    pass
        else:
            print("⚠️  No cerebellar regions found")
            
    except Exception as e:
        print(f"❌ Error loading {parc_name}: {e}")

print(f"\n{'='*60}")
print("SUMMARY")
print('='*60)
print("Based on the hierarchy of DiFuMo atlases:")
print("- Higher resolution parcellations subdivide regions from lower resolutions")
print("- DiFuMo 64 has 2 cerebellum regions (Components 9 & 21)")
print("- Higher resolutions should have more detailed subdivisions of the same areas")
