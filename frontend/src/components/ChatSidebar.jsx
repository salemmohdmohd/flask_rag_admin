import { useState } from 'react'

function ChatSidebar({
	sessions,
	currentSession,
	onCreateNewSession,
	onSwitchSession,
	onDeleteSession,
	isMobile = false
}) {
	const [showNewSessionInput, setShowNewSessionInput] = useState(false)
	const [newSessionName, setNewSessionName] = useState('')

	const handleCreateSession = () => {
		if (newSessionName.trim()) {
			onCreateNewSession(newSessionName.trim())
			setNewSessionName('')
			setShowNewSessionInput(false)
		}
	}

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleCreateSession()
		} else if (e.key === 'Escape') {
			setShowNewSessionInput(false)
			setNewSessionName('')
		}
	}

	const formatDate = (dateStr) => {
		const date = new Date(dateStr)
		const now = new Date()
		const diffTime = Math.abs(now - date)
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

		if (diffDays === 1) return 'Today'
		if (diffDays === 2) return 'Yesterday'
		if (diffDays <= 7) return `${diffDays - 1} days ago`
		return date.toLocaleDateString()
	}

	return (
		<div className={`bg-light d-flex flex-column ${isMobile ? 'h-100' : ''}`} style={{
			height: isMobile ? '100%' : '100vh',
			maxHeight: isMobile ? 'none' : '100vh',
			overflow: 'hidden'
		}}>
			{/* Sidebar Header */}
			<div className={`p-3 border-bottom flex-shrink-0 ${isMobile ? 'bg-primary text-white' : ''}`}>
				<div className="d-flex justify-content-between align-items-center mb-2">
					<h6 className={`mb-0 fw-bold ${isMobile ? 'text-white' : ''}`}>
						<i className={`fas fa-history me-2 ${isMobile ? 'text-white' : ''}`}></i>
						Chat Sessions
					</h6>
								<button
									className={`btn theme-btn btn-sm ${isMobile ? 'btn-light' : 'btn-outline-primary'}`}
									onClick={() => setShowNewSessionInput(true)}
									disabled={showNewSessionInput}
									title="New Chat Session"
									aria-label="Create new chat session"
								>
									<i className="fas fa-plus"></i>
								</button>
				</div>

				{/* New Session Input */}
				{showNewSessionInput && (
					<div className="mb-0">
						<div className="input-group input-group-sm">
											<input
												type="text"
												className="form-control theme-input"
												placeholder="Session name..."
												value={newSessionName}
												onChange={(e) => setNewSessionName(e.target.value)}
												onKeyPress={handleKeyPress}
												autoFocus
												aria-label="New session name"
											/>
											<button
												className="btn theme-btn btn-success"
												onClick={handleCreateSession}
												disabled={!newSessionName.trim()}
												aria-label="Confirm new session"
											>
												<i className="fas fa-check"></i>
											</button>
											<button
												className="btn theme-btn btn-outline-secondary"
												onClick={() => {
													setShowNewSessionInput(false)
													setNewSessionName('')
												}}
												aria-label="Cancel new session"
											>
												<i className="fas fa-times"></i>
											</button>
						</div>
					</div>
				)}
			</div>

			{/* Sessions List */}
			<div className="flex-grow-1 overflow-auto">
				{sessions.length === 0 ? (
					<div className="text-center p-4">
						<i className="fas fa-comment-alt text-muted mb-3" style={{ fontSize: '2rem' }}></i>
						<div className="text-muted mb-3">No sessions yet</div>
									<button
										className="btn theme-btn btn-outline-primary"
										onClick={() => setShowNewSessionInput(true)}
										aria-label="Create your first session"
									>
										<i className="fas fa-plus me-2"></i>
										Create your first session
									</button>
					</div>
				) : (
					<div className="list-group list-group-flush">
						{sessions.map(session => (
											<div
												key={session.id}
												className={`list-group-item list-group-item-action border-0 ${currentSession?.id === session.id ? 'active' : ''}`}
												onClick={() => onSwitchSession(session)}
												style={{ cursor: 'pointer', minHeight: '80px' }}
												aria-label={`Switch to session ${session.name}`}
											>
								<div className="d-flex align-items-start" style={{ gap: '8px' }}>
									<div className="flex-grow-1" style={{ minWidth: 0 }}>
										<div className="fw-semibold text-truncate mb-1">
											{session.name}
										</div>
										<div className={`d-flex justify-content-between small mb-1 ${
											currentSession?.id === session.id ? 'text-white-50' : 'text-muted'
										}`}>
											<span className="text-truncate" style={{ maxWidth: '60%' }}>
												<i className="fas fa-comment me-1"></i>
												{session.messages.length} messages
											</span>
											<span className="text-nowrap">{formatDate(session.createdAt)}</span>
										</div>

										{/* Message Preview */}
										{session.messages && session.messages.length > 0 && (
											<div className={`small text-truncate ${
												currentSession?.id === session.id ? 'text-white-50' : 'text-muted'
											}`} style={{ maxWidth: '100%' }}>
												<i className="fas fa-quote-left me-1"></i>
												{session.messages[session.messages.length - 1].content.substring(0, 50)}
												{session.messages[session.messages.length - 1].content.length > 50 && '...'}
											</div>
										)}
									</div>

									<div className="flex-shrink-0 align-self-start">
															<button
																className={`btn theme-btn btn-sm ${currentSession?.id === session.id ? 'btn-outline-light' : 'btn-outline-danger'}`}
																onClick={(e) => {
																	e.stopPropagation()
																	if (window.confirm(`Delete "${session.name}"?`)) {
																		onDeleteSession(session.id)
																	}
																}}
																title="Delete session"
																style={{ minWidth: '32px' }}
																aria-label={`Delete session ${session.name}`}
															>
																<i className="fas fa-trash"></i>
															</button>
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

export default ChatSidebar
