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





// Helper component to set camera target and up vector
function CameraController({ target, up }: { target: [number, number, number]; up?: [number, number, number] }) {
  const { camera } = useThree();
  
  useEffect(() => {
    if (up) {
      camera.up.set(up[0], up[1], up[2]);
    }
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, target, up]);
  
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
  
  // changed [brainCenter[0] - 300 to [brainCenter[0] - 350 to better fit the view in the x-axis slice view
  // Set up camera based on axis - position relative to brain center
  const cameraPosition = 
    axis === 'x' ? [brainCenter[0] - 350, brainCenter[1], brainCenter[2]] : 
    axis === 'y' ? [brainCenter[0], brainCenter[1] + 330, brainCenter[2]] : 
    [brainCenter[0], brainCenter[1], brainCenter[2] + 450];
  
  // Set up vector for each axis view
  // X axis: Z up (top of brain at top), Y horizontal (front at left)
  // Y axis: Z up (top of brain at top), X horizontal
  // Z axis: default Y up
  const cameraUp: [number, number, number] = 
    axis === 'x' ? [0, 0, 1] :
    axis === 'y' ? [0, 0, 1] :
    [0, 1, 0];

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
            color: 0xffffff,
            transparent: true,
            opacity: 0.4,
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
    
    // Scale drag so full canvas sweep = full brain range for each axis
    // X view: horizontal=Y(336), vertical=Z(230)
    // Y view: horizontal=X(267), vertical=Z(230)
    // Z view: horizontal=X(267), vertical=Y(336)
    let hRange, vRange, hBounds, vBounds;
    switch (axis) {
      case 'x':
        // X view: horizontal=Y, vertical=Z
        hRange = 336;
        vRange = 230;
        hBounds = BRAIN_BOUNDS.y;
        vBounds = BRAIN_BOUNDS.z;
        break;
      case 'y':
        // Y view: horizontal=X, vertical=Z
        hRange = 267;
        vRange = 230;
        hBounds = BRAIN_BOUNDS.x;
        vBounds = BRAIN_BOUNDS.z;
        break;
      case 'z':
        // Z view: horizontal=X, vertical=Y

        hRange = 267;
        vRange = 336;
        hBounds = BRAIN_BOUNDS.x;
        vBounds = BRAIN_BOUNDS.y;
        break;
    }

    // const hRange = axis === 'x' ? 336 : axis === 'y' ? 267 : 267;
    // const vRange = axis === 'x' ? 230 : axis === 'y' ? 230 : 336;
    const horizontalDelta = (deltaX / rect.width) * hRange;
    const verticalDelta = (deltaY / rect.height) * vRange;
    
    // Apply delta to initial slice positions
    const newHorizontalSlice = dragStartRef.current.horizontalSlice + horizontalDelta;
    const newVerticalSlice = dragStartRef.current.verticalSlice + verticalDelta;
    
    // Clamp to actual brain bounds
    onSliceChangeHorizontal(Math.max(hBounds.min, Math.min(hBounds.max, newHorizontalSlice)));
    onSliceChangeVertical(Math.max(vBounds.min, Math.min(vBounds.max, newVerticalSlice)));
  };

  // Calculate crosshair positions as percentages
  // currentHorizontalSlice maps to vertical line position (left percentage)
  // currentVerticalSlice maps to horizontal line position (top percentage)
  let hBounds, vBounds;
  switch (axis) {
    case 'x':
      // X view: horizontal=Y, vertical=Z
      hBounds = BRAIN_BOUNDS.y;
      vBounds = BRAIN_BOUNDS.z;
      break;
    case 'y':
      // Y view: horizontal=X, vertical=Z
      hBounds = BRAIN_BOUNDS.x;
      vBounds = BRAIN_BOUNDS.z;
      break;
    case 'z':
      // Z view: horizontal=X, vertical=Y
      hBounds = BRAIN_BOUNDS.x;
      vBounds = BRAIN_BOUNDS.y;
      break;
  }
  const hRange = hBounds.max - hBounds.min;
  const vRange = vBounds.max - vBounds.min;
  
  const verticalLineLeft = ((currentHorizontalSlice - hBounds.min) / hRange) * 100;
  const horizontalLineTop = ((currentVerticalSlice - vBounds.min) / vRange) * 100;
  
  // Determine colors based on which axes are being shown
  // X view: horizontal=Y(green), vertical=Z(blue)
  // Y view: horizontal=X(red), vertical=Z(blue)
  // Z view: horizontal=X(red), vertical=Y(green)
  const verticalLineColor = axis === 'x' ? '#66ff66' : '#ff6666'; // Y=green, X=red
  const horizontalLineColor = axis === 'z' ? '#66ff66' : '#6666ff'; // Y=green, Z=blue

  return (
    <div 
      style={{ position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div>

</div>
      <Canvas 
        ref={canvasRef}
        camera={{ 
          position: cameraPosition as [number, number, number],
          fov: 50
        }}
        style={{ background: '#FFF', width: '350px', height: '250px' }}
        gl={{ localClippingEnabled: true }}
      >
        <CameraController target={brainCenter} up={cameraUp} />
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
      
      {/* Slice position crosshairs */}
      {/* Vertical line showing horizontal slice position */}
      <div style={{
        position: 'absolute',
        left: `${verticalLineLeft}%`,
        top: 0,
        bottom: 0,
        width: '2px',
        backgroundColor: verticalLineColor,
        opacity: 0.7,
        pointerEvents: 'none'
      }} />
      
      {/* Horizontal line showing vertical slice position */}
      <div style={{
        position: 'absolute',
        top: `${horizontalLineTop}%`,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: horizontalLineColor,
        opacity: 0.7,
        pointerEvents: 'none'
      }} />
      
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



interface Brain3DViewerProps {
  wholeBrainUrl?: string;
  regionUrl?: string;
}

// Brain bounding box from metadata (in mm)
const BRAIN_BOUNDS = {
  x: { min: -50, max: 220 },
  y: { min: -90, max: 255 },
  z: { min: -10, max: 230 },
};

export function Brain3DViewer({ 
  wholeBrainUrl = '/meshes/whole_brain.glb',
  regionUrl = '/meshes/central_sulcus.glb' 
}: Brain3DViewerProps) {
  
  // TODO: change default slice positions to be at the center of the highlighted region (ex: cuneus) instead of the whole brain center
  const defaultSliceX = (BRAIN_BOUNDS.x.max - BRAIN_BOUNDS.x.min) / 2 + BRAIN_BOUNDS.x.min;
  const defaultSliceY = (BRAIN_BOUNDS.y.max - BRAIN_BOUNDS.y.min) / 2 + BRAIN_BOUNDS.y.min;
  const defaultSliceZ = (BRAIN_BOUNDS.z.max - BRAIN_BOUNDS.z.min) / 2 + BRAIN_BOUNDS.z.min;
  
  // Start at max bounds so full brain is visible
  const [sliceX, setSliceX] = useState(defaultSliceX);
  const [sliceY, setSliceY] = useState(defaultSliceY);
  const [sliceZ, setSliceZ] = useState(defaultSliceZ);

  return (
    <div >
      {/* Control Panel */}
      <div className="brainviewer-header" >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Cuneus</strong>
            <div style={{ fontSize: '0.85em', color: '#aaa', marginTop: '4px' }}>
              Drag in any slice view to change position
            </div>
          </div>
          <div >
            <button 
              onClick={() => { setSliceX(defaultSliceX); setSliceY(defaultSliceY); setSliceZ(defaultSliceZ); }}
              className='brainviewer-reset'
            >
              Reset Slices
            </button>
          </div>
        </div>
        
        {/* Slice position indicators */}
        <div className='brainviewer-XYZ' >
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
      <div className='brainviewer-sliceviews'>
        <OrthogonalSliceView 
          wholeBrainUrl={wholeBrainUrl}
          regionUrl={regionUrl}
          axis="x" 
          slicePosition={-75+sliceX*1.8}
          currentHorizontalSlice={sliceY}
          currentVerticalSlice={sliceZ}
          onSliceChangeHorizontal={setSliceY}
          onSliceChangeVertical={setSliceZ}
        />
        <OrthogonalSliceView 
          wholeBrainUrl={wholeBrainUrl}
          regionUrl={regionUrl}
          axis="y" 
          slicePosition={180-(sliceY*1.25)}
          currentHorizontalSlice={sliceX}
          currentVerticalSlice={sliceZ}
          onSliceChangeHorizontal={setSliceX}
          onSliceChangeVertical={setSliceZ}
        />
        <OrthogonalSliceView 
          wholeBrainUrl={wholeBrainUrl}
          regionUrl={regionUrl}
          axis="z" 
          slicePosition={(sliceZ-30)*1.6}
          currentHorizontalSlice={sliceX}
          currentVerticalSlice={sliceY}
          onSliceChangeHorizontal={setSliceX}
          onSliceChangeVertical={setSliceY}
        />
      </div>

     
    </div>
  );
}

// Note: Preload removed to avoid SSR errors with relative URLs
// The mesh will load on-demand when the component renders on the client
