import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';

interface BrainMeshProps {
  url: string;
  sliceX: number;
  sliceY: number;
  sliceZ: number;
}

function BrainMesh({ url, sliceX, sliceY, sliceZ }: BrainMeshProps) {
  const { scene } = useGLTF(url);
  
  // Clone the scene to allow multiple instances and modifications
  const clonedScene = scene.clone();
  
  useEffect(() => {
    // Create clipping planes
    const planes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), sliceX),  // X axis
      new THREE.Plane(new THREE.Vector3(0, -1, 0), sliceY),  // Y axis
      new THREE.Plane(new THREE.Vector3(0, 0, -1), sliceZ),  // Z axis
    ];
    
    // Apply clipping to all meshes in the scene
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          // Clone material to avoid affecting other instances
          child.material = child.material.clone();
          child.material.clippingPlanes = planes;
          child.material.clipShadows = true;
          child.material.side = THREE.DoubleSide;  // Show interior faces
        }
      }
    });
  }, [clonedScene, sliceX, sliceY, sliceZ]);
  
  return (
    <primitive 
      object={clonedScene} 
      scale={1.0}
    />
  );
}

function SlicePlaneHelpers({ sliceX, sliceY, sliceZ }: { sliceX: number; sliceY: number; sliceZ: number }) {
  return (
    <>
      {/* X plane helper */}
      <mesh position={[-sliceX, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Y plane helper */}
      <mesh position={[0, -sliceY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Z plane helper */}
      <mesh position={[0, 0, -sliceZ]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial color="#0000ff" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

interface Brain3DViewerProps {
  meshUrl?: string;
}

export function Brain3DViewer({ meshUrl = '/meshes/v1_left.glb' }: Brain3DViewerProps) {
  const [sliceX, setSliceX] = useState(100);
  const [sliceY, setSliceY] = useState(100);
  const [sliceZ, setSliceZ] = useState(100);
  const [showHelpers, setShowHelpers] = useState(true);

  return (
    <div style={{ 
      width: '100%', 
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#1a1a1a'
    }}>
      {/* Slice Controls */}
      <div style={{
        padding: '12px',
        backgroundColor: '#2a2a2a',
        borderBottom: '1px solid #444',
        color: '#fff'
      }}>
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ minWidth: '80px', color: '#ff6666' }}>X Slice:</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            value={sliceX} 
            onChange={(e) => setSliceX(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: '50px', textAlign: 'right' }}>{sliceX}</span>
        </div>
        
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ minWidth: '80px', color: '#66ff66' }}>Y Slice:</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            value={sliceY} 
            onChange={(e) => setSliceY(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: '50px', textAlign: 'right' }}>{sliceY}</span>
        </div>
        
        <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ minWidth: '80px', color: '#6666ff' }}>Z Slice:</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            value={sliceZ} 
            onChange={(e) => setSliceZ(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ minWidth: '50px', textAlign: 'right' }}>{sliceZ}</span>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button 
            onClick={() => { setSliceX(100); setSliceY(100); setSliceZ(100); }}
            style={{ padding: '4px 8px', fontSize: '0.85em', cursor: 'pointer' }}
          >
            Reset Slices
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showHelpers}
              onChange={(e) => setShowHelpers(e.target.checked)}
            />
            <span style={{ fontSize: '0.85em' }}>Show Planes</span>
          </label>
        </div>
      </div>

      {/* 3D Viewer */}
      <div style={{ height: '500px' }}>
        <Canvas 
          camera={{ position: [0, 0, 150], fov: 50 }}
          style={{ background: '#1a1a1a' }}
          gl={{ localClippingEnabled: true }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} />
          
          {/* 3D Model */}
          <Suspense fallback={null}>
            <BrainMesh url={meshUrl} sliceX={sliceX} sliceY={sliceY} sliceZ={sliceZ} />
          </Suspense>
          
          {/* Slice plane helpers */}
          {showHelpers && <SlicePlaneHelpers sliceX={sliceX} sliceY={sliceY} sliceZ={sliceZ} />}
          
          {/* Environment for better reflections/shading */}
          <Environment preset="studio" />
          
          {/* Controls - allows rotation, zoom, pan */}
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            minDistance={50}
            maxDistance={500}
          />
        </Canvas>
      </div>
      
      {/* Instructions */}
      <div style={{ 
        padding: '8px', 
        fontSize: '0.85em', 
        color: '#999',
        backgroundColor: '#f9f9f9',
        borderTop: '1px solid #ddd'
      }}>
        <strong>Controls:</strong> Left-click + drag to rotate | Right-click + drag to pan | Scroll to zoom | Use sliders to cut through the brain
      </div>
    </div>
  );
}

// Preload the mesh
useGLTF.preload('/meshes/v1_left.glb');
