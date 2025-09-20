import React from 'react'
import ReactMarkdown from 'react-markdown'

function MessageDisplay({ message, onSuggestionClick }) {
	const { type, content, timestamp, follow_up_suggestions } = message

	return (
		<div className={`mb-3 ${type === 'user' ? 'text-end' : 'text-start'}`}>
			<div className={`d-inline-block p-3 rounded-3 ${type === 'user'
				? 'bg-primary text-white'
				: 'bg-light text-dark'
			}`} style={{ maxWidth: '70%' }}>
				<strong>{type === 'user' ? 'You' : 'Assistant'}:</strong>
				<div className="mt-1">
					{type === 'user' ? (
						// User messages display as plain text
						content
					) : (
						// Assistant messages render as Markdown
						<ReactMarkdown
							components={{
								// Custom styles for Markdown elements
								h1: ({ children }) => <h5 className="mb-2 fw-bold">{children}</h5>,
								h2: ({ children }) => <h6 className="mb-2 fw-bold">{children}</h6>,
								h3: ({ children }) => <div className="mb-1 fw-bold">{children}</div>,
								p: ({ children }) => <div className="mb-2">{children}</div>,
								ul: ({ children }) => <ul className="mb-2 ps-3">{children}</ul>,
								ol: ({ children }) => <ol className="mb-2 ps-3">{children}</ol>,
								li: ({ children }) => <li className="mb-1">{children}</li>,
								strong: ({ children }) => <strong className="fw-bold">{children}</strong>,
								em: ({ children }) => <em className="fst-italic">{children}</em>,
								code: ({ children, className }) => {
									// Check if it's a code block or inline code
									if (className?.includes('language-')) {
										return (
											<pre className="bg-dark text-light p-2 rounded mt-2 mb-2">
												<code>{children}</code>
											</pre>
										)
									}
									return <code className="bg-secondary bg-opacity-10 px-1 rounded">{children}</code>
								},
								blockquote: ({ children }) => (
									<blockquote className="border-start border-3 border-primary ps-3 fst-italic mb-2">
										{children}
									</blockquote>
								),
								hr: () => <hr className="my-2" />,
								table: ({ children }) => (
									<div className="table-responsive">
										<table className="table table-sm table-bordered">{children}</table>
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

				{/* Follow-up suggestions for assistant messages */}
				{type === 'assistant' && follow_up_suggestions && follow_up_suggestions.length > 0 && (
					<div className="mt-3 pt-2 border-top border-secondary border-opacity-25">
						<small className="text-muted fw-bold">💡 You might also want to ask:</small>
						<div className="mt-2">
							{follow_up_suggestions.map((suggestion, index) => (
								<button
									key={index}
									className="btn btn-outline-primary btn-sm me-2 mb-2"
									onClick={() => onSuggestionClick && onSuggestionClick(suggestion)}
									style={{ fontSize: '0.75rem' }}
								>
									{suggestion}
								</button>
							))}
						</div>
					</div>
				)}

				{timestamp && (
					<small className={`d-block mt-2 ${type === 'user' ? 'text-white-50' : 'text-muted'}`}>
						{timestamp}
					</small>
				)}
			</div>
		</div>
	)
}

export default MessageDisplay