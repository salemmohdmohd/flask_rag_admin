
# flask_rag_admin

## RAG-Powered Chat App with Admin Panel

### Project Description
This is a full-stack chat application that mimics how an AI agent uses internal knowledge for context. It features:
- A React-based chat interface
- A Flask backend with a Retrieval-Augmented Generation (RAG) system
- A knowledge base built from structured Markdown (.md) files
- An integrated admin panel (Flask-Admin, Flask-RBAC) for user and knowledge management

### Features
- **Context-Aware Responses:** RAG pipeline retrieves relevant information from Markdown files and uses it as context for LLM answers.
- **Simple RAG System:** Lightweight, keyword-based search over Markdown files (no vector DB required).
- **Full-Stack Architecture:** Flask + SQLAlchemy backend, React + Bootstrap frontend.
- **Admin Panel:** Manage users, roles, and trigger manual re-indexing of the RAG knowledge base.
- **Authentication & Authorization:** Flask-RBAC ensures only authenticated admins access privileged features.
- **Folder-Based Knowledge:** RAG indexes content from organized folders (`resources/`, `docs/`, etc.).
- **Feedback System:** Users can rate and comment on AI responses for quality improvement.
- **User Settings:** Each user can customize preferences (theme, notifications, etc.).
- **Session Management:** Secure user sessions and password reset functionality.

### Technologies Used
**Backend:**
- Python 3.x
- Flask
- Flask-Admin
- Flask-RBAC
- SQLAlchemy
- Flask-SQLAlchemy
- Flask-Migrate
- SQLite (for the database)
- Ollama (for the LLM)

**Frontend:**
- React.js
- Bootstrap

**Dev Tools:**
- concurrently (to run backend and frontend together)

**Other:**
- Markdown for knowledge base files

### Prerequisites
Before you begin, ensure you have:
- Python 3.x
- Node.js and npm
- Ollama running with an accessible LLM (e.g., llama3)

### Backend Setup
```sh
cd backend
python -m venv venv
source venv/bin/activate  # On Windows, use venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```sh
cd ../frontend
npm install
npm install concurrently --save-dev
```

### Running Backend & Frontend Together

You can run both backend and frontend in development mode using `concurrently`:

1. Add the following script to your `frontend/package.json`:
	```json
	"scripts": {
	  "dev": "concurrently \"cd ../backend && source venv/bin/activate && flask run\" \"npm start\""
	}
	```
	(On Windows, replace `source venv/bin/activate` with `venv\Scripts\activate`.)

2. From the `frontend` folder, run:
	```sh
	npm run dev
	```
This will start both the Flask backend and React frontend together for development.

### Usage

**Access the chat interface:**
- Navigate to [http://localhost:3000](http://localhost:3000) and log in.

**Access the admin panel:**
- Log in with an admin account and go to [http://localhost:5000/admin](http://localhost:5000/admin)
- Trigger RAG re-indexing after adding/modifying Markdown files
- Manage user accounts and roles

### Roadmap
- Implement Semantic Search: Upgrade RAG pipeline to use semantic search with a vector database
- Expand Codebase Awareness: Index and understand code files (.py, .js, etc.)
- Add Built-in Commands: Integrate custom commands (e.g., @ mentions) into the chat interface
- Real-time Updates: Add live update feature using WebSockets

### License
MIT