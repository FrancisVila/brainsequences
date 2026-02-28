"""
Create a simple placeholder brain mesh for testing the 3D viewer.
This creates a basic brain-shaped mesh as a proof of concept.
"""

import trimesh
import numpy as np
import json
from pathlib import Path

print("🧠 Creating placeholder brain mesh...")

# Create output directory
output_dir = Path(__file__).parent.parent / "public" / "meshes"
output_dir.mkdir(parents=True, exist_ok=True)
print(f"Output directory: {output_dir}")

# Create a brain-like shape using two overlapping spheres
# Main brain body
sphere1 = trimesh.creation.icosphere(subdivisions=4, radius=50)
sphere1.apply_translation([0, 0, 0])

# Cerebellum (smaller sphere at back-bottom)
sphere2 = trimesh.creation.icosphere(subdivisions=3, radius=25)
sphere2.apply_translation([0, -35, -20])

# Combine meshes
brain_mesh = trimesh.util.concatenate([sphere1, sphere2])

# Smooth the mesh
brain_mesh = trimesh.smoothing.filter_laplacian(brain_mesh, iterations=5)

# Apply a slight scaling to make it brain-shaped (wider than tall)
scale_matrix = np.diag([1.2, 0.9, 1.0, 1.0])
brain_mesh.apply_transform(scale_matrix)

# Color vertices based on position (simulate different brain regions)
# Create vertex colors (RGBA)
vertices = brain_mesh.vertices
colors = np.zeros((len(vertices), 4), dtype=np.uint8)

# Color based on Y coordinate (top = lighter, bottom = darker)
y_min, y_max = vertices[:, 1].min(), vertices[:, 1].max()
y_normalized = (vertices[:, 1] - y_min) / (y_max - y_min)

# Pink-ish brain colors
colors[:, 0] = (220 + 35 * (1 - y_normalized)).astype(np.uint8)  # Red
colors[:, 1] = (180 + 50 * (1 - y_normalized)).astype(np.uint8)  # Green  
colors[:, 2] = (200 + 55 * (1 - y_normalized)).astype(np.uint8)  # Blue
colors[:, 3] = 255  # Alpha

brain_mesh.visual.vertex_colors = colors

# Get mesh statistics
bounds = brain_mesh.bounds
centroid = brain_mesh.centroid
vertex_count = len(brain_mesh.vertices)
face_count = len(brain_mesh.faces)

print(f"✓ Created mesh:")
print(f"  Vertices: {vertex_count}")
print(f"  Faces: {face_count}")
print(f"  Bounds: {bounds[0]} to {bounds[1]}")
print(f"  Centroid: {centroid}")

# Export as GLB (binary GLTF)
output_path = output_dir / "v1_left.glb"
brain_mesh.export(str(output_path))
print(f"✓ Exported mesh: {output_path}")

# Create metadata
metadata = {
    "region_name": "V1 (Placeholder)",
    "description": "Placeholder brain mesh for testing 3D viewer",
    "vertex_count": vertex_count,
    "face_count": face_count,
    "bounds": {
        "min": bounds[0].tolist(),
        "max": bounds[1].tolist()
    },
    "centroid": centroid.tolist(),
    "file_size_bytes": output_path.stat().st_size
}

metadata_path = output_dir / "v1_left_metadata.json"
with open(metadata_path, 'w') as f:
    json.dump(metadata, f, indent=2)
print(f"✓ Saved metadata: {metadata_path}")

print("\n✨ Placeholder mesh created successfully!")
print(f"   Load in browser at: /meshes/v1_left.glb")
