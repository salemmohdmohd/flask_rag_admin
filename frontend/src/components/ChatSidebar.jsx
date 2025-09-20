import React, { useState } from 'react'

function ChatSidebar({
	sessions,
	currentSession,
	onCreateNewSession,
	onSwitchSession,
	onDeleteSession
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
		<div className="chat-sidebar bg-light border-end d-flex flex-column" style={{ height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
			{/* Sidebar Header */}
			<div className="p-2 border-bottom flex-shrink-0">
				<div className="d-flex justify-content-between align-items-center mb-1">
					<h6 className="mb-0 fw-bold" style={{ fontSize: '0.75rem' }}>
						<i className="fas fa-history me-1" style={{ fontSize: '0.7rem' }}></i>
						Sessions
					</h6>
					<button
						className="btn btn-outline-primary btn-sm"
						onClick={() => setShowNewSessionInput(true)}
						disabled={showNewSessionInput}
						title="New Chat Session"
						style={{ fontSize: '0.6rem', padding: '0.2rem 0.4rem' }}
					>
						<i className="fas fa-plus"></i>
					</button>
				</div>

				{/* New Session Input */}
				{showNewSessionInput && (
					<div className="mb-1">
						<div className="input-group input-group-sm">
							<input
								type="text"
								className="form-control form-control-sm"
								placeholder="Session name..."
								value={newSessionName}
								onChange={(e) => setNewSessionName(e.target.value)}
								onKeyPress={handleKeyPress}
								autoFocus
								style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
							/>
							<button
								className="btn btn-success btn-sm"
								onClick={handleCreateSession}
								disabled={!newSessionName.trim()}
								style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}
							>
								<i className="fas fa-check"></i>
							</button>
							<button
								className="btn btn-outline-secondary btn-sm"
								onClick={() => {
									setShowNewSessionInput(false)
									setNewSessionName('')
								}}
								style={{ fontSize: '0.6rem', padding: '0.25rem 0.5rem' }}
							>
								<i className="fas fa-times"></i>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Sessions List */}
						{/* Sessions List */}
			<div className="session-list flex-grow-1" style={{ overflowY: 'auto', overflowX: 'hidden', minHeight: 0, maxHeight: 'calc(100vh - 120px)' }}>
				{sessions.length === 0 ? (
					<div className="text-center p-2">
						<i className="fas fa-comment-alt text-muted mb-1" style={{ fontSize: '1rem' }}></i>
						<div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>No sessions yet</div>
						<button
							className="btn btn-outline-primary btn-sm"
							onClick={() => setShowNewSessionInput(true)}
							style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }}
						>
							Create first session
						</button>
					</div>
				) : (
					sessions.map(session => (
						<div
							key={session.id}
							className={`session-item p-2 border-bottom cursor-pointer ${
								currentSession?.id === session.id ? 'bg-primary text-white' : 'bg-white'
							}`}
							onClick={() => onSwitchSession(session)}
							style={{
								cursor: 'pointer',
								transition: 'all 0.2s ease'
							}}
							onMouseEnter={(e) => {
								if (currentSession?.id !== session.id) {
									e.currentTarget.style.backgroundColor = '#f8f9fa'
								}
							}}
							onMouseLeave={(e) => {
								if (currentSession?.id !== session.id) {
									e.currentTarget.style.backgroundColor = 'white'
								}
							}}
						>
							<div className="d-flex justify-content-between align-items-start">
								<div className="flex-grow-1 me-1">
									<div className="fw-medium text-truncate" style={{ fontSize: '0.75rem' }}>
										{session.name}
									</div>
									<div className={`d-flex justify-content-between ${
										currentSession?.id === session.id ? 'text-white-50' : 'text-muted'
									}`} style={{ fontSize: '0.65rem' }}>
										<span>{session.messages.length} msgs</span>
										<span>{formatDate(session.createdAt)}</span>
									</div>
								</div>
								<div>
									<button
										className={`btn btn-sm ${
											currentSession?.id === session.id
												? 'btn-outline-light'
												: 'btn-outline-danger'
										}`}
										onClick={(e) => {
											e.stopPropagation()
											if (window.confirm(`Delete "${session.name}"?`)) {
												onDeleteSession(session.id)
											}
										}}
										style={{
											fontSize: '0.55rem',
											padding: '0.1rem 0.25rem'
										}}
									>
										<i className="fas fa-trash"></i>
									</button>
								</div>
							</div>

							{/* Message Preview */}
							{session.messages && session.messages.length > 0 && (
								<div className="mt-1">
									<div className={`text-truncate ${
										currentSession?.id === session.id ? 'text-white-50' : 'text-muted'
									}`} style={{ fontSize: '0.6rem' }}>
										{session.messages[session.messages.length - 1].content.substring(0, 40)}
										{session.messages[session.messages.length - 1].content.length > 40 && '...'}
									</div>
								</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	)
}

export default ChatSidebar