import React from 'react';
import './FileCard.css';

const FileCard = ({ file, onDownload, onDelete, formatSize, formatDate }) => {
  // Determine icon based on mime type or extension
  const getFileIcon = (mimeType, name) => {
    if (!mimeType) return '📄';
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📕';
    if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return '📦';
    if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('html')) return '🧑‍💻';
    return '📄';
  };

  return (
    <div className="file-card">
      <div className="file-icon-area">
        <span className="file-icon-emoji">{getFileIcon(file.mimeType, file.name)}</span>
      </div>
      
      <div className="file-content">
        <h4 className="file-name" title={file.name}>{file.name}</h4>
        
        <div className="file-meta">
          <span className="file-size">{formatSize(file.size)}</span>
          <span className="file-date">{formatDate(file.receivedAt || new Date())}</span>
        </div>
        
        <div className="file-actions">
          <button 
            className="file-btn primary-btn" 
            onClick={() => onDownload(file.id, file.name)}
            title="Download/Open Local Copy"
          >
            <span>⬇️</span> Open
          </button>
          
          {onDelete && (
            <button 
              className="file-btn danger-btn icon-only" 
              onClick={() => onDelete(file.id)}
              title="Delete Local Record"
            >
              <span>🗑️</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCard;
