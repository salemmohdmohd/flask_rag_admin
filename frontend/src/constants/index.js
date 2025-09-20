export const TOKEN_KEY = 'jwt_token'

export const API_ENDPOINTS = {
	HEALTH: '/health',
	LOGIN: '/auth/login',
	LOGOUT: '/auth/logout',
	CHAT_MESSAGE: '/chat/message',
	CHAT_HISTORY: '/chat/history',
}

export const MESSAGES = {
	LOGIN_ERROR: 'Invalid credentials',
	NETWORK_ERROR: 'Network error. Please try again.',
	LOADING: 'Loading...',
	NO_CHAT_HISTORY: 'No chat history yet. Start a conversation!',
}

export const UI_CONFIG = {
	CHAT_HISTORY_LIMIT: 50,
	MESSAGE_PREVIEW_LENGTH: 50,
}