import React, { useCallback, useState } from 'react';
import './UploadDropzone.css';

const UploadDropzone = ({ onUpload, tags, setTags, loading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) {
      onUpload(e, selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="upload-container file-upload-section fade-in">
      <form onSubmit={handleSubmit} className="upload-form-wrapper">
        <div 
          className={`dropzone ${isDragging ? 'dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="file-input-hidden" 
            onChange={handleChange}
          />
          
          <label htmlFor="file-upload" className="dropzone-label">
            <div className="dropzone-content">
              <span className="upload-icon">
                {selectedFile ? '📄' : '☁️'}
              </span>
              <div className="upload-text">
                {selectedFile ? (
                  <>
                    <span className="selected-filename">{selectedFile.name}</span>
                    <span className="secondary-text">Click to choose a different file</span>
                  </>
                ) : (
                  <>
                    <span className="primary-text">Drag & drop your file here</span>
                    <span className="secondary-text">or <span className="browse-link">browse from computer</span></span>
                  </>
                )}
              </div>
            </div>
          </label>
        </div>

        <div className="upload-meta-row">
          <input
            type="text"
            className="tags-input form-control"
            placeholder="Tags (comma separated)... e.g., work, invoice"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <button 
            type="submit" 
            className="upload-submit-btn" 
            disabled={!selectedFile || loading}
          >
            {loading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadDropzone;
