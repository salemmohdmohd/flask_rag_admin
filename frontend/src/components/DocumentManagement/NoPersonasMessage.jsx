function NoPersonasMessage({ setShowPersonaForm }) {
  return (
    <div className="text-center py-8 bg-gray-50 rounded-lg">
      <i className="fas fa-user-plus text-3xl text-gray-400 mb-3"></i>
      <h4 className="text-lg font-medium text-gray-900 mb-2">No personal personas yet</h4>
      <p className="text-gray-600 mb-4">Create your first custom persona to enhance your chat experience</p>
      <button
        onClick={() => setShowPersonaForm(true)}
        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
      >
        <i className="fas fa-plus mr-2"></i>Create Persona
      </button>
    </div>
  )
}

export default NoPersonasMessage
