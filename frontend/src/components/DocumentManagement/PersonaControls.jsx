function PersonaControls({ showPersonaForm, setShowPersonaForm }) {
  return (
    <div className="mb-6">
      <button
        onClick={() => setShowPersonaForm(!showPersonaForm)}
        className="btn theme-btn btn-primary"
      >
        <i className="fas fa-plus me-2"></i>
        {showPersonaForm ? 'Cancel' : 'Add New Persona'}
      </button>
    </div>
  )
}

export default PersonaControls
