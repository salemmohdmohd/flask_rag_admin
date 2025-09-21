import React from 'react';

const ApiKeyModal = ({ show, apiKey, setApiKey, onSubmit, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050}}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">🔑 Google AI Studio API Key Required</h5>
          </div>
          <div className="modal-body text-center">
            <p>To use client-side semantic search, please enter your Google AI Studio API key:</p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google AI Studio API key"
              className="form-control"
            />
            <small className="form-text text-muted mt-2">
              Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </small>
          </div>
          <div className="modal-footer justify-content-center">
            <button
              className="btn btn-primary"
              onClick={onSubmit}
              disabled={!apiKey.trim()}
            >
              Initialize
            </button>
            <button
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Skip (use basic mode)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;