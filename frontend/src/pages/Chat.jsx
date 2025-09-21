import React from 'react'
import { Link } from 'react-router-dom'
import useChat from '../hooks/useChat'
import useChatSessions from '../hooks/useChatSessions'
import ChatSidebar from '../components/ChatSidebar'
import MessageDisplay from '../components/MessageDisplay'
import PersonaSelector from '../components/PersonaSelector'

function Chat({ onLogout }) {
	const {
		sessions,
		currentSession,
		createNewSession,
		switchToSession,
		deleteSession,
		updateSession
	} = useChatSessions()

	const { sendMessage, loading } = useChat(currentSession?.id, updateSession, currentSession)

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
		<div className="chat-page d-flex flex-column vh-100">
			{/* Chat Navbar */}
			<nav className="navbar navbar-expand navbar-dark bg-primary py-2 flex-shrink-0">
				<div className="container-fluid px-3">
					<a className="navbar-brand fw-bold d-flex align-items-center" href="#" style={{ fontSize: '1.1rem' }}>
						<i className="fas fa-comments me-2 d-none d-sm-inline"></i>
						<span className="d-none d-md-inline">RAG Chat Interface</span>
						<span className="d-md-none">RAG Chat</span>
					</a>

					{/* Mobile sidebar toggle */}
					<button
						className="btn btn-outline-light btn-sm d-md-none me-2"
						type="button"
						data-bs-toggle="offcanvas"
						data-bs-target="#mobileSidebar"
						aria-controls="mobileSidebar"
					>
						<i className="fas fa-bars"></i>
					</button>

					{/* Persona Selector in Navbar */}
					<div className="navbar-nav mx-auto d-none d-sm-flex">
						<PersonaSelector onPersonaChange={handlePersonaChange} className="navbar" />
					</div>

					<div className="navbar-nav ms-auto">
						<Link to="/dashboard" className="btn btn-outline-light btn-sm me-2 py-1 px-3">
							<i className="fas fa-tachometer-alt me-1 d-none d-sm-inline"></i>
							<span className="d-none d-sm-inline">Dashboard</span>
							<span className="d-sm-none"><i className="fas fa-tachometer-alt"></i></span>
						</Link>
						<button className="btn btn-outline-light btn-sm py-1 px-3" onClick={onLogout}>
							<i className="fas fa-sign-out-alt me-1 d-none d-sm-inline"></i>
							<span className="d-none d-sm-inline">Logout</span>
							<span className="d-sm-none"><i className="fas fa-sign-out-alt"></i></span>
						</button>
					</div>
				</div>
			</nav>

			{/* Mobile Offcanvas Sidebar */}
			<div className="offcanvas offcanvas-start d-md-none" tabIndex="-1" id="mobileSidebar" aria-labelledby="mobileSidebarLabel">
				<div className="offcanvas-header border-bottom">
					<h5 className="offcanvas-title" id="mobileSidebarLabel">
						<i className="fas fa-comments me-2"></i>Chat Sessions
					</h5>
					<button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
				</div>
				<div className="offcanvas-body p-0">
					{/* Mobile Persona Selector */}
					<div className="p-3 border-bottom bg-light">
						<PersonaSelector onPersonaChange={handlePersonaChange} />
					</div>

					<ChatSidebar
						sessions={sessions}
						currentSession={currentSession}
						onCreateNewSession={(name) => {
							createNewSession(name)
							// Close offcanvas after creating session
							const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('mobileSidebar'))
							if (offcanvas) offcanvas.hide()
						}}
						onSwitchSession={(session) => {
							switchToSession(session)
							// Close offcanvas after switching session
							const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('mobileSidebar'))
							if (offcanvas) offcanvas.hide()
						}}
						onDeleteSession={deleteSession}
						isMobile={true}
					/>
				</div>
			</div>

			{/* Chat Content */}
			<div className="container-fluid p-0 flex-grow-1 d-flex overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>
				<div className="row g-0 w-100 h-100">
					{/* Desktop Sidebar */}
					<div className="col-xl-3 col-lg-4 col-md-5 d-none d-md-block border-end bg-white">
						<ChatSidebar
							sessions={sessions}
							currentSession={currentSession}
							onCreateNewSession={createNewSession}
							onSwitchSession={switchToSession}
							onDeleteSession={deleteSession}
							isMobile={false}
						/>
					</div>

					{/* Main Chat Area */}
					<div className="col-xl-9 col-lg-8 col-md-7 col-12 d-flex flex-column h-100">
						{/* Mobile Session Info Bar */}
						<div className="d-md-none p-3 border-bottom">
							<div className="card bg-light border-0">
								<div className="card-body p-2">
									<div className="d-flex align-items-center justify-content-between">
										<div className="flex-grow-1">
											{currentSession ? (
												<>
													<h6 className="mb-0 text-truncate">{currentSession.name}</h6>
													<small className="text-muted">{currentMessages.length} messages</small>
												</>
											) : (
												<span className="text-muted">No session selected</span>
											)}
										</div>
										<button
											className="btn btn-primary btn-sm"
											onClick={createNewSession}
										>
											<i className="fas fa-plus"></i>
										</button>
									</div>
								</div>
							</div>
						</div>

						{/* Desktop Session Info */}
						{currentSession && (
							<div className="p-3 border-bottom d-none d-md-block">
								<div className="d-flex align-items-center">
									<h5 className="mb-0 me-3">
										<i className="fas fa-comments me-2 text-primary"></i>
										{currentSession.name}
									</h5>
									<small className="text-muted bg-light px-2 py-1 rounded">
										{currentMessages.length} messages
									</small>
								</div>
							</div>
						)}

						{/* Chat Messages Area - Scrollable */}
						<div className="flex-grow-1 d-flex flex-column overflow-hidden">
							<div className="p-3 pb-0">
								<h6 className="mb-3 d-flex align-items-center">
									<i className="fas fa-comment-dots me-2 text-primary"></i>
									{currentSession ? 'Conversation' : 'No Session Selected'}
								</h6>
							</div>
							<div className="flex-grow-1 overflow-auto px-3">
								{!currentSession ? (
									<div className="text-center text-muted py-5">
										<i className="fas fa-plus-circle fa-3x mb-3 text-primary opacity-50"></i>
										<h5>No session selected</h5>
										<p className="lead">Create a new session or select an existing one to start chatting.</p>
										<button
											className="btn btn-primary btn-lg mt-3 d-md-none"
											data-bs-toggle="offcanvas"
											data-bs-target="#mobileSidebar"
										>
											<i className="fas fa-comments me-2"></i>
											View Sessions
										</button>
									</div>
								) : currentMessages.length === 0 ? (
									<div className="text-center text-muted py-5">
										<i className="fas fa-comment-dots fa-3x mb-3 text-primary opacity-50"></i>
										<h5>No messages yet</h5>
										<p className="lead">Start the conversation by sending a message below!</p>
									</div>
								) : (
									<div className="messages-container pb-3">
										{currentMessages.map((msg, index) => (
											<div key={index} className="mb-3">
												<MessageDisplay
													message={msg}
													onSuggestionClick={handleSuggestionClick}
												/>
											</div>
										))}
									</div>
								)}
							</div>
						</div>

						{/* Chat Input - Sticky at Bottom */}
						<div className="border-top bg-white p-3 flex-shrink-0">
							<div className="input-group">
								<input
									className="form-control form-control-lg border-0 shadow-sm"
									value={message}
									onChange={e => setMessage(e.target.value)}
									onKeyPress={handleKeyPress}
									placeholder={currentSession ? "Ask something about your documents..." : "Create or select a session to start chatting..."}
									disabled={sending || !currentSession}
									style={{ backgroundColor: '#f8f9fa' }}
								/>
								<button
									className="btn btn-primary btn-lg px-4 shadow-sm"
									onClick={handleSendMessage}
									disabled={sending || !message.trim() || !currentSession}
								>
									{sending ? (
										<>
											<span className="spinner-border spinner-border-sm me-2"></span>
											<span className="d-none d-sm-inline">Sending</span>
										</>
									) : (
										<>
											<i className="fas fa-paper-plane me-2"></i>
											<span className="d-none d-sm-inline">Send</span>
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

export default Chat