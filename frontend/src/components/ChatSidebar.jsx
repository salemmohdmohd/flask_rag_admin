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
		<div className="chat-sidebar bg-light border-end" style={{ height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
			{/* Sidebar Header */}
			<div className="p-3 border-bottom">
				<div className="d-flex justify-content-between align-items-center mb-3">
					<h6 className="mb-0 fw-bold">
						<i className="fas fa-history me-2"></i>
						Chat Sessions
					</h6>
					<button
						className="btn btn-outline-primary btn-sm"
						onClick={() => setShowNewSessionInput(true)}
						disabled={showNewSessionInput}
						title="New Chat Session"
					>
						<i className="fas fa-plus"></i>
					</button>
				</div>

				{/* New Session Input */}
				{showNewSessionInput && (
					<div className="mb-2">
						<div className="input-group input-group-sm">
							<input
								type="text"
								className="form-control"
								placeholder="Session name..."
								value={newSessionName}
								onChange={(e) => setNewSessionName(e.target.value)}
								onKeyPress={handleKeyPress}
								autoFocus
							/>
							<button
								className="btn btn-success"
								onClick={handleCreateSession}
								disabled={!newSessionName.trim()}
							>
								<i className="fas fa-check"></i>
							</button>
							<button
								className="btn btn-outline-secondary"
								onClick={() => {
									setShowNewSessionInput(false)
									setNewSessionName('')
								}}
							>
								<i className="fas fa-times"></i>
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Sessions List */}
			<div className="session-list">
				{sessions.length === 0 ? (
					<div className="text-center p-4">
						<i className="fas fa-comment-alt fa-2x text-muted mb-3"></i>
						<div className="small text-muted mb-2">No sessions yet</div>
						<button
							className="btn btn-outline-primary btn-sm"
							onClick={() => setShowNewSessionInput(true)}
						>
							Create your first session!
						</button>
					</div>
				) : (
					sessions.map(session => (
						<div
							key={session.id}
							className={`session-item p-3 border-bottom cursor-pointer ${
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
								<div className="flex-grow-1 me-2">
									<div className="fw-medium text-truncate" style={{ fontSize: '0.9rem' }}>
										{session.name}
									</div>
									<div className={`small mt-1 ${
										currentSession?.id === session.id ? 'text-white-50' : 'text-muted'
									}`}>
										{session.messages.length} messages
									</div>
									<div className={`small ${
										currentSession?.id === session.id ? 'text-white-50' : 'text-muted'
									}`}>
										{formatDate(session.createdAt)}
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
											if (window.confirm(`Delete session "${session.name}"?`)) {
												onDeleteSession(session.id)
											}
										}}
										style={{
											fontSize: '0.7rem',
											padding: '0.2rem 0.4rem'
										}}
									>
										<i className="fas fa-trash"></i>
									</button>
								</div>
							</div>

							{/* Message Preview */}
							{session.messages && session.messages.length > 0 && (
								<div className="mt-2">
									<div className={`small text-truncate ${
										currentSession?.id === session.id ? 'text-white-50' : 'text-muted'
									}`} style={{ fontSize: '0.75rem' }}>
										{session.messages[session.messages.length - 1].content.substring(0, 60)}
										{session.messages[session.messages.length - 1].content.length > 60 && '...'}
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