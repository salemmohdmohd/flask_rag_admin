import React from 'react'
import ReactMarkdown from 'react-markdown'

function MessageDisplay({ message, onSuggestionClick }) {
	const { type, content, timestamp, follow_up_suggestions, persona } = message

	return (
		<div className={`mb-1 ${type === 'user' ? 'text-end' : 'text-start'}`}>
			<div className={`d-inline-block p-2 rounded-3 ${type === 'user'
				? 'bg-primary text-white'
				: 'bg-light text-dark'
			}`} style={{
				maxWidth: 'min(85%, 600px)',
				maxHeight: '70vh',
				fontSize: '0.8rem',
				overflowY: 'auto'
			}}>
				<div className="d-flex align-items-center mb-1">
					<strong className="me-2" style={{ fontSize: '0.75rem' }}>
						{type === 'user' ? 'You' : (persona?.display_name || 'Assistant')}:
					</strong>
					{persona && type === 'assistant' && (
						<span className="badge bg-info text-dark" style={{ fontSize: '0.45em', padding: '0.2em 0.4em' }}>
							{persona.display_name}
						</span>
					)}
				</div>
				<div className="message-content">
					{type === 'user' ? (
						// User messages display as plain text
						content
					) : (
						// Assistant messages render as Markdown
						<ReactMarkdown
							components={{
								// Custom styles for Markdown elements - more compact
								h1: ({ children }) => <h6 className="mb-1 fw-bold" style={{ fontSize: '0.9rem' }}>{children}</h6>,
								h2: ({ children }) => <div className="mb-1 fw-bold" style={{ fontSize: '0.85rem' }}>{children}</div>,
								h3: ({ children }) => <div className="mb-1 fw-bold" style={{ fontSize: '0.8rem' }}>{children}</div>,
								p: ({ children }) => <div className="mb-1" style={{ fontSize: '0.8rem' }}>{children}</div>,
								ul: ({ children }) => <ul className="mb-1 ps-2" style={{ fontSize: '0.8rem' }}>{children}</ul>,
								ol: ({ children }) => <ol className="mb-1 ps-2" style={{ fontSize: '0.8rem' }}>{children}</ol>,
								li: ({ children }) => <li style={{ marginBottom: '0.2rem', fontSize: '0.8rem' }}>{children}</li>,
								strong: ({ children }) => <strong className="fw-bold">{children}</strong>,
								em: ({ children }) => <em className="fst-italic">{children}</em>,
								code: ({ children, className }) => {
									// Check if it's a code block or inline code
									if (className?.includes('language-')) {
										return (
											<pre className="bg-dark text-light p-2 rounded mt-1 mb-1" style={{ fontSize: '0.7rem' }}>
												<code>{children}</code>
											</pre>
										)
									}
									return <code className="bg-secondary bg-opacity-10 px-1 rounded" style={{ fontSize: '0.75rem' }}>{children}</code>
								},
								blockquote: ({ children }) => (
									<blockquote className="border-start border-2 border-primary ps-2 fst-italic mb-1" style={{ fontSize: '0.75rem' }}>
										{children}
									</blockquote>
								),
								hr: () => <hr className="my-1" />,
								table: ({ children }) => (
									<div className="table-responsive">
										<table className="table table-sm table-bordered" style={{ fontSize: '0.75rem' }}>{children}</table>
									</div>
								),
								thead: ({ children }) => <thead className="table-light">{children}</thead>,
								// Links should open in new tab for external URLs
								a: ({ href, children }) => (
									<a
										href={href}
										target={href?.startsWith('http') ? '_blank' : undefined}
										rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
										className="text-decoration-none"
									>
										{children}
									</a>
								)
							}}
						>
							{content}
						</ReactMarkdown>
					)}
				</div>

				{/* Follow-up suggestions for assistant messages - compact */}
				{type === 'assistant' && follow_up_suggestions && follow_up_suggestions.length > 0 && (
					<div className="mt-1 pt-1 border-top border-secondary border-opacity-25">
						<small className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.65rem' }}>💡 You might also ask:</small>
						<div className="d-flex flex-wrap gap-1">
							{follow_up_suggestions.map((suggestion, index) => (
								<button
									key={index}
									className="btn btn-outline-primary btn-sm"
									onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
									style={{
										fontSize: '0.65rem',
										padding: '0.15rem 0.4rem',
										lineHeight: '1.1'
									}}
								>
									{suggestion.length > 40 ? `${suggestion.substring(0, 40)}...` : suggestion}
								</button>
							))}
						</div>
					</div>
				)}

				{timestamp && (
					<small className={`d-block mt-1 opacity-75 ${type === 'user' ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>
						{timestamp}
					</small>
				)}
			</div>
		</div>
	)
}

export default MessageDisplay