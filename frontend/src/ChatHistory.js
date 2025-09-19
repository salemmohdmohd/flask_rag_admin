import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function ChatHistory({ items: itemsProp }) {
	const [items, setItems] = useState(itemsProp || [])
	const [loading, setLoading] = useState(!itemsProp)
	const [error, setError] = useState('')

	useEffect(() => {
		if (itemsProp) return
		let cancelled = false
		const load = async () => {
			try {
				const r = await axios.get('/chat/history')
				if (!cancelled) setItems(r.data.items || [])
			} catch (e) {
				if (!cancelled) setError(e?.response?.data?.error || e.message)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [itemsProp])

	if (loading) return <div className="text-muted small">Loading history…</div>
	if (error) return <div className="alert alert-warning py-2">{error}</div>

	return (
		<ul className="list-group">
			{items.map(i => {
				const ts = i.created_at ? new Date(i.created_at) : null
				const nice = ts ? ts.toLocaleString() : ''
				return (
					<li key={i.id} className="list-group-item">
						<div><strong>Q:</strong> {i.message}</div>
						<div><strong>From:</strong> {i.source_file || 'n/a'}</div>
						<div className="text-muted small">{nice}</div>
						{i.token_usage && (
							<div className="text-muted small">tokens: prompt {i.token_usage.prompt_tokens}, completion {i.token_usage.completion_tokens}, total {i.token_usage.total_tokens}</div>
						)}
					</li>
				)
			})}
		</ul>
	)
}

