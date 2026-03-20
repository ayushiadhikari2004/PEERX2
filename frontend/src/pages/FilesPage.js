import React from 'react';
import FileCard from '../components/ui/FileCard';
import './FilesPage.css';

const FilesPage = ({ 
  files, 
  deleteFile, 
  formatSize, 
  formatDate
}) => {
  return (
    <div className="files-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Received Files</h1>
        <p className="muted">
          Files that you have successfully received locally from peers.
        </p>
      </div>

      <div className="files-section">
        <div className="section-header">
          <h3>Your Downloads</h3>
          <span className="file-count-badge">{files.length}</span>
        </div>

        {files.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📁</span>
            <h3>No Local Files</h3>
            <p>You haven't downloaded any files from peers yet.</p>
          </div>
        ) : (
          <div className="files-grid">
            {files.map((file) => (
              <FileCard 
                key={file.id}
                file={file}
                onDownload={() => {
                   // No-op for now as files automatically downloaded via anchor tag in WebRTC.js
                   // Real app would likely use OPFS or IndexedDB for real caching.
                   alert("File was already downloaded to your browser's Downloads folder upon completion.");
                }}
                onDelete={deleteFile}
                formatSize={formatSize}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesPage;
