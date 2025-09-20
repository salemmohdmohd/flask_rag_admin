import React from 'react'
import useChat from '../hooks/useChat'
import useChatSessions from '../hooks/useChatSessions'
import ChatSidebar from './ChatSidebar'
import MessageDisplay from './MessageDisplay'
import PersonaSelector from '../PersonaSelector'

function Dashboard({ onLogout }) {
	const {
		sessions,
		currentSession,
		createNewSession,
		switchToSession,
		deleteSession
	} = useChatSessions()

	const { sendMessage, loading } = useChat(currentSession?.id, sessions)

	const [message, setMessage] = React.useState('')
	const [sending, setSending] = React.useState(false)
	const [currentPersona, setCurrentPersona] = React.useState(null)

	const handleSendMessage = async () => {
		if (message.trim() && currentSession) {
			setSending(true)
			try {
				// Include persona_name in the message if a persona is selected
				const messageData = {
					message: message,
					session_id: currentSession.id
				}

				if (currentPersona?.name) {
					messageData.persona_name = currentPersona.name
				}

				await sendMessage(message, messageData)
				setMessage('')
			} catch (error) {
				console.error('Error sending message:', error)
			} finally {
				setSending(false)
			}
		}
	}

	const handlePersonaChange = (persona) => {
		setCurrentPersona(persona)
	}

	const handleKeyPress = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage()
		}
	}

	const handleSuggestionClick = (suggestion) => {
		setMessage(suggestion)
	}

	const currentMessages = currentSession?.messages || []

	return (
		<div className="dashboard d-flex flex-column" style={{ height: '100vh' }}>
			{/* Dashboard Navbar */}
			<nav className="navbar navbar-expand-lg navbar-dark bg-primary py-1 flex-shrink-0">
				<div className="container-fluid">
					<a className="navbar-brand fw-bold" href="#" style={{ fontSize: '1.1rem' }}>RAG Admin Dashboard</a>
					<div className="navbar-nav ms-auto">
						<button className="btn btn-outline-light btn-sm py-1 px-2" onClick={onLogout}>
							<i className="fas fa-sign-out-alt me-1"></i>Logout
						</button>
					</div>
				</div>
			</nav>

			{/* Dashboard Content */}
			<div className="container-fluid p-0 flex-grow-1 d-flex">
				<div className="row g-0 w-100">
					{/* Left Sidebar for Chat Sessions */}
					<div className="col-xl-3 col-lg-4 col-md-5 d-none d-md-block">
						<div style={{ height: '100%', overflow: 'hidden' }}>
							<ChatSidebar
								sessions={sessions}
								currentSession={currentSession}
								onCreateNewSession={createNewSession}
								onSwitchSession={switchToSession}
								onDeleteSession={deleteSession}
							/>
						</div>
					</div>

					{/* Main Chat Area */}
					<div className="col-xl-9 col-lg-8 col-md-7 col-12">
						<div className="p-2 p-md-3 h-100 d-flex flex-column">
							{/* Mobile Session Selector */}
							<div className="d-md-none mb-2">
								<div className="d-flex gap-2 align-items-center">
									<select
										className="form-select form-select-sm flex-grow-1"
										value={currentSession?.id || ''}
										onChange={(e) => {
											const session = sessions.find(s => s.id === e.target.value)
											if (session) switchToSession(session)
										}}
									>
										<option value="">Select Session...</option>
										{sessions.map(session => (
											<option key={session.id} value={session.id}>
												{session.name} ({session.messages.length})
											</option>
										))}
									</select>
									<button
										className="btn btn-primary btn-sm"
										onClick={createNewSession}
									>
										<i className="fas fa-plus"></i>
									</button>
								</div>
							</div>
							{/* Persona Selector */}
							<div className="mb-2">
								<PersonaSelector onPersonaChange={handlePersonaChange} />
							</div>

							{/* Current Session Info */}
							{currentSession && (
								<div className="mb-2">
									<div className="d-flex align-items-center">
										<h6 className="mb-0 me-2">
											<i className="fas fa-comments me-1"></i>
											{currentSession.name}
										</h6>
										<small className="text-muted">
											{currentMessages.length} messages
										</small>
									</div>
								</div>
							)}

							{/* Chat Messages Area */}
							<div className="card mb-2 d-flex flex-column" style={{ minHeight: '300px', flex: '1 1 auto', overflow: 'hidden' }}>
								<div className="card-header py-2 flex-shrink-0">
									<h6 className="mb-0 small">
										{currentSession ? 'Conversation' : 'No Session Selected'}
									</h6>
								</div>
								<div className="card-body p-2 flex-grow-1" style={{ overflow: 'auto' }}>
									{!currentSession ? (
										<div className="text-center text-muted mt-5">
											<i className="fas fa-plus-circle fa-2x mb-2"></i>
											<h6>No session selected</h6>
											<p className="small">Create a new session or select an existing one from the sidebar to start chatting.</p>
										</div>
									) : currentMessages.length === 0 ? (
										<div className="text-center text-muted mt-5">
											<i className="fas fa-comment-dots fa-2x mb-2"></i>
											<h6>No messages yet</h6>
											<p className="small">Start the conversation by sending a message below!</p>
										</div>
									) : (
										currentMessages.map((msg, index) => (
											<MessageDisplay
												key={index}
												message={msg}
												onSuggestionClick={handleSuggestionClick}
											/>
										))
									)}
								</div>
							</div>

							{/* Chat Input */}
							<div className="input-group flex-shrink-0">
								<input
									className="form-control"
									value={message}
									onChange={e => setMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder={currentSession ? "Ask something about your documents..." : "Create or select a session to start chatting..."}
									disabled={sending || !currentSession}
								/>
								<button
									className="btn btn-primary"
									onClick={handleSendMessage}
									disabled={sending || !message.trim() || !currentSession}
								>
									{sending ? (
										<>
											<span className="spinner-border spinner-border-sm me-1"></span>
											Sending...
										</>
									) : (
										<>
											<i className="fas fa-paper-plane me-1"></i>Send
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default Dashboard