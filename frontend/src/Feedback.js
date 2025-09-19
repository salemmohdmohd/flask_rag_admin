import React, { useEffect, useState } from 'react'
import axios from 'axios'

export default function Feedback() {
	const [chats, setChats] = useState([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [selected, setSelected] = useState('')
	const [rating, setRating] = useState('')
	const [comment, setComment] = useState('')
	const [message, setMessage] = useState('')

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			try {
				const r = await axios.get('/chat/history')
				if (!cancelled) setChats(r.data.items || [])
			} catch (e) {
				if (!cancelled) setError(e?.response?.data?.error || e.message)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [])

	const submit = async e => {
		e.preventDefault()
		setMessage('')
		setError('')
		if (!selected || !rating) {
			setError('Select a chat and rating')
			return
		}
		try {
			await axios.post('/feedback', {
				chat_history_id: parseInt(selected, 10),
				rating: parseInt(rating, 10),
				comment: comment || undefined,
			})
			setMessage('Thanks for the feedback!')
			setComment('')
			setRating('')
		} catch (e) {
			setError(e?.response?.data?.error || e.message)
		}
	}

	if (loading) return <div className="text-muted small">Loading…</div>
	if (error) return <div className="alert alert-warning py-2">{error}</div>

	return (
		<form onSubmit={submit} className="card p-3">
			<h3 className="h6 mb-3">Submit Feedback</h3>
			{message && <div className="alert alert-success py-2">{message}</div>}
			<div className="mb-2">
				<label className="form-label">Chat</label>
				<select className="form-select" value={selected} onChange={e => setSelected(e.target.value)}>
					<option value="">Select a chat…</option>
					{chats.map(c => (
						<option key={c.id} value={c.id}>{c.message.slice(0, 60)}{c.message.length > 60 ? '…' : ''}</option>
					))}
				</select>
			</div>
			<div className="mb-2">
				<label className="form-label">Rating</label>
				<select className="form-select" value={rating} onChange={e => setRating(e.target.value)}>
					<option value="">Choose…</option>
					<option value="1">1 - Bad</option>
					<option value="2">2</option>
					<option value="3">3 - Okay</option>
					<option value="4">4</option>
					<option value="5">5 - Great</option>
				</select>
			</div>
			<div className="mb-3">
				<label className="form-label">Comment (optional)</label>
				<textarea className="form-control" rows="3" value={comment} onChange={e => setComment(e.target.value)} />
			</div>
			<button className="btn btn-primary" type="submit">Submit</button>
		</form>
	)
}

