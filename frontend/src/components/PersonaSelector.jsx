import React, { useState, useEffect } from 'react';

const PersonaSelector = ({ onPersonaChange, className = '' }) => {
  const [personas, setPersonas] = useState([]);
  const [currentPersona, setCurrentPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/personas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPersonas(data.personas || []);

        // Find current persona
        const current = data.personas?.find(p => p.is_current);
        setCurrentPersona(current);
      }
    } catch (error) {
      console.error('Failed to load personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchPersona = async (personaName) => {
    if (switching || personaName === currentPersona?.name) return;

    setSwitching(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/personas/switch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ persona_name: personaName })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentPersona(data.persona);

        // Update personas list to reflect current selection
        setPersonas(prev => prev.map(p => ({
          ...p,
          is_current: p.name === personaName
        })));

        // Notify parent component
        if (onPersonaChange) {
          onPersonaChange(data.persona);
        }
      }
    } catch (error) {
      console.error('Failed to switch persona:', error);
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className={`card bg-light mb-2 ${className}`}>
        <div className="card-body py-2">
          <div className="text-center text-muted small">
            <i className="fas fa-spinner fa-spin me-1"></i>
            Loading personas...
          </div>
        </div>
      </div>
    );
  }

  // For navbar version, return compact dropdown
  if (className.includes('navbar')) {
    return (
      <div className={`d-flex align-items-center ${className}`}>
        <span className="text-white me-2 d-none d-lg-inline small">
          <i className="fas fa-robot me-1"></i>AI:
        </span>
        <select
          value={currentPersona?.name || ''}
          onChange={(e) => switchPersona(e.target.value)}
          disabled={switching}
          className="form-select form-select-sm border-0 bg-light text-dark"
          style={{
            fontSize: '0.85rem',
            minWidth: '120px',
            maxWidth: '160px'
          }}
          title={currentPersona ? `${currentPersona.display_name} - ${currentPersona.description}` : 'Select AI Persona'}
        >
          {personas.map(persona => (
            <option key={persona.name} value={persona.name}>
              {persona.display_name}
            </option>
          ))}
        </select>
        {switching && (
          <div className="spinner-border spinner-border-sm text-light ms-2" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        )}
      </div>
    );
  }

  // Original card version for other contexts
  return (
    <div className={`card bg-light mb-2 ${className}`}>
      <div className="card-body py-2">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center">
            <span className="fw-bold text-secondary me-2 small">🤖 AI Mode:</span>
            <span className="fw-bold text-primary small">
              {currentPersona ? currentPersona.display_name : 'Default'}
            </span>
          </div>
          <div className="flex-shrink-0" style={{ minWidth: '140px' }}>
            <select
              value={currentPersona?.name || ''}
              onChange={(e) => switchPersona(e.target.value)}
              disabled={switching}
              className="form-select form-select-sm"
              style={{ fontSize: '0.8rem' }}
            >
              {personas.map(persona => (
                <option key={persona.name} value={persona.name}>
                  {persona.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {currentPersona && (
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
            <div className="fst-italic mb-1">
              {currentPersona.description}
            </div>
            <div className="text-truncate">
              <strong>Expertise:</strong> {currentPersona.expertise_areas?.join(', ')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonaSelector;
