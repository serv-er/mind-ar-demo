// src/ARViewer.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// GLTFLoader might still be needed depending on your vanilla model recreation
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function ARViewer() {
  const containerRef = useRef(null);
  // REMOVED <any> type hint
  const mindarRef = useRef(null);
  const cleanupRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || cleanupRef.current) return;
    cleanupRef.current = true;

    // REMOVED : any type hint
    let mindarThree = null;
    let animationFrameId = null;

    const initializeMindAR = async () => {
      if (!containerRef.current) return;

      try {
        // Check if MindARThree exists on the window object (loaded from CDN)
        // @ts-ignore (Optional: keeps linters happy if they expect window props)
        if (!window.MindARThree) {
          console.error("MindARThree script not loaded!");
          alert("Error: MindAR library failed to load.");
          return;
        }

        // Use window.MindARThree directly
        // @ts-ignore
        mindarThree = new window.MindARThree({
          container: containerRef.current,
          imageTargetSrc: '/my-targets.mind', // Path to your compiled target in /public
          maxTrack: 1,
        });
        mindarRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;
        const anchor = mindarThree.addAnchor(0);

        // Lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // --- RECREATE THE MODEL USING VANILLA THREE.JS ---
        // Make sure this matches your R3F model in DesktopViewer.js
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: "dodgerblue" });
        const modelMesh = new THREE.Mesh(geometry, material);

        modelMesh.scale.set(0.4, 0.4, 0.4);
        modelMesh.position.set(0, 0, 0); // Position relative to target center
        anchor.group.add(modelMesh); // Add to MindAR anchor
        console.log("Vanilla Three.js model created and added to anchor.");
        // --- END MODEL RECREATION ---

        // Start MindAR Engine
        await mindarThree.start();
        console.log("MindAR Started.");

        // Start Render Loop
        const animate = () => {
            if (!mindarRef.current) return; // Stop if cleaned up
            try {
               renderer.render(scene, camera);
            } catch (renderError) {
               console.error("Render loop error:", renderError);
               if (animationFrameId) cancelAnimationFrame(animationFrameId);
               animationFrameId = null;
               alert("A rendering error occurred.");
            }
            if (mindarRef.current) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };
        animate(); // Start the loop

      // REMOVED : any type hint from error if present
      } catch (error) {
        console.error("Error initializing MindAR:", error);
        alert("Error starting AR.");
      }
    };

    initializeMindAR();

    // Cleanup Function (runs when the component unmounts)
    return () => {
        console.log("Cleaning up ARViewer...");
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        if (mindarRef.current) {
            if (mindarRef.current.renderer) {
                 mindarRef.current.renderer.setAnimationLoop(null);
            }
            if (typeof mindarRef.current.stop === 'function') {
                 mindarRef.current.stop();
            }
            console.log("MindAR Stopped.");
            // Consider more thorough cleanup
            const anchorGroup = mindarRef.current?.anchor?.group;
            if(anchorGroup) {
                anchorGroup.traverse((object) => {
                    if (object.isMesh) {
                        object.geometry?.dispose();
                        if (Array.isArray(object.material)) {
                            object.material.forEach(mat => mat.dispose());
                        } else {
                            object.material?.dispose();
                        }
                    }
                });
            }
        }
        mindarRef.current = null;
    };
  }, []); // Empty dependency array

  // Container div for MindAR
  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
    />
  );
}

export default ARViewer;