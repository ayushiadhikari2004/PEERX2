import React, { useMemo } from 'react';
import './TransferProgress.css';


const formatSpeed = (bytesPerSec) => {
    if (!bytesPerSec || bytesPerSec === 0) return '0 B/s';
    if (bytesPerSec > 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
    if (bytesPerSec > 1024) return `${(bytesPerSec / 1024).toFixed(2)} KB/s`;
    return `${Math.round(bytesPerSec)} B/s`;
}

const TransferProgress = ({ activeTransfers, embedded = false }) => {
  if (!activeTransfers || activeTransfers.length === 0) return null;

  return (
    <div className={`transfer-panel ${embedded ? '' : 'card fade-in'}`}>
      {!embedded && <h3 className="transfer-panel-title">Active P2P Transfers</h3>}
      <div className="transfer-list">
        {activeTransfers.map((transfer) => {
          return (
            <div key={transfer.id} className={`transfer-item ${transfer.status === 'complete' ? 'completed' : ''}`}>
              <div className="transfer-info">
                <span className="transfer-filename" title={transfer.fileName}>{transfer.fileName}</span>
                <span className="transfer-percentage">{Math.round(transfer.progress)}%</span>
              </div>
              
              {/* Modern continuous progress bar */}
              <div className="modern-progress-track">
                <div 
                  className={`modern-progress-fill ${transfer.type} ${transfer.status === 'complete' ? 'complete' : 'active'}`}
                  style={{ width: `${Math.min(100, Math.max(0, transfer.progress))}%` }}
                />
              </div>

              <div className="transfer-meta" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
                <span>
                  {transfer.status === 'complete' ? '✅ Complete' : (transfer.type === 'upload' ? '⬆️ Sending' : '⬇️ Receiving')} 
                  {transfer.speedBytesPerSec > 0 && ` • ${formatSpeed(transfer.speedBytesPerSec)}`}
                </span>
                <span>
                 {transfer.totalChunks ? `${transfer.processedChunks} / ${transfer.totalChunks} Chunks` : 'Calculating...'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransferProgress;
