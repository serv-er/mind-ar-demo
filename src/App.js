// src/App.js
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import DesktopViewer from './DesktopViewer'; // Uses R3F
import ARViewer from './ARViewer'; // Uses Vanilla Three.js + MindAR CDN
import './App.css'; // Your base CSS

function App() {
  const [showQRCode, setShowQRCode] = useState(false);
  const [arMode, setArMode] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('mode') === 'ar') {
      setArMode(true);
    }
  }, []);

  // Construct URL for QR code (works best once deployed)
  const qrCodeUrl = `${window.location.origin}${window.location.pathname}?mode=ar`;

  // Render AR viewer if in AR mode
  if (arMode) {
    return <ARViewer />;
  }

  // Render Desktop viewer + QR code popup otherwise
  return (
    <div className="App">
      <DesktopViewer onARButtonClick={() => setShowQRCode(true)} />

      {/* QR Code Popup */}
      {showQRCode && (
        <div className="qr-overlay" onClick={() => setShowQRCode(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Scan to View in AR</h3>
            <div className="qr-code-container">
              <QRCode value={qrCodeUrl} size={180} />
            </div>
            <p>Open your phone's camera or QR scanner and scan the code.</p>
            <p>Then point your phone at the target image.</p>
            <button onClick={() => setShowQRCode(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Basic CSS for QR Popup (can move to App.css) */}
      <style>{`
        .qr-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background-color: rgba(0, 0, 0, 0.75); display: flex;
          justify-content: center; align-items: center; z-index: 100;
        }
        .qr-modal {
          background-color: white; padding: 30px 40px; border-radius: 10px;
          text-align: center; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .qr-modal h3 { margin-top: 0; margin-bottom: 15px; color: #333; }
        .qr-code-container { background: white; padding: 16px; display: inline-block; border: 1px solid #eee; margin-bottom: 15px;}
        .qr-modal p { margin-top: 15px; font-size: 14px; color: #555; line-height: 1.4;}
        .qr-modal p:last-of-type { margin-top: 10px; font-size: 12px; color: #777; }
        .qr-modal button { margin-top: 20px; padding: 10px 20px; cursor: pointer; font-size: 14px; }
      `}</style>
    </div>
  );
}

export default App;