import siibra
import json

def get_all_difumo_regions():
    """Get all regions from all DiFuMo parcellations"""
    
    # DiFuMo parcellation names
    parcellations = [
        'difumo 64',
        'difumo 128',
        'difumo 256',
        'difumo 512',
        'difumo 1024'
    ]
    
    result = {}
    
    for parcellation_name in parcellations:
        print(f"\n🔍 Processing {parcellation_name}...")
        
        try:
            # Load parcellation
            parcellation = siibra.parcellations.get(parcellation_name)
            
            # Get all regions
            regions = []
            for region in parcellation:
                regions.append(region.name)
            
            result[parcellation_name] = sorted(regions)
            print(f"   Found {len(regions)} regions")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            result[parcellation_name] = []
    
    return result

def main():
    print("=" * 60)
    print("Exporting all DiFuMo regions")
    print("=" * 60)
    
    # Get all regions
    difumo_regions = get_all_difumo_regions()
    
    # Save to JSON file
    output_file = 'difumo_regions.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(difumo_regions, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 60)
    print(f"✅ Saved to {output_file}")
    print("=" * 60)
    
    # Summary
    print("\nSummary:")
    for parc, regions in difumo_regions.items():
        print(f"  {parc}: {len(regions)} regions")

if __name__ == "__main__":
    main()
