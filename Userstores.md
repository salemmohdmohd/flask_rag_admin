User Stories (Chat Interface)

Core Functionality
* As a user, I want to chat with an AI assistant that references information from project Markdown files, so that I receive context-specific answers to my questions.
* As a user, I want to see my conversation history in the chat interface, so that I can easily follow the flow of the conversation.
* As a user, I want the chat input area to be clear and easy to use, so that I can focus on my query.

Authentication
* As a user, I want to securely log in with a username and password, so that my chat history and access are protected.
* As a user, I want to log out of my account, so that my session is ended and my data is protected from unauthorized access.
* As a new user, I want to create an account, so that I can access the chat feature.

Feedback and Experience
* As a user, I want the AI to clearly state when it doesn't have enough information from the knowledge base, so that I know its limitations and can provide more context.
* As a user, I want the chat interface to be visually clear and attractively styled, so that I have a pleasant user experience.

Administrator User Stories (Admin Panel)

Knowledge Base Management
* As an administrator, I want to trigger manual re-indexing of the RAG knowledge base, so that the AI's understanding is updated after new or changed .md files.
* As an administrator, I want to view the RAG status in the admin panel, so that I know when the knowledge base was last updated.
* As an administrator, I want to view and edit the content of .md files directly from the admin panel, so that I don't need to manually access the server's file system for minor changes.

User and Role Management
* As an administrator, I want to view a list of all registered users, so that I can keep track of who is using the system.
* As an administrator, I want to create, update, and delete user accounts, so that I can manage access to the chat application.
* As an administrator, I want to assign different roles (e.g., admin, user) to users, so that I can control permissions and access levels.

Future Development User Stories (Roadmap)
* As a user, I want the chat to use semantic search instead of simple keyword search, so that the AI can find relevant information even if my query uses different phrasing.
* As a user, I want to refer to a specific file in the chat (e.g., by typing /@file.md), so that I can guide the AI to the most relevant information.
* As a developer, I want the system to index different types of code files (e.g., .py, .js), so that the AI can provide context-aware suggestions directly from the codebase.
* As a user, I want to see the chat's response stream in real-time, so that the conversation feels more fluid and responsive.