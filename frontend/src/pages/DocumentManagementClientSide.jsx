import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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

	// Set loading based on personas fetch and documents loading
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

		// Reset file input
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
	}

	const handleDeleteDocument = async (documentId) => {
		// Find the document to check if it's a system resource
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

		// Reset file input
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

	// Persona management functions (unchanged from server version)
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
		// Find the persona to check if it's a system persona
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
				// Handle non-JSON error responses
				let errorMessage = 'Unknown error'
				try {
					const error = await response.json()
					errorMessage = error.error || error.message || `HTTP ${response.status}`
				} catch (jsonError) {
					// If response is not JSON (like HTML error page), use status
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
			<div className="min-vh-100 bg-light p-4">
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
		<div className="min-vh-100 bg-light">
			{/* Header */}
			<div className="bg-white border-bottom shadow-sm">
				<div className="container-fluid px-4 py-3">
					<div className="d-flex justify-content-between align-items-center">
						<div>
							<h1 className="h2 fw-bold text-dark mb-1">Document Management</h1>
							<p className="text-muted mb-0">Manage your knowledge base documents and AI personas.</p>
						</div>
						<div className="d-flex gap-3">
							<Link to="/settings" className="text-muted text-decoration-none">
								<i className="fas fa-cog me-2"></i>Settings
							</Link>
							<button
								onClick={onLogout}
								className="btn btn-link text-danger text-decoration-none p-0"
							>
								<i className="fas fa-sign-out-alt me-2"></i>Logout
							</button>
						</div>
					</div>
				</div>
			</div>

			<div className="container-fluid px-4 py-3">
				{/* Storage Stats */}
				{storageStats && (
					<div className="card mb-4">
						<div className="card-body">
							<div className="d-flex justify-content-between align-items-center">

								<div className="d-flex gap-4 small">
									<div className="text-center">
										<div className="h4 fw-bold text-primary mb-0">{storageStats.totalDocuments}</div>
										<div className="text-muted">Documents</div>
									</div>
									<div className="text-center">
										<div className="h4 fw-bold text-success mb-0">{storageStats.totalSizeFormatted}</div>
										<div className="text-muted">Total Size</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Error Display */}
				{documentsError && (
					<div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
						<div className="d-flex align-items-start">
							<i className="fas fa-exclamation-triangle text-danger me-3 mt-1"></i>
							<div>
								<h3 className="small fw-medium text-danger mb-1">Error</h3>
								<p className="small text-danger mb-2">{documentsError}</p>
								<button
									onClick={() => setDocumentsError(null)}
									className="btn btn-link btn-sm text-danger text-decoration-none p-0"
								>
									Dismiss
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Tabs */}
				<div className="card mb-4">
					<div className="card-header p-0">
						<ul className="nav nav-tabs card-header-tabs" role="tablist">
							<li className="nav-item">
								<button
									onClick={() => setActiveTab('documents')}
									className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
									type="button"
								>
									<i className="fas fa-file-alt me-2"></i>
									Documents ({documents.length})
								</button>
							</li>
							<li className="nav-item">
								<button
									onClick={() => setActiveTab('personas')}
									className={`nav-link ${activeTab === 'personas' ? 'active' : ''}`}
									type="button"
								>
									<i className="fas fa-user-tie me-2"></i>
									Personas ({personas.length})
								</button>
							</li>
						</ul>
					</div>

					{/* Documents Tab */}
					{activeTab === 'documents' && (
						<div className="card-body">
							{/* Upload and Search Controls */}
							<div className="row g-3 mb-4">
								<div className="col-12 col-sm-8">
									<div className="input-group">
										<input
											type="text"
											placeholder="Search documents..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
											className="form-control"
										/>
										<button
											onClick={handleSearch}
											disabled={isSearching}
											className="btn btn-primary"
											type="button"
										>
											{isSearching ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
										</button>
									</div>
								</div>
								<div className="col-12 col-sm-4">
									<div className="d-grid gap-2">
										<button
											onClick={() => fileInputRef.current?.click()}
											className="btn btn-success"
											disabled={documentsLoading}
										>
											<i className="fas fa-upload me-2"></i>Upload Document
										</button>
										{searchTerm && (
											<button
												onClick={() => {
													setSearchTerm('')
													setSearchResults([])
													setIsSearching(false)
												}}
												className="btn btn-outline-secondary btn-sm"
											>
												<i className="fas fa-times me-2"></i>Clear Search
											</button>
										)}
									</div>
								</div>
								<div className="col-12">
									<div className="d-flex gap-2 flex-wrap">
										<button
											onClick={handleExportDocuments}
											className="btn btn-secondary"
										>
											<i className="fas fa-download me-2"></i>Export
										</button>
										<button
											onClick={() => setShowImportModal(true)}
											className="btn btn-secondary"
										>
											<i className="fas fa-upload me-2"></i>Import
										</button>
									</div>
								</div>
							</div>

							{/* Hidden file inputs */}
							<input
								ref={fileInputRef}
								type="file"
								accept=".txt,.md,.pdf"
								onChange={handleFileUpload}
								className="hidden"
							/>

							{/* Documents Table */}
							{filteredDocuments.length === 0 ? (
								<div className="text-center py-12">
									<i className="fas fa-file-alt text-4xl text-gray-400 mb-4"></i>
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										{searchTerm ? 'No documents found' : 'No documents uploaded'}
									</h3>
									<p className="text-gray-600 mb-4">
										{searchTerm
											? 'Try adjusting your search terms'
											: 'Upload your first document to get started'
										}
									</p>
									{!searchTerm && (
										<button
											onClick={() => fileInputRef.current?.click()}
											className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
										>
											<i className="fas fa-upload mr-2"></i>Upload Document
										</button>
									)}
								</div>
							) : (
								<div className="space-y-6">
									{/* System/Company Default Resources */}
									{(() => {
										const systemResources = filteredDocuments.filter(doc =>
											doc.source === 'server' || doc.user_id === 1
										);
										const userResources = filteredDocuments.filter(doc =>
											doc.source !== 'server' && doc.user_id !== 1
										);

										return (
											<>
												{/* System Resources Section */}
												{systemResources.length > 0 && (
													<div>
														<div className="flex items-center mb-3">
															<h3 className="text-lg font-semibold text-gray-800 flex items-center">
																<i className="fas fa-shield-alt text-blue-600 mr-2"></i>
																Company Knowledge Base
															</h3>
															<span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																{systemResources.length} documents
															</span>
														</div>
														<p className="text-sm text-gray-600 mb-4">
															These are default resources provided by the company. They cannot be edited or removed.
														</p>
														<div className="overflow-x-auto bg-blue-50 rounded-lg">
															<table className="min-w-full divide-y divide-blue-200">
																<thead className="bg-blue-100">
																	<tr>
																		<th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
																			File Name
																		</th>
																		<th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
																			Type
																		</th>
																		<th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
																			Status
																		</th>
																		<th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
																			Added
																		</th>
																	</tr>
																</thead>
																<tbody className="bg-white divide-y divide-blue-200">
																	{systemResources.map((doc) => (
																		<tr key={`system-${doc.id}`} className="hover:bg-blue-50">
																			<td className="px-6 py-4 whitespace-nowrap">
																				<div className="flex items-center">
																					<i className="fas fa-shield-alt text-blue-600 mr-3"></i>
																					<div>
																						<div className="text-sm font-medium text-gray-900">
																							{doc.filename || doc.name}
																						</div>
																						{doc.description && (
																							<div className="text-sm text-gray-500">
																								{doc.description}
																							</div>
																						)}
																					</div>
																				</div>
																			</td>
																			<td className="px-6 py-4 whitespace-nowrap">
																				<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
																					<i className="fas fa-building mr-1"></i>
																					Company Default
																				</span>
																			</td>
																			<td className="px-6 py-4 whitespace-nowrap">
																				<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																					<i className="fas fa-check-circle mr-1"></i>
																					Available
																				</span>
																			</td>
																			<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
																				{formatDate(doc.uploadDate || doc.created_at)}
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
													</div>
												)}

												{/* User Resources Section */}
												{userResources.length > 0 && (
													<div>
														<div className="flex items-center mb-3">
															<h3 className="text-lg font-semibold text-gray-800 flex items-center">
																<i className="fas fa-user text-green-600 mr-2"></i>
																Your Documents
															</h3>
															<span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																{userResources.length} documents
															</span>
														</div>
														<p className="text-sm text-gray-600 mb-4">
															Documents you've uploaded. You can edit or remove these at any time.
														</p>
														<div className="overflow-x-auto">
															<table className="min-w-full divide-y divide-gray-200">
																<thead className="bg-gray-50">
																	<tr>
																		<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																			File Name
																		</th>
																		<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																			Size
																		</th>
																		<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																			Status
																		</th>
																		<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																			Uploaded
																		</th>
																		<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
																			Actions
																		</th>
																	</tr>
																</thead>
																<tbody className="bg-white divide-y divide-gray-200">
																	{userResources.map((doc) => (
																		<tr key={`user-${doc.id}`} className="hover:bg-gray-50">
																			<td className="px-6 py-4 whitespace-nowrap">
																				<div className="flex items-center">
																					<i className="fas fa-file-alt text-gray-400 mr-3"></i>
																					<div>
																						<div className="text-sm font-medium text-gray-900">
																							{doc.filename || doc.name}
																						</div>
																						{doc.description && (
																							<div className="text-sm text-gray-500">
																								{doc.description}
																							</div>
																						)}
																					</div>
																				</div>
																			</td>
																			<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
																				{formatFileSize(doc.fileSize)}
																			</td>
																			<td className="px-6 py-4 whitespace-nowrap">
																				<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																					<i className="fas fa-check-circle mr-1"></i>
																					Indexed
																				</span>
																			</td>
																			<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
																				{formatDate(doc.uploadDate || doc.created_at)}
																			</td>
																			<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
																				<button
																					onClick={() => handleDeleteDocument(doc.id)}
																					className="text-red-600 hover:text-red-900"
																					title="Delete document"
																				>
																					<i className="fas fa-trash"></i>
																				</button>
																			</td>
																		</tr>
																	))}
																</tbody>
															</table>
														</div>
													</div>
												)}

												{/* Show message if user has no documents */}
												{userResources.length === 0 && !searchTerm && (
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
											</>
										);
									})()}
								</div>
							)}
						</div>
					)}

					{/* Personas Tab - Keep existing persona management logic */}
					{activeTab === 'personas' && (
						<div className="p-6">
							{/* Add Persona Button */}
							<div className="mb-6">
								<button
									onClick={() => setShowPersonaForm(!showPersonaForm)}
									className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
								>
									<i className="fas fa-plus mr-2"></i>
									{showPersonaForm ? 'Cancel' : 'Add New Persona'}
								</button>
							</div>

							{/* Persona Creation Form */}
							{showPersonaForm && (
								<div className="bg-gray-50 p-6 rounded-lg mb-6">
									<h3 className="text-lg font-medium text-gray-900 mb-4">Create New Persona</h3>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Name (ID)
											</label>
											<input
												type="text"
												value={personaForm.name}
												onChange={(e) => setPersonaForm({...personaForm, name: e.target.value})}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="e.g., technical_expert"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Display Name
											</label>
											<input
												type="text"
												value={personaForm.display_name}
												onChange={(e) => setPersonaForm({...personaForm, display_name: e.target.value})}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="Technical Expert"
											/>
										</div>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Description
											</label>
											<textarea
												value={personaForm.description}
												onChange={(e) => setPersonaForm({...personaForm, description: e.target.value})}
												rows={3}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="Describe the persona's role and capabilities..."
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Temperature
											</label>
											<input
												type="number"
												min="0"
												max="2"
												step="0.1"
												value={personaForm.default_temperature}
												onChange={(e) => setPersonaForm({...personaForm, default_temperature: parseFloat(e.target.value)})}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Max Tokens
											</label>
											<input
												type="number"
												min="1"
												max="100000"
												value={personaForm.max_tokens}
												onChange={(e) => setPersonaForm({...personaForm, max_tokens: parseInt(e.target.value)})}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
											/>
										</div>
										<div className="md:col-span-2">
											<label className="block text-sm font-medium text-gray-700 mb-2">
												Prompt Content
											</label>
											<textarea
												value={personaForm.prompt_content}
												onChange={(e) => setPersonaForm({...personaForm, prompt_content: e.target.value})}
												rows={4}
												className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
												placeholder="Enter the system prompt for this persona..."
											/>
										</div>
									</div>
									<div className="mt-4 flex gap-2">
										<button
											onClick={createPersona}
											className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
										>
											Create Persona
										</button>
										<button
											onClick={() => setShowPersonaForm(false)}
											className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
										>
											Cancel
										</button>
									</div>
								</div>
							)}

							{/* Personas List */}
							{personas.length === 0 ? (
								<div className="text-center py-12">
									<i className="fas fa-user-circle text-4xl text-gray-400 mb-4"></i>
									<h3 className="text-lg font-medium text-gray-900 mb-2">No personas created</h3>
									<p className="text-gray-600 mb-4">Create your first AI persona to get started</p>
									<button
										onClick={() => setShowPersonaForm(true)}
										className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
									>
										<i className="fas fa-plus mr-2"></i>Create Persona
									</button>
								</div>
							) : (
								<div className="space-y-8">
									{(() => {
										const systemPersonas = personas.filter(persona => persona.user_id === 1);
										const userPersonas = personas.filter(persona => persona.user_id !== 1);

										return (
											<>
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
																			<span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
																				persona.is_active
																					? 'bg-green-100 text-green-800'
																					: 'bg-gray-100 text-gray-800'
																			}`}>
																				{persona.is_active ? 'Active' : 'Inactive'}
																			</span>
																		</div>
																	</div>
																</div>
															))}
														</div>
													</div>
												)}

												{/* Show message if user has no personas */}
												{userPersonas.length === 0 && (
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
												)}
											</>
										);
									})()}
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* Import Modal */}
			{showImportModal && (
				<div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">Import Documents</h3>
						<p className="text-sm text-gray-600 mb-4">
							Select a JSON backup file to import documents from a previous export.
						</p>
						<input
							ref={importInputRef}
							type="file"
							accept=".json"
							onChange={handleImportDocuments}
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-4"
						/>
						<div className="flex justify-end gap-2">
							<button
								onClick={() => setShowImportModal(false)}
								className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default DocumentManagementClientSide