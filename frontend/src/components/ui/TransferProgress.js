import React, { useMemo } from 'react';
import './TransferProgress.css';

const CHUNKS_TO_RENDER = 50; // We'll divide the progress visually into 50 blocks

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
          
          // Calculate how many physical visual chunks should be 'filled'
          const fillRatio = transfer.progress / 100;
          const filledChunks = Math.floor(fillRatio * CHUNKS_TO_RENDER);

          return (
            <div key={transfer.id} className={`transfer-item ${transfer.status === 'complete' ? 'completed' : ''}`}>
              <div className="transfer-info">
                <span className="transfer-filename" title={transfer.fileName}>{transfer.fileName}</span>
                <span className="transfer-percentage">{Math.round(transfer.progress)}%</span>
              </div>
              
              {/* Chunk visualization grid */}
              <div className="chunk-grid-container">
                {Array.from({ length: CHUNKS_TO_RENDER }).map((_, idx) => {
                  let statusClass = 'empty';
                  if (idx < filledChunks) {
                    statusClass = 'filled';
                  } else if (idx === filledChunks && (transfer.status === 'receiving' || transfer.status === 'sending')) {
                    statusClass = 'active'; // The current chunk being downloaded/uploaded
                  }
                  
                  return (
                    <div 
                      key={idx} 
                      className={`chunk-block ${statusClass} ${transfer.type}`}
                      title={`Chunk ${idx + 1}/${CHUNKS_TO_RENDER}`}
                    />
                  );
                })}
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
