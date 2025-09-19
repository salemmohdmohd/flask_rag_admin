rag-chat-app/
├── backend/
│   ├── venv/                      # Python virtual environment
│   ├── __init__.py                # Main Flask application instance and config
│   ├── config.py                  # Environment and database config
│   ├── routes.py                  # Application routes for API and frontend
│   ├── rag_pipeline_simple.py     # Simple RAG logic without a vector DB
│   ├── models/
│   │   ├── __init__.py
│   │   └── user_models.py         # SQLAlchemy and Flask-RBAC user/role models
│   │   ├── feedback_models.py      # Feedback table models
│   │   ├── session_models.py       # Session and password reset models
│   │   ├── settings_models.py      # User settings models
│   │   ├── audit_models.py         # File audit log models
│   │   ├── chat_models.py          # Chat history models
│   ├── admin/
│   │   ├── __init__.py
│   │   ├── admin_views.py         # Flask-Admin custom views for file editing
│   │   └── templates/
│   │       ├── file_editor.html   # Admin HTML for editing markdown files
│   │       └── rag_admin.html     # Admin HTML for managing RAG
│   ├── resources/                 # RAG markdown files for keyword search
│   │   ├── api/
│   │   │   └── api-spec.md
│   │   ├── user/
│   │   │   └── user-guide.md
│   │   └── docs/
│   │       └── project-docs.md
│   ├── migrations/                # Database migration scripts for new tables
│   ├── app.db                     # SQLite database file
│   └── requirements.txt           # Python dependencies
└── frontend/
    ├── node_modules/              # npm packages
    ├── public/
    │   └── index.html             # The entry point for the React application
    ├── src/
    │   └── App.js                 # Contains all React UI logic with Bootstrap styling
    │   ├── Feedback.js            # Feedback UI component
    │   ├── Settings.js            # User settings UI component
    │   ├── ChatHistory.js         # Chat history UI component
    │   ├── FileEditor.js          # File editor UI component
    └── package.json               # Node.js dependencies