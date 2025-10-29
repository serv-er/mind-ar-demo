// src/ARViewer.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// --- ADD SIDE-EFFECT IMPORT ---
// This path doesn't actually load the file locally here,
// but might signal to build tools or act as documentation.
// The actual code comes from the script tag in index.html.
// We might need to adjust this path based on potential build tool behavior,
// but let's try the documented path first.
// If this specific line causes a build error (e.g., "module not found"),
// try removing it and just relying on the script tag + waitForMindAR.
// import 'mind-ar/dist/mindar-image-three.prod.js';
// --- LET'S COMMENT IT OUT INITIALLY TO AVOID BUILD ERRORS ---
// We will rely purely on the script tag + waitForMindAR first.

function ARViewer() {
  const containerRef = useRef(null);
  const mindarRef = useRef(null);
  const cleanupRef = useRef(false);

  useEffect(() => {
    // Prevent effect from running multiple times or if already cleaned up
    if (!containerRef.current || cleanupRef.current) {
      console.log("ARViewer useEffect skipped.");
      return;
    }
    console.log("ARViewer useEffect running...");
    cleanupRef.current = true;

    let mindarThree = null;
    let animationFrameId = null;

    // --- Function to wait until MindAR script (from index.html) is loaded ---
    const waitForMindAR = (callback, maxRetries = 100, interval = 100) => {
      let retries = 0;
      console.log("Starting to wait for MindARThree script...");
      const check = () => {
        // @ts-ignore
        if (window.MindARThree) {
          console.log("MindARThree found on window object. Proceeding.");
          callback(); // MindAR is ready
        } else {
          retries++;
          console.log(`MindARThree not yet available, attempt ${retries}/${maxRetries}`);
          if (retries > maxRetries) {
            console.error("MindARThree script failed to load after multiple checks.");
            alert("Error: MindAR library failed to load. Check connection/refresh.");
          } else {
            setTimeout(check, interval); // Wait and check again
          }
        }
      };
      check();
    };
    // --- End Wait Function ---

    const initializeMindAR = async () => {
      if (!containerRef.current) {
        console.error("Container ref lost during initialization wait.");
        return;
      }
      console.log("Initializing MindAR...");
      try {
        // @ts-ignore - Access MindARThree from the global window object
        mindarThree = new window.MindARThree({
          container: containerRef.current,
          imageTargetSrc: '/my-targets.mind', // Path in /public
          maxTrack: 1,
        });
        mindarRef.current = mindarThree;

        const { renderer, scene, camera } = mindarThree;
        const anchor = mindarThree.addAnchor(0);

        // --- Lighting ---
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
        anchor.group.add(modelMesh);
        console.log("Vanilla Three.js model created.");
        // --- End Model ---

        // Start MindAR Engine
        await mindarThree.start();
        console.log("MindAR Engine Started.");

        // Start Render Loop
        const animate = () => { /* ... (render loop same as before) ... */
            if (!mindarRef.current) return;
            try { renderer.render(scene, camera); } catch (e) { /* error handling */ console.error(e); cancelAnimationFrame(animationFrameId); animationFrameId = null; alert('Render err'); return; }
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

      } catch (error) {
        console.error("Error during MindAR initialization or start:", error);
        alert("Error starting AR.");
      }
    };

    // --- Start Initialization via the Waiter Function ---
    waitForMindAR(initializeMindAR);

    // --- Cleanup Function ---
    return () => { /* ... (cleanup logic same as before) ... */
        console.log("Cleaning up ARViewer...");
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const currentMindarInstance = mindarRef.current;
        if (currentMindarInstance) {
            if (currentMindarInstance.renderer) currentMindarInstance.renderer.setAnimationLoop(null);
            if (typeof currentMindarInstance.stop === 'function') currentMindarInstance.stop();
             // Dispose Three.js resources...
            const scene = currentMindarInstance.scene;
            const anchorGroup = currentMindarInstance.anchor?.group;
             if (anchorGroup) { /* dispose geo/mat */ anchorGroup.traverse((object) => {/*...*/}); }
             if (scene) { /* dispose lights etc. */ }
             if (currentMindarInstance.renderer) currentMindarInstance.renderer.dispose();
            console.log("MindAR Stopped & Cleaned.");
        }
        mindarRef.current = null;
        cleanupRef.current = false;
    };
  }, []); // Run effect once on mount

  // Container div
  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}/>
  );
}

export default ARViewer;