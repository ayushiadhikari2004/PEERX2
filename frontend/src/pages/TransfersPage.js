import React from "react";
import TransferProgress from "../components/ui/TransferProgress";
import "./TransfersPage.css";

const TransfersPage = ({ activeTransfers }) => {
  return (
    <div className="page-container transfers-page">
      <header className="page-header">
        <h1>Active Transfers</h1>
        <p>Live peer-to-peer file transfers.</p>
      </header>

      <div className="transfers-grid">
        {activeTransfers.length === 0 ? (
          <div className="empty-state card">
            <span className="empty-icon">✅</span>
            <p>No active transfers right now.</p>
            <p className="empty-subtext">Recent transfers are cleared automatically.</p>
          </div>
        ) : (
          activeTransfers.map(transfer => (
            <div key={transfer.id} className="transfer-wrapper card">
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
