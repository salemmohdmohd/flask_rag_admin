import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/api'

function App() {
	const [status, setStatus] = useState('loading...')

	useEffect(() => {
		axios.get('/health').then(r => setStatus(r.data.status)).catch(() => setStatus('error'))
	}, [])

	return (
		<div className="container py-4">
			<h1 className="mb-3">Flask RAG Admin</h1>
			<p>Backend status: {status}</p>
			<p>Start building the UI in this file.</p>
		</div>
	)
}

const root = createRoot(document.getElementById('root'))
root.render(<App />)

