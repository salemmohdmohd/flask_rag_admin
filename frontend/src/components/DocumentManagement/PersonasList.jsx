function PersonasList({ personas, deletePersona }) {
  if (personas.length === 0) return null
  const systemPersonas = personas.filter(persona => persona.user_id === 1)
  const userPersonas = personas.filter(persona => persona.user_id !== 1)
  return (
    <div className="space-y-8">
      {/* System/Company Default Personas */}
      {systemPersonas.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <i className="fas fa-shield-alt text-purple-600 mr-2"></i>
              Company Personas
            </h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {systemPersonas.length} available
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These are default personas provided by the company. They cannot be edited or removed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemPersonas.map((persona) => (
              <div key={`system-${persona.id}`} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      {persona.display_name}
                      <i className="fas fa-shield-alt text-purple-600 ml-2 text-sm"></i>
                    </h3>
                    <p className="text-sm text-gray-500">@{persona.name}</p>
                  </div>
                  <span className="text-purple-500" title="Company default - cannot be deleted">
                    <i className="fas fa-lock"></i>
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{persona.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Temperature: {persona.default_temperature}</div>
                  <div>Max Tokens: {persona.max_tokens}</div>
                  <div className="flex items-center mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <i className="fas fa-building mr-1"></i>
                      Company Default
                    </span>
                    {persona.is_active && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* User Personas Section */}
      {userPersonas.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <i className="fas fa-user text-green-600 mr-2"></i>
              Your Personas
            </h3>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {userPersonas.length} created
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Personas you've created. You can edit or remove these at any time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPersonas.map((persona) => (
              <div key={`user-${persona.id}`} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{persona.display_name}</h3>
                    <p className="text-sm text-gray-500">@{persona.name}</p>
                  </div>
                  <button
                    onClick={() => deletePersona(persona.id)}
                    className="text-red-400 hover:text-red-600"
                    title="Delete persona"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{persona.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Temperature: {persona.default_temperature}</div>
                  <div>Max Tokens: {persona.max_tokens}</div>
                  <div className="flex items-center mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${persona.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {persona.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PersonasList
