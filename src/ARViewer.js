import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Keep if needed for complex models

// --- Removed TypeScript specific lines ---

function ARViewer() {
  const containerRef = useRef(null);
  const mindarRef = useRef(null);
  const cleanupRef = useRef(false); // Flag to prevent multiple runs/cleanups

  useEffect(() => {
    // Prevent effect from running multiple times or if already cleaned up
    if (!containerRef.current || cleanupRef.current) {
        console.log("ARViewer useEffect skipped: No container or already ran/cleaning.");
        return;
    }
    console.log("ARViewer useEffect running...");
    cleanupRef.current = true; // Mark that this run instance needs cleanup

    let mindarThree = null;
    let animationFrameId = null;

    // --- Function to wait until MindAR script is loaded from CDN ---
    const waitForMindAR = (callback, maxRetries = 100, interval = 100) => { // Increased interval slightly
      let retries = 0;
      console.log("Starting to wait for MindARThree script...");
      const check = () => {
        // @ts-ignore
        if (window.MindARThree) {
          console.log("MindARThree found on window object. Proceeding with initialization.");
          callback(); // MindAR is ready, run the main initialization logic
        } else {
          retries++;
          console.log(`MindARThree not yet available, attempt ${retries}/${maxRetries}`);
          if (retries > maxRetries) {
            console.error("MindARThree script failed to load after multiple checks.");
            alert("Error: MindAR library failed to load. Please check your internet connection and try refreshing the page.");
          } else {
            // Wait a short interval then check again
            setTimeout(check, interval);
          }
        }
      };
      check(); // Start the checking process
    };
    // --- End Wait Function ---

    const initializeMindAR = async () => {
      // Ensure container still exists (safety check)
      if (!containerRef.current) {
        console.error("Container ref lost during async initialization wait.");
        return; // Don't proceed if container is gone
      }
      console.log("Initializing MindAR...");
      try {
        // @ts-ignore
        mindarThree = new window.MindARThree({
          container: containerRef.current,
          imageTargetSrc: '/my-targets.mind', // Path in /public
          maxTrack: 1,
        });
        mindarRef.current = mindarThree; // Store instance for cleanup

        const { renderer, scene, camera } = mindarThree;
        const anchor = mindarThree.addAnchor(0); // Anchor for the first target

        // --- Add Lighting ---
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1.2);
        scene.add(light);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);
        // --- End Lighting ---

        // --- Recreate Model using Vanilla Three.js ---
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({ color: "dodgerblue" });
        const modelMesh = new THREE.Mesh(geometry, material);
        modelMesh.scale.set(0.4, 0.4, 0.4);
        modelMesh.position.set(0, 0, 0); // Center on target
        anchor.group.add(modelMesh); // Add to MindAR anchor
        console.log("Vanilla Three.js model created and added to anchor.");
        // --- End Model ---

        // Start MindAR Engine
        await mindarThree.start();
        console.log("MindAR Engine Started.");

        // Start Render Loop
        const animate = () => {
            // Check if mindarRef is still valid before rendering
            if (!mindarRef.current) {
                console.log("Render loop stopping: MindAR instance cleaned up.");
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                return;
            }
            try {
               renderer.render(scene, camera);
            } catch (renderError) {
               console.error("Render loop error:", renderError);
               if (animationFrameId) cancelAnimationFrame(animationFrameId);
               animationFrameId = null;
               alert("A rendering error occurred. Please refresh.");
               return; // Stop loop on error
            }
            // Only request next frame if not cleaned up
            animationFrameId = requestAnimationFrame(animate);
        };
        animate(); // Start the render loop

      } catch (error) {
        console.error("Error during MindAR initialization or start:", error);
        alert("An error occurred while starting the AR experience. Please ensure camera permissions are granted.");
      }
    };

    // --- Start Initialization via the Waiter Function ---
    // This now waits for the script before calling initializeMindAR
    waitForMindAR(initializeMindAR);

    // --- Cleanup Function ---
    // This function returned by useEffect runs when the component unmounts
    return () => {
      console.log("Executing cleanup for ARViewer...");
      cleanupRef.current = false; // Reset flag for potential remounts (important in dev mode)

      // Stop the animation loop first
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        console.log("Animation frame cancelled.");
      }

      // Access the MindAR instance via the ref for cleanup
      const currentMindarInstance = mindarRef.current;
      if (currentMindarInstance) {
        console.log("Stopping MindAR...");
        // Ensure renderer loop is stopped *before* stopping the engine
        if (currentMindarInstance.renderer) {
          currentMindarInstance.renderer.setAnimationLoop(null);
        }
        if (typeof currentMindarInstance.stop === 'function') {
          currentMindarInstance.stop();
        }
        console.log("MindAR Stopped.");

        // --- Dispose Three.js Resources ---
        // Access scene and anchor group if they exist on the instance
        const scene = currentMindarInstance.scene;
        const anchorGroup = currentMindarInstance.anchor?.group; // Use optional chaining

        if (anchorGroup) {
            console.log("Disposing anchor group children...");
            anchorGroup.traverse((object) => {
                if (object.isMesh) {
                    console.log("Disposing mesh:", object.name || 'unnamed');
                    object.geometry?.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else {
                        object.material?.dispose();
                    }
                }
            });
            // Remove children from group after traversal if needed
             while(anchorGroup.children.length > 0){
                anchorGroup.remove(anchorGroup.children[0]);
             }
        }
        if (scene) {
             console.log("Disposing scene lights...");
             // You might need to dispose lights or other scene-level objects too
              const lights = scene.children.filter(obj => obj.isLight);
              lights.forEach(light => {
                  if (typeof light.dispose === 'function') {
                      light.dispose(); // Dispose lights if they have a dispose method
                  }
                  scene.remove(light);
              });
              scene.clear(); // A more aggressive scene clear might be needed
        }
        if (currentMindarInstance.renderer) {
            console.log("Disposing renderer...");
            currentMindarInstance.renderer.dispose(); // Dispose the WebGL context
        }
        // --- End Dispose ---

        mindarRef.current = null; // Clear the ref
      } else {
          console.log("MindAR instance already null during cleanup.");
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // Container div MindAR will use
  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
      aria-label="MindAR AR View Container" // Accessibility
    />
  );
}

export default ARViewer;
