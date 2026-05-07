import React, { useState } from "react";
import UploadDropzone from "../components/ui/UploadDropzone";

const UploadPage = ({ peers, webrtc, notify, setView }) => {
  const [selectedPeer, setSelectedPeer] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = (e, file) => {
    if (!selectedPeer) {
      return notify("Please select a peer to send to first.", "error");
    }

    if (!webrtc) {
      return notify("WebRTC not connected. Try refreshing.", "error");
    }

    const peerObj = peers.find((p) => p.socketId === selectedPeer);
    if (!peerObj) {
      return notify("Peer is offline or invalid.", "error");
    }

    const fileToSend = Array.isArray(file) ? file[0] : file;
    if (!fileToSend) {
      return notify("Please select a file.", "error");
    }

    notify(`Initiating direct P2P transfer to ${peerObj.peerName}`);
    webrtc.sendFile(selectedPeer, fileToSend);
    setView("transfers"); // Jump to transfers page to see progress
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Send File</h1>
        <p>Send a file directly to an active peer on the network.</p>
      </header>

      <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
        {peers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📡</span>
            <p>No active peers available.</p>
            <p className="empty-subtext">Wait for someone to join the network or ensure signaling is active.</p>
          </div>
        ) : (
          <div style={{ padding: "1rem" }}>
            <div style={{ marginBottom: "2rem" }}>
              <label 
                htmlFor="peer-select" 
                style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text)" }}
              >
                Select Recipient:
              </label>
              <select
                id="peer-select"
                value={selectedPeer}
                onChange={(e) => setSelectedPeer(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "var(--radius-md)",
                  border: "2px solid var(--border)",
                  backgroundColor: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "1rem"
                }}
              >
                <option value="" disabled>-- Choose a connected Peer --</option>
                {peers.map(p => (
                  <option key={p.socketId} value={p.socketId}>
                     {p.peerName} ({p.socketId.substr(0,4)})
                  </option>
                ))}
              </select>
            </div>

            <UploadDropzone
              onUpload={handleUpload}
              tags={tags}
              setTags={setTags}
              loading={loading}
              maxSize={500 * 1024 * 1024} // 500MB
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPage;
