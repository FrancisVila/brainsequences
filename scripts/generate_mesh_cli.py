"""
Wrapper script to generate mesh for a single brain region from command line
Usage: python generate_mesh_cli.py "Region Name" [parcellation]
"""

import sys
from generate_siibra_mesh import generate_region_mesh

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_mesh_cli.py 'Region Name' [parcellation]")
        sys.exit(1)
    
    region_name = sys.argv[1]
    parcellation_name = sys.argv[2] if len(sys.argv) > 2 else 'difumo 64'
    
    result = generate_region_mesh(region_name, parcellation_name=parcellation_name)
    
    # Exit with appropriate code
    sys.exit(0 if result is not None else 1)
