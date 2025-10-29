// src/DesktopViewer.js
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

// R3F component to load and display the GLB model


function ModelR3F() {
  return (
    <mesh scale={0.4}> {/* Adjust scale */}
      <boxGeometry args={[1, 1, 1]} /> {/* Example dimensions */}
      <meshStandardMaterial color="dodgerblue" /> {/* Example color */}
    </mesh>
  );
}

// Preload for faster display
// useGLTF.preload('/my-model.glb');

// Desktop viewer component structure
function DesktopViewer({ onARButtonClick }) {
  const targetImageUrl = '/my-target-image.png'; // Path to target image for display

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* R3F Canvas */}
      <Canvas>
        <Suspense fallback={null}> {/* Loading fallback */}
          <ModelR3F />
          <OrbitControls /> {/* Camera controls */}
          {/* Lighting */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.0} />
        </Suspense>
      </Canvas>

      {/* AR Button */}
      <button onClick={onARButtonClick} className="ar-button" title="View in AR">
        <span role="img" aria-label="AR View">📱</span> View in AR
      </button>

      {/* Target Image Display & Download */}
      <div className="target-info-box">
        <p>AR Target Image:</p>
        <p>Scan the QR code, then point your phone at this image.</p>
        <img src={targetImageUrl} alt="Target for AR" />
        <a href={targetImageUrl} download="ar_target_image.jpg">
          Download Target
        </a>
      </div>

      {/* Simple CSS (can be moved to App.css) */}
      <style>{`
        .ar-button {
          position: absolute; top: 20px; right: 20px; padding: 10px 15px;
          background-color: #fff; border: 1px solid #ccc; border-radius: 5px;
          cursor: pointer; z-index: 10; display: flex; align-items: center; gap: 5px;
        }
        .target-info-box {
          position: absolute; bottom: 20px; left: 20px; color: #333;
          background-color: rgba(255, 255, 255, 0.8); padding: 15px;
          border-radius: 8px; max-width: 250px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
          z-index: 10; font-size: 13px;
        }
        .target-info-box p { margin: 0 0 10px 0; }
        .target-info-box img { width: 100%; border: 1px solid #ccc; margin-bottom: 10px; }
        .target-info-box a {
          display: block; padding: 8px 12px; background-color: #007bff; color: white;
          text-decoration: none; border-radius: 4px; text-align: center; font-size: 14px;
        }
        .target-info-box a:hover { background-color: #0056b3; }
      `}</style>
    </div>
  );
}

export default DesktopViewer;