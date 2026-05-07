import React from "react";
import TransferProgress from "../components/ui/TransferProgress";
import "./TransfersPage.css";

const TransfersPage = ({ activeTransfers, clearTransfer }) => {
  return (
    <div className="page-container transfers-page">
      <header className="page-header">
        <h1>Transfer History</h1>
        <p>Live and historical peer-to-peer file transfers.</p>
      </header>

      <div className="transfers-grid">
        {activeTransfers.length === 0 ? (
          <div className="empty-state card">
            <span className="empty-icon">✅</span>
            <p>No transfer history yet.</p>
            <p className="empty-subtext">Completed transfers will remain here until deleted.</p>
          </div>
        ) : (
          activeTransfers.map(transfer => (
            <div key={transfer.id} className="transfer-wrapper card" style={{ position: 'relative' }}>
              <button 
                onClick={() => clearTransfer(transfer.id)}
                className="btn-icon danger" 
                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, padding: '6px 10px', fontSize: '14px', border: 'none', background: 'transparent' }}
                title="Remove from history"
              >
                🗑️
              </button>
              <TransferProgress
                activeTransfers={[transfer]}
                embedded={true}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TransfersPage;
