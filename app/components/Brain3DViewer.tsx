import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';
import { Suspense, useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import xFeaturesSvg from '~/images/Xfeatures.svg';
import yFeaturesSvg from '~/images/Yfeatures.svg';
import zFeaturesSvg from '~/images/Zfeatures.svg';

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
  onSliceChangeVertical,
  backgroundFeatures,
}: {
  wholeBrainUrl: string;
  regionUrl: string;
  axis: 'x' | 'y' | 'z';
  slicePosition: number;
  currentHorizontalSlice: number;
  currentVerticalSlice: number;
  onSliceChangeHorizontal: (pos: number) => void;
  onSliceChangeVertical: (pos: number) => void;
  backgroundFeatures: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; horizontalSlice: number; verticalSlice: number } | null>(null);

  // Brain center from metadata
  const brainCenter: [number, number, number] = [84, 81, 110];

  // Per-axis configuration: camera, bounds, drag ranges, inversion flag, crosshair colors
  let cameraPosition: [number, number, number];
  let cameraUp: [number, number, number];
  let hBounds: { min: number; max: number };
  let vBounds: { min: number; max: number };
  let hDragRange: number;
  let vDragRange: number;
  let invertVertical: boolean;
  let invertHorizontal: boolean;
  let verticalLineColor: string;
  let horizontalLineColor: string;
  switch (axis) {
    case 'x':
      // X view: looking from left; horizontal=Y(green), vertical=Z(blue), Z up
      cameraPosition = [brainCenter[0] - 350, brainCenter[1], brainCenter[2]];
      cameraUp = [0, 0, 1];
      hBounds = BRAIN_BOUNDS.y;
      vBounds = BRAIN_BOUNDS.z;
      hDragRange = 336;
      vDragRange = 230;
      invertVertical = true;
      invertHorizontal = false;
      verticalLineColor = '#66ff66'; // Y axis = green
      horizontalLineColor = '#6666ff'; // Z axis = blue
      break;
    case 'y':
      // Y view: looking from front; horizontal=X(red), vertical=Z(blue), Z up
      // Camera right = cross(up, z) = cross((0,0,1),(0,1,0)) = (-1,0,0), so +X is on the LEFT of screen
      cameraPosition = [brainCenter[0], brainCenter[1] + 330, brainCenter[2]];
      cameraUp = [0, 0, 1];
      hBounds = BRAIN_BOUNDS.x;
      vBounds = BRAIN_BOUNDS.z;
      hDragRange = 267;
      vDragRange = 230;
      invertVertical = true;
      invertHorizontal = true;
      verticalLineColor = '#ff6666'; // X axis = red
      horizontalLineColor = '#6666ff'; // Z axis = blue
      break;
    case 'z':
    default:
      // Z view: looking from top; horizontal=X(red), vertical=Y(green), Y up
      cameraPosition = [brainCenter[0], brainCenter[1], brainCenter[2] + 450];
      cameraUp = [0, 1, 0];
      hBounds = BRAIN_BOUNDS.x;
      vBounds = BRAIN_BOUNDS.y;
      hDragRange = 267;
      vDragRange = 336;
      invertVertical = false;
      invertHorizontal = false;
      verticalLineColor = '#ff6666'; // X axis = red
      horizontalLineColor = '#66ff66'; // Y axis = green
      break;
  }

  function SlicedMesh() {
    const { scene: wholeBrainScene } = useGLTF(wholeBrainUrl);
    const { scene: regionScene } = useGLTF(regionUrl);
    const clonedWholeBrain = wholeBrainScene.clone();
    const clonedRegion = regionScene.clone();

    useEffect(() => {
      // Create single clipping plane for this axis
      let planeNormal: THREE.Vector3;
      switch (axis) {
        case 'x': planeNormal = new THREE.Vector3(-1, 0, 0); break;
        case 'y': planeNormal = new THREE.Vector3(0, -1, 0); break;
        case 'z':
        default: planeNormal = new THREE.Vector3(0, 0, -1); break;
      }
      const plane = new THREE.Plane(planeNormal, slicePosition);

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

    const horizontalDelta = (deltaX / rect.width) * hDragRange;
    const verticalDelta = (deltaY / rect.height) * vDragRange;

    // Apply delta to initial slice positions
    // Vertical drag is inverted for X and Y views (camera up is Z — dragging up should increase Z)
    // Horizontal drag is inverted for Y view (+X is on left of screen when looking from front)
    const newHorizontalSlice = invertHorizontal
      ? dragStartRef.current.horizontalSlice - horizontalDelta
      : dragStartRef.current.horizontalSlice + horizontalDelta;
    const newVerticalSlice = invertVertical
      ? dragStartRef.current.verticalSlice - verticalDelta
      : dragStartRef.current.verticalSlice + verticalDelta;

    // Clamp to actual brain bounds
    onSliceChangeHorizontal(Math.max(hBounds.min, Math.min(hBounds.max, newHorizontalSlice)));
    onSliceChangeVertical(Math.max(vBounds.min, Math.min(vBounds.max, newVerticalSlice)));
  };

  // Calculate crosshair positions as percentages
  // currentHorizontalSlice maps to vertical line position (left percentage)
  // currentVerticalSlice maps to horizontal line position (top percentage)
  const hRange = hBounds.max - hBounds.min;
  const vRange = vBounds.max - vBounds.min;

  const verticalLineLeft = invertHorizontal
    ? 100 - ((currentHorizontalSlice - hBounds.min) / hRange) * 100
    : ((currentHorizontalSlice - hBounds.min) / hRange) * 100;
  // Vertical crosshair is inverted for X and Y views (camera up is Z — high Z at top of screen)
  const horizontalLineTop = invertVertical
    ? 100 - ((currentVerticalSlice - vBounds.min) / vRange) * 100
    : ((currentVerticalSlice - vBounds.min) / vRange) * 100;

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
      {/* SVG background features overlay (behind crosshairs) */}
      {backgroundFeatures && (
        <img
          src={backgroundFeatures}
          alt=""
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}
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
  region?: string;
}

// Brain bounding box from metadata (in mm)
const BRAIN_BOUNDS = {
  x: { min: -50, max: 220 },
  y: { min: -90, max: 255 },
  z: { min: -10, max: 230 },
};

export function Brain3DViewer({
  wholeBrainUrl: wholeBrainMeshUrl = '/meshes/whole_brain.glb',
  region = 'fornix',
}: Brain3DViewerProps) {
  // Sanitize region name: lowercase, replace non-alphanumeric chars and spaces with underscores
  const sanitizedRegion = region.toLowerCase().replace(/[^\w\s-]/g, '_').replace(/[-\s]+/g, '_');
  const regionMeshUrl = `/meshes/${sanitizedRegion}.glb`;
  // TODO: change default slice positions to be at the center of the highlighted region (ex: cuneus) instead of the whole brain center
  const defaultSliceX = (BRAIN_BOUNDS.x.max - BRAIN_BOUNDS.x.min) / 2 + BRAIN_BOUNDS.x.min;
  const defaultSliceY = (BRAIN_BOUNDS.y.max - BRAIN_BOUNDS.y.min) / 2 + BRAIN_BOUNDS.y.min;
  const defaultSliceZ = (BRAIN_BOUNDS.z.max - BRAIN_BOUNDS.z.min) / 2 + BRAIN_BOUNDS.z.min;

  // Start at max bounds so full brain is visible
  const [sliceX, setSliceX] = useState(defaultSliceX);
  const [sliceY, setSliceY] = useState(defaultSliceY);
  const [sliceZ, setSliceZ] = useState(defaultSliceZ);

  // Track if mesh file exists
  const [meshExists, setMeshExists] = useState<boolean | null>(null);

  // Check if region mesh exists (case insensitive)
  useEffect(() => {
    const checkMeshExists = async () => {
      try {
        const response = await fetch(regionMeshUrl, { method: 'HEAD' });
        setMeshExists(response.ok);
      } catch (error) {
        setMeshExists(false);
      }
    };
    checkMeshExists();
  }, [regionMeshUrl]);

  // Show loading state while checking
  if (meshExists === null) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ fontSize: '1.2em', color: '#666' }}>
          Loading {region}...
        </div>
      </div>
    );
  }

  // Show error message if mesh file doesn't exist
  if (meshExists === false) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        border: '2px solid #ff6b35',
        borderRadius: '8px',
        backgroundColor: '#fff5f0'
      }}>
        <div style={{ fontSize: '1.5em', marginBottom: '10px' }}>⚠️</div>
        <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#ff6b35', marginBottom: '10px' }}>
          Mesh Not Found
        </div>
        <div style={{ color: '#666', marginBottom: '10px' }}>
          The 3D mesh for <strong>{region}</strong> could not be found.
        </div>
        <div style={{ fontSize: '0.9em', color: '#999' }}>
          Expected file: <code>{sanitizedRegion}.glb</code>
        </div>
      </div>
    );
  }

  return (
    <div className='brainviewer' >
      {/* Control Panel */}
      <div className="brainviewer-header" >


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
          <button
          onClick={() => { setSliceX(defaultSliceX); setSliceY(defaultSliceY); setSliceZ(defaultSliceZ); }}
          className='brainviewer-reset'>
          Reset Slices
        </button>
        </div>

      </div>

      {/* Top Row: Three Orthogonal Slice Views */}
      <div className='brainviewer-sliceviews'>
        <OrthogonalSliceView
          wholeBrainUrl={wholeBrainMeshUrl}
          regionUrl={regionMeshUrl}
          axis="x"
          slicePosition={-75 + sliceX * 1.8}
          currentHorizontalSlice={sliceY}
          currentVerticalSlice={sliceZ}
          onSliceChangeHorizontal={setSliceY}
          onSliceChangeVertical={setSliceZ}
          backgroundFeatures={xFeaturesSvg}
        />
        <OrthogonalSliceView
          wholeBrainUrl={wholeBrainMeshUrl}
          regionUrl={regionMeshUrl}
          axis="y"
          slicePosition={180 - (sliceY * 1.25)}
          currentHorizontalSlice={sliceX}
          currentVerticalSlice={sliceZ}
          onSliceChangeHorizontal={setSliceX}
          onSliceChangeVertical={setSliceZ}
          backgroundFeatures={yFeaturesSvg}
        />
        <OrthogonalSliceView
          wholeBrainUrl={wholeBrainMeshUrl}
          regionUrl={regionMeshUrl}
          axis="z"
          slicePosition={(sliceZ - 30) * 1.6}
          currentHorizontalSlice={sliceX}
          currentVerticalSlice={sliceY}
          onSliceChangeHorizontal={setSliceX}
          onSliceChangeVertical={setSliceY}
          backgroundFeatures={zFeaturesSvg}
        />

      </div>
      <p className="brainviewer-comments">Built using the Siibra API, from the human brain project, see <a href='https://siibra.io/explorer/' target='_blank' rel='noopener noreferrer'>https://siibra.io/explorer/</a> for a more detailed viewer.</p>

    </div>
  );
}

// Note: Preload removed to avoid SSR errors with relative URLs
// The mesh will load on-demand when the component renders on the client
