import { useEffect, useRef, useState } from 'react'
import AppHeader from '../components/AppHeader'
import DocumentControls from '../components/DocumentManagement/DocumentControls'
import DocumentsTable from '../components/DocumentManagement/DocumentsTable'
import DocumentTabs from '../components/DocumentManagement/DocumentTabs'
import ErrorAlert from '../components/DocumentManagement/ErrorAlert'
import ImportModal from '../components/DocumentManagement/ImportModal'
import NoDocumentsMessage from '../components/DocumentManagement/NoDocumentsMessage'
import NoPersonasMessage from '../components/DocumentManagement/NoPersonasMessage'
import PersonaControls from '../components/DocumentManagement/PersonaControls'
import PersonasList from '../components/DocumentManagement/PersonasList'
import StorageStatsCard from '../components/DocumentManagement/StorageStatsCard'
import SystemResourcesTable from '../components/DocumentManagement/SystemResourcesTable'
import { useAuth } from '../contexts/AuthProvider'
import { useKnowledgeBase } from '../hooks/useKnowledgeBase'

function DocumentManagementClientSide({ onLogout }) {
	const { token } = useAuth()
	const {
		documents,
		serverResources,
		allDocuments,
		loading: documentsLoading,
		error: documentsError,
		storageStats,
		uploadDocument,
		deleteDocument,
		getDocumentContent,
		searchKnowledgeBase,
		exportDocuments,
		importDocuments,
		setError: setDocumentsError
	} = useKnowledgeBase()

	const [personas, setPersonas] = useState([])
	const [loading, setLoading] = useState(true)
	const [selectedPersona, setSelectedPersona] = useState('')
	const [searchTerm, setSearchTerm] = useState('')
	const [searchResults, setSearchResults] = useState([])
	const [isSearching, setIsSearching] = useState(false)
	const [uploadProgress, setUploadProgress] = useState(null)
	const [showImportModal, setShowImportModal] = useState(false)
	const [activeTab, setActiveTab] = useState('documents')
	const [showPersonaForm, setShowPersonaForm] = useState(false)
	const [personaForm, setPersonaForm] = useState({
		name: '',
		display_name: '',
		description: '',
		expertise_areas: '',
		default_temperature: 0.3,
		max_tokens: 2048,
		prompt_content: '',
		is_active: true,
		is_default: false
	})

	const fileInputRef = useRef(null)
	const importInputRef = useRef(null)

	useEffect(() => {
		fetchPersonas()
	}, [])

	useEffect(() => {
		setLoading(documentsLoading)
	}, [documentsLoading])

	const fetchPersonas = async () => {
		try {
			const response = await fetch('/api/personas', {
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			if (response.ok) {
				const data = await response.json()
				setPersonas(data.personas || [])
			}
		} catch (error) {
			console.error('Error fetching personas:', error)
		}
	}

	const handleFileUpload = async (event) => {
		const file = event.target.files[0]
		if (!file) return
		try {
			setUploadProgress('Uploading...')
			await uploadDocument(file, {
				description: `Uploaded ${file.name}`,
				tags: ['user-upload']
			})
			setUploadProgress('Upload complete!')
			setTimeout(() => setUploadProgress(null), 2000)
		} catch (error) {
			console.error('Upload failed:', error)
			setUploadProgress(null)
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleDeleteDocument = async (documentId) => {
		const document = documents.find(doc => doc.id === documentId);
		if (document && (document.source === 'server' || document.user_id === 1)) {
			alert('This is a company default resource and cannot be deleted.');
			return;
		}
		if (!window.confirm('Are you sure you want to delete this document?')) return
		try {
			await deleteDocument(documentId)
		} catch (error) {
			console.error('Delete failed:', error)
		}
	}

	const handleSearch = async () => {
		if (!searchTerm.trim()) {
			setSearchResults([])
			setIsSearching(false)
			return
		}
		try {
			setIsSearching(true)
			const results = await searchKnowledgeBase(searchTerm)
			setSearchResults(results)
		} catch (error) {
			console.error('Search failed:', error)
			setSearchResults([])
		} finally {
			setIsSearching(false)
		}
	}

	const handleExportDocuments = async () => {
		try {
			await exportDocuments()
		} catch (error) {
			console.error('Export failed:', error)
		}
	}

	const handleImportDocuments = async (event) => {
		const file = event.target.files[0]
		if (!file) return
		try {
			const results = await importDocuments(file)
			alert(`Successfully imported ${results.length} documents`)
			setShowImportModal(false)
		} catch (error) {
			console.error('Import failed:', error)
			alert('Import failed: ' + error.message)
		}
		if (importInputRef.current) {
			importInputRef.current.value = ''
		}
	}

	const filteredDocuments = searchTerm ? searchResults : allDocuments

	const formatFileSize = (bytes) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString()
	}

	const createPersona = async () => {
		try {
			const response = await fetch('/api/personas', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(personaForm)
			})
			if (response.ok) {
				await fetchPersonas()
				setShowPersonaForm(false)
				setPersonaForm({
					name: '',
					display_name: '',
					description: '',
					expertise_areas: '',
					default_temperature: 0.3,
					max_tokens: 2048,
					prompt_content: '',
					is_active: true,
					is_default: false
				})
			} else {
				const error = await response.json()
				alert('Error creating persona: ' + (error.error || 'Unknown error'))
			}
		} catch (error) {
			console.error('Error creating persona:', error)
			alert('Error creating persona: ' + error.message)
		}
	}

	const deletePersona = async (personaId) => {
		const persona = personas.find(p => p.id === personaId);
		if (persona && persona.user_id === 1) {
			alert('This is a company default persona and cannot be deleted.');
			return;
		}
		if (!window.confirm('Are you sure you want to delete this persona?')) return
		try {
			const response = await fetch(`/api/personas/${personaId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			})
			if (response.ok) {
				await fetchPersonas()
			} else {
				let errorMessage = 'Unknown error'
				try {
					const error = await response.json()
					errorMessage = error.error || error.message || `HTTP ${response.status}`
				} catch (jsonError) {
					errorMessage = `HTTP ${response.status}: ${response.statusText}`
				}
				alert('Error deleting persona: ' + errorMessage)
			}
		} catch (error) {
			console.error('Error deleting persona:', error)
			alert('Error deleting persona: ' + error.message)
		}
	}

	if (loading) {
		return (
			<div className="dashboard bg-body min-vh-100 p-4">
				<div className="container">
					<div className="text-center py-5">
						<div className="spinner-border text-primary mb-3" role="status">
							<span className="visually-hidden">Loading...</span>
						</div>
						<p className="text-muted">Loading...</p>
					</div>
				</div>
			</div>
		)
	}

	   return (
		   <div className="dashboard bg-body min-vh-100">
			   <AppHeader title="Document Management" subtitle="Upload, edit, and manage your knowledge base documents and personas" showBack={true} backTo="/dashboard" onLogout={onLogout} />
			   <div className="container-fluid px-4 py-3">
				<StorageStatsCard storageStats={storageStats} />
				<ErrorAlert error={documentsError} onDismiss={() => setDocumentsError(null)} />
				<DocumentTabs
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					documentsCount={documents.length}
					personasCount={personas.length}
				/>
				{activeTab === 'documents' && (
					<div className="card-body">
						<DocumentControls
							searchTerm={searchTerm}
							setSearchTerm={setSearchTerm}
							handleSearch={handleSearch}
							isSearching={isSearching}
							fileInputRef={fileInputRef}
							handleFileUpload={handleFileUpload}
							documentsLoading={documentsLoading}
							handleExportDocuments={handleExportDocuments}
							setShowImportModal={setShowImportModal}
							importInputRef={importInputRef}
							handleImportDocuments={handleImportDocuments}
							setSearchResults={setSearchResults}
							setIsSearching={setIsSearching}
						/>
						{filteredDocuments.length === 0 ? (
							<NoDocumentsMessage searchTerm={searchTerm} fileInputRef={fileInputRef} />
						) : (
							<div className="space-y-6">
								<SystemResourcesTable
									systemResources={filteredDocuments.filter(doc => doc.source === 'server' || doc.user_id === 1)}
									formatDate={formatDate}
								/>
								<DocumentsTable
									userResources={filteredDocuments.filter(doc => doc.source !== 'server' && doc.user_id !== 1)}
									formatFileSize={formatFileSize}
									formatDate={formatDate}
									handleDeleteDocument={handleDeleteDocument}
								/>
								{filteredDocuments.filter(doc => doc.source !== 'server' && doc.user_id !== 1).length === 0 && !searchTerm && (
									<div className="text-center py-8 bg-gray-50 rounded-lg">
										<i className="fas fa-upload text-3xl text-gray-400 mb-3"></i>
										<h4 className="text-lg font-medium text-gray-900 mb-2">No personal documents yet</h4>
										<p className="text-gray-600 mb-4">Upload your first document to build your personal knowledge base</p>
										<button
											onClick={() => fileInputRef.current?.click()}
											className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
										>
											<i className="fas fa-upload mr-2"></i>Upload Document
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				)}
				{activeTab === 'personas' && (
					<div className="p-6">
						<PersonaControls showPersonaForm={showPersonaForm} setShowPersonaForm={setShowPersonaForm} />
						{showPersonaForm && (
							<div className="bg-gray-50 p-6 rounded-lg mb-6">
								<h3 className="text-lg font-medium text-gray-900 mb-4">Create New Persona</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Name (ID)</label>
										<input
											type="text"
											value={personaForm.name}
											onChange={(e) => setPersonaForm({ ...personaForm, name: e.target.value })}
											className="form-control theme-input"
											placeholder="e.g., technical_expert"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
										<input
											type="text"
											value={personaForm.display_name}
											onChange={(e) => setPersonaForm({ ...personaForm, display_name: e.target.value })}
											className="form-control theme-input"
											placeholder="Technical Expert"
										/>
									</div>
									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
										<textarea
											value={personaForm.description}
											onChange={(e) => setPersonaForm({ ...personaForm, description: e.target.value })}
											rows={3}
											className="form-control theme-input"
											placeholder="Describe the persona's role and capabilities..."
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
										<input
											type="number"
											min="0"
											max="2"
											step="0.1"
											value={personaForm.default_temperature}
											onChange={(e) => setPersonaForm({ ...personaForm, default_temperature: parseFloat(e.target.value) })}
											className="form-control theme-input"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
										<input
											type="number"
											min="1"
											max="100000"
											value={personaForm.max_tokens}
											onChange={(e) => setPersonaForm({ ...personaForm, max_tokens: parseInt(e.target.value) })}
											className="form-control theme-input"
										/>
									</div>
									<div className="md:col-span-2">
										<label className="block text-sm font-medium text-gray-700 mb-2">Prompt Content</label>
										<textarea
											value={personaForm.prompt_content}
											onChange={(e) => setPersonaForm({ ...personaForm, prompt_content: e.target.value })}
											rows={4}
											className="form-control theme-input"
											placeholder="Enter the system prompt for this persona..."
										/>
									</div>
								</div>
								<div className="mt-4 flex gap-2">
									<button onClick={createPersona} className="btn theme-btn btn-success">Create Persona</button>
									<button onClick={() => setShowPersonaForm(false)} className="btn theme-btn btn-secondary">Cancel</button>
								</div>
							</div>
						)}
						{personas.length === 0 ? (
							<NoPersonasMessage setShowPersonaForm={setShowPersonaForm} />
						) : (
							<PersonasList personas={personas} deletePersona={deletePersona} />
						)}
					</div>
				)}
				<ImportModal
					showImportModal={showImportModal}
					setShowImportModal={setShowImportModal}
					importInputRef={importInputRef}
					handleImportDocuments={handleImportDocuments}
				/>
			</div>
		</div>
	)
}

export default DocumentManagementClientSide
