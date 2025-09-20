import React from 'react'
import useChat from '../hooks/useChat'
import useChatSessions from '../hooks/useChatSessions'
import ChatSidebar from './ChatSidebar'
import MessageDisplay from './MessageDisplay'

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

	const handleSendMessage = async () => {
		if (message.trim() && currentSession) {
			setSending(true)
			try {
				await sendMessage(message)
				setMessage('')
			} catch (error) {
				console.error('Error sending message:', error)
			} finally {
				setSending(false)
			}
		}
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
		<div className="dashboard">
			{/* Dashboard Navbar */}
			<nav className="navbar navbar-expand-lg navbar-dark bg-primary">
				<div className="container-fluid">
					<a className="navbar-brand fw-bold" href="#">RAG Admin Dashboard</a>
					<div className="navbar-nav ms-auto">
						<button className="btn btn-outline-light btn-sm" onClick={onLogout}>
							<i className="fas fa-sign-out-alt me-1"></i>Logout
						</button>
					</div>
				</div>
			</nav>

			{/* Dashboard Content */}
			<div className="container-fluid p-0">
				<div className="row g-0">
					{/* Left Sidebar for Chat Sessions */}
					<div className="col-lg-3 col-md-4">
						<ChatSidebar
							sessions={sessions}
							currentSession={currentSession}
							onCreateNewSession={createNewSession}
							onSwitchSession={switchToSession}
							onDeleteSession={deleteSession}
						/>
					</div>

					{/* Main Chat Area */}
					<div className="col-lg-9 col-md-8">
						<div className="p-4 h-100">
							{/* Current Session Info */}
							{currentSession && (
								<div className="mb-3">
									<h5>
										<i className="fas fa-comments me-2"></i>
										{currentSession.name}
									</h5>
									<small className="text-muted">
										{currentMessages.length} messages in this session
									</small>
								</div>
							)}

							{/* Chat Messages Area */}
							<div className="card mb-3" style={{ height: '60vh' }}>
								<div className="card-header">
									<h6 className="mb-0">
										{currentSession ? 'Conversation' : 'No Session Selected'}
									</h6>
								</div>
								<div className="card-body overflow-auto">
									{!currentSession ? (
										<div className="text-center text-muted mt-5">
											<i className="fas fa-plus-circle fa-3x mb-3"></i>
											<h5>No session selected</h5>
											<p>Create a new session or select an existing one from the sidebar to start chatting.</p>
										</div>
									) : currentMessages.length === 0 ? (
										<div className="text-center text-muted mt-5">
											<i className="fas fa-comment-dots fa-3x mb-3"></i>
											<h5>No messages yet</h5>
											<p>Start the conversation by sending a message below!</p>
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
							<div className="input-group">
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