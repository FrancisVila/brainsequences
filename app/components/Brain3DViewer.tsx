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

interface DualBrainMeshProps {
  wholeBrainUrl: string;
  regionUrl: string;
  sliceX: number;
  sliceY: number;
  sliceZ: number;
}

function DualBrainMesh({ wholeBrainUrl, regionUrl, sliceX, sliceY, sliceZ }: DualBrainMeshProps) {
  const { scene: wholeBrainScene } = useGLTF(wholeBrainUrl);
  const { scene: regionScene } = useGLTF(regionUrl);
  
  const clonedWholeBrain = wholeBrainScene.clone();
  const clonedRegion = regionScene.clone();
  
  useEffect(() => {
    const planes = [
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), sliceX),
      new THREE.Plane(new THREE.Vector3(0, -1, 0), sliceY),
      new THREE.Plane(new THREE.Vector3(0, 0, -1), sliceZ),
    ];
    
    // Style whole brain - semi-transparent gray
    clonedWholeBrain.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x999999,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            clippingPlanes: planes,
            clipShadows: true,
          });
        }
      }
    });
    
    // Style region - bright color (orange/red)
    clonedRegion.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xff6b35,
            transparent: false,
            side: THREE.DoubleSide,
            clippingPlanes: planes,
            clipShadows: true,
          });
        }
      }
    });
  }, [clonedWholeBrain, clonedRegion, sliceX, sliceY, sliceZ]);
  
  return (
    <>
      <primitive object={clonedWholeBrain} scale={1.0} />
      <primitive object={clonedRegion} scale={1.0} />
    </>
  );
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

// Helper component to set camera target
function CameraController({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  
  useEffect(() => {
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, target]);
  
  return null;
}

// Orthogonal slice view - single plane with clipping
function OrthogonalSliceView({ 
  wholeBrainUrl,
  regionUrl,
  axis, 
  slicePosition,
  currentHorizontalSlice,
  currentVerticalSlice,
  onSliceChangeHorizontal,
  onSliceChangeVertical
}: { 
  wholeBrainUrl: string;
  regionUrl: string;
  axis: 'x' | 'y' | 'z'; 
  slicePosition: number;
  currentHorizontalSlice: number;
  currentVerticalSlice: number;
  onSliceChangeHorizontal: (pos: number) => void;
  onSliceChangeVertical: (pos: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; horizontalSlice: number; verticalSlice: number } | null>(null);
  
  // Brain center from metadata
  const brainCenter: [number, number, number] = [84, 81, 110];
  
  // Set up camera based on axis - position relative to brain center
  const cameraPosition = 
    axis === 'x' ? [brainCenter[0] + 300, brainCenter[1], brainCenter[2]] : 
    axis === 'y' ? [brainCenter[0], brainCenter[1] + 300, brainCenter[2]] : 
    [brainCenter[0], brainCenter[1], brainCenter[2] + 300];
  
  const cameraRotation =
    axis === 'x' ? [0, -Math.PI / 2, 0] :
    axis === 'y' ? [-Math.PI / 2, 0, 0] :
    [0, 0, 0];

  function SlicedMesh() {
    const { scene: wholeBrainScene } = useGLTF(wholeBrainUrl);
    const { scene: regionScene } = useGLTF(regionUrl);
    const clonedWholeBrain = wholeBrainScene.clone();
    const clonedRegion = regionScene.clone();
    
    useEffect(() => {
      // Create single clipping plane for this axis
      const plane = 
        axis === 'x' ? new THREE.Plane(new THREE.Vector3(-1, 0, 0), slicePosition) :
        axis === 'y' ? new THREE.Plane(new THREE.Vector3(0, -1, 0), slicePosition) :
        new THREE.Plane(new THREE.Vector3(0, 0, -1), slicePosition);
      
      // Style whole brain
      clonedWholeBrain.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x999999,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            clippingPlanes: [plane],
            clipShadows: true,
          });
        }
      });
      
      // Style region
      clonedRegion.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0xff6b35,
            transparent: false,
            side: THREE.DoubleSide,
            clippingPlanes: [plane],
            clipShadows: true,
          });
        }
      });
    }, [clonedWholeBrain, clonedRegion, slicePosition]);
    
    return (
      <>
        <primitive object={clonedWholeBrain} scale={1.0} />
        <primitive object={clonedRegion} scale={1.0} />
      </>
    );
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Store initial mouse position and slice values
    dragStartRef.current = {
      x,
      y,
      horizontalSlice: currentHorizontalSlice,
      verticalSlice: currentVerticalSlice
    };
    
    setIsDragging(true);
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !canvasRef.current || !dragStartRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate delta from initial position
    const deltaX = x - dragStartRef.current.x;
    const deltaY = y - dragStartRef.current.y;
    
    // Convert pixel delta to slice position delta (-100 to 100 range over canvas size)
    const horizontalDelta = (deltaX / rect.width) * 200;
    const verticalDelta = (deltaY / rect.height) * 200;
    
    // Apply delta to initial slice positions
    const newHorizontalSlice = dragStartRef.current.horizontalSlice + horizontalDelta;
    const newVerticalSlice = dragStartRef.current.verticalSlice + verticalDelta;
    
    // Update the appropriate slice positions based on axis
    // Left/right controls horizontal, up/down controls vertical
    onSliceChangeHorizontal(Math.max(-100, Math.min(100, newHorizontalSlice)));
    onSliceChangeVertical(Math.max(-100, Math.min(100, newVerticalSlice)));
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
        <CameraController target={brainCenter} />
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
  wholeBrainUrl?: string;
  regionUrl?: string;
}

export function Brain3DViewer({ 
  wholeBrainUrl = '/meshes/whole_brain.glb',
  regionUrl = '/meshes/cuneus.glb' 
}: Brain3DViewerProps) {
  const [sliceX, setSliceX] = useState(0);
  const [sliceY, setSliceY] = useState(0);
  const [sliceZ, setSliceZ] = useState(0);

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
          wholeBrainUrl={wholeBrainUrl}
          regionUrl={regionUrl}
          axis="x" 
          slicePosition={sliceX}
          currentHorizontalSlice={sliceY}
          currentVerticalSlice={sliceZ}
          onSliceChangeHorizontal={setSliceY}
          onSliceChangeVertical={setSliceZ}
        />
        <OrthogonalSliceView 
          wholeBrainUrl={wholeBrainUrl}
          regionUrl={regionUrl}
          axis="y" 
          slicePosition={sliceY}
          currentHorizontalSlice={sliceX}
          currentVerticalSlice={sliceZ}
          onSliceChangeHorizontal={setSliceX}
          onSliceChangeVertical={setSliceZ}
        />
        <OrthogonalSliceView 
          wholeBrainUrl={wholeBrainUrl}
          regionUrl={regionUrl}
          axis="z" 
          slicePosition={sliceZ}
          currentHorizontalSlice={sliceX}
          currentVerticalSlice={sliceY}
          onSliceChangeHorizontal={setSliceX}
          onSliceChangeVertical={setSliceY}
        />
      </div>

      {/* Bottom Row: 3D Rotatable View - Temporarily disabled */}
      {/* 
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
            camera={{ position: [234, 181, 260], fov: 50 }}
            style={{ background: '#1a1a1a' }}
            gl={{ localClippingEnabled: true }}
          >
            <CameraController target={[84, 81, 110]} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            
            <Suspense fallback={null}>
              <DualBrainMesh 
                wholeBrainUrl={wholeBrainUrl} 
                regionUrl={regionUrl}
                sliceX={sliceX} 
                sliceY={sliceY} 
                sliceZ={sliceZ} 
              />
            </Suspense>
            
            {showHelpers && <SlicePlaneHelpers sliceX={sliceX} sliceY={sliceY} sliceZ={sliceZ} />}
            
            <Environment preset="studio" />
            
            <OrbitControls 
              enableDamping
              dampingFactor={0.05}
              minDistance={50}
              maxDistance={500}
              target={[84, 81, 110]}
            />
          </Canvas>
        </div>
      </div>
      */}
    </div>
  );
}

// Note: Preload removed to avoid SSR errors with relative URLs
// The mesh will load on-demand when the component renders on the client
