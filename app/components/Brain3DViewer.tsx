import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BrainMeshProps {
  url: string;
  sliceX: number;
  sliceY: number;
  sliceZ: number;
}

function BrainMesh({ url, sliceX, sliceY, sliceZ }: BrainMeshProps) {
  const { scene } = useGLTF(url);
  const clonedScene = scene.clone();
  
  useEffect(() => {
    const planes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), sliceX),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), sliceY),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), sliceZ),
    ];
    
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          child.material = child.material.clone();
          child.material.clippingPlanes = planes;
          child.material.clipShadows = true;
          child.material.side = THREE.DoubleSide;
        }
      }
    });
  }, [clonedScene, sliceX, sliceY, sliceZ]);
  
  return <primitive object={clonedScene} scale={1.0} />;
}

// Orthogonal slice view - single plane with clipping
function OrthogonalSliceView({ 
  url, 
  axis, 
  slicePosition, 
  onSliceChange 
}: { 
  url: string; 
  axis: 'x' | 'y' | 'z'; 
  slicePosition: number;
  onSliceChange: (pos: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Set up camera based on axis
  const cameraPosition = 
    axis === 'x' ? [150, 0, 0] : 
    axis === 'y' ? [0, 150, 0] : 
    [0, 0, 150];
  
  const cameraRotation =
    axis === 'x' ? [0, Math.PI / 2, 0] :
    axis === 'y' ? [-Math.PI / 2, 0, 0] :
    [0, 0, 0];

  function SlicedMesh() {
    const { scene: loadedScene } = useGLTF(url);
    const clonedScene = loadedScene.clone();
    
    useEffect(() => {
      // Create single clipping plane for this axis
      const plane = 
        axis === 'x' ? new THREE.Plane(new THREE.Vector3(-1, 0, 0), slicePosition) :
        axis === 'y' ? new THREE.Plane(new THREE.Vector3(0, -1, 0), slicePosition) :
        new THREE.Plane(new THREE.Vector3(0, 0, -1), slicePosition);
      
      clonedScene.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.material = child.material.clone();
          child.material.clippingPlanes = [plane];
          child.material.clipShadows = true;
          child.material.side = THREE.DoubleSide;
        }
      });
    }, [clonedScene, slicePosition]);
    
    return <primitive object={clonedScene} scale={1.0} />;
  }

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Map mouse position to slice position (-100 to 100)
    let newSlice;
    if (axis === 'x') {
      newSlice = ((y / rect.height) * 200) - 100;
    } else if (axis === 'y') {
      newSlice = ((y / rect.height) * 200) - 100;
    } else {
      newSlice = ((x / rect.width) * 200) - 100;
    }
    
    onSliceChange(Math.max(-100, Math.min(100, newSlice)));
  };

  return (
    <div 
      style={{ position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <Canvas 
        ref={canvasRef}
        camera={{ 
          position: cameraPosition as [number, number, number],
          fov: 50,
          rotation: cameraRotation as [number, number, number]
        }}
        style={{ background: '#1a1a1a', width: '100%', height: '250px' }}
        gl={{ localClippingEnabled: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={cameraPosition as [number, number, number]} intensity={1} />
        
        <Suspense fallback={null}>
          <SlicedMesh />
        </Suspense>
        
        <Environment preset="studio" />
      </Canvas>
      
      {/* Crosshair indicator */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '2px',
          height: '20px',
          backgroundColor: 'rgba(255, 255, 0, 0.5)'
        }} />
        <div style={{
          position: 'absolute',
          width: '20px',
          height: '2px',
          backgroundColor: 'rgba(255, 255, 0, 0.5)'
        }} />
      </div>
      
      {/* Axis label */}
      <div style={{
        position: 'absolute',
        top: '5px',
        left: '5px',
        color: '#fff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '2px 6px',
        fontSize: '0.8em',
        borderRadius: '3px',
        pointerEvents: 'none'
      }}>
        {axis.toUpperCase()} Axis
      </div>
    </div>
  );
}

function SlicePlaneHelpers({ sliceX, sliceY, sliceZ }: { sliceX: number; sliceY: number; sliceZ: number }) {
  return (
    <>
      <mesh position={[-sliceX, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[0, -sliceY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      
      <mesh position={[0, 0, -sliceZ]}>
        <planeGeometry args={[150, 150]} />
        <meshBasicMaterial color="#0000ff" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

interface Brain3DViewerProps {
  meshUrl?: string;
}

export function Brain3DViewer({ meshUrl = '/meshes/cuneus.glb' }: Brain3DViewerProps) {
  const [sliceX, setSliceX] = useState(0);
  const [sliceY, setSliceY] = useState(0);
  const [sliceZ, setSliceZ] = useState(0);
  const [showHelpers, setShowHelpers] = useState(true);

  return (
    <div style={{ 
      width: '100%', 
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#1a1a1a'
    }}>
      {/* Control Panel */}
      <div style={{
        padding: '12px',
        backgroundColor: '#2a2a2a',
        borderBottom: '1px solid #444',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Multi-View Brain Viewer</strong>
            <div style={{ fontSize: '0.85em', color: '#aaa', marginTop: '4px' }}>
              Drag in any slice view to change position
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={() => { setSliceX(0); setSliceY(0); setSliceZ(0); }}
              style={{ 
                padding: '6px 12px', 
                fontSize: '0.85em', 
                cursor: 'pointer',
                backgroundColor: '#444',
                color: '#fff',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              Reset Slices
            </button>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.85em' }}>
              <input 
                type="checkbox" 
                checked={showHelpers}
                onChange={(e) => setShowHelpers(e.target.checked)}
              />
              <span>Show Planes (3D view)</span>
            </label>
          </div>
        </div>
        
        {/* Slice position indicators */}
        <div style={{ 
          marginTop: '12px', 
          display: 'flex', 
          gap: '20px',
          fontSize: '0.85em',
          paddingTop: '8px',
          borderTop: '1px solid #444'
        }}>
          <div>
            <span style={{ color: '#ff6666' }}>X:</span> {sliceX.toFixed(1)}
          </div>
          <div>
            <span style={{ color: '#66ff66' }}>Y:</span> {sliceY.toFixed(1)}
          </div>
          <div>
            <span style={{ color: '#6666ff' }}>Z:</span> {sliceZ.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Top Row: Three Orthogonal Slice Views */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '1px',
        backgroundColor: '#444'
      }}>
        <OrthogonalSliceView 
          url={meshUrl} 
          axis="x" 
          slicePosition={sliceX}
          onSliceChange={setSliceX}
        />
        <OrthogonalSliceView 
          url={meshUrl} 
          axis="y" 
          slicePosition={sliceY}
          onSliceChange={setSliceY}
        />
        <OrthogonalSliceView 
          url={meshUrl} 
          axis="z" 
          slicePosition={sliceZ}
          onSliceChange={setSliceZ}
        />
      </div>

      {/* Bottom Row: 3D Rotatable View */}
      <div style={{ borderTop: '1px solid #444' }}>
        <div style={{
          padding: '8px',
          backgroundColor: '#2a2a2a',
          color: '#fff',
          fontSize: '0.85em'
        }}>
          <strong>3D View</strong> - Drag to rotate, right-click to pan, scroll to zoom
        </div>
        <div style={{ height: '400px' }}>
          <Canvas 
            camera={{ position: [150, 100, 150], fov: 50 }}
            style={{ background: '#1a1a1a' }}
            gl={{ localClippingEnabled: true }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            
            <Suspense fallback={null}>
              <BrainMesh url={meshUrl} sliceX={sliceX} sliceY={sliceY} sliceZ={sliceZ} />
            </Suspense>
            
            {showHelpers && <SlicePlaneHelpers sliceX={sliceX} sliceY={sliceY} sliceZ={sliceZ} />}
            
            <Environment preset="studio" />
            
            <OrbitControls 
              enableDamping
              dampingFactor={0.05}
              minDistance={50}
              maxDistance={500}
            />
          </Canvas>
        </div>
      </div>
    </div>
  );
}

// Note: Preload removed to avoid SSR errors with relative URLs
// The mesh will load on-demand when the component renders on the client
