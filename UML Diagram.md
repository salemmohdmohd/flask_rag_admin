
DATABASE
├── table: user
│   ├── id: Integer [PK]
│   ├── username: String [Unique, Not Null]
│   ├── email: String [Unique, Not Null]
│   ├── password: String [Not Null]
│   ├── active: Boolean [Default: True]
│   ├── created_at: DateTime [Default: Now]
│   ├── updated_at: DateTime [Auto-update]
│   └── profile: JSON [Optional, for extensibility]
│
├── table: role
│   ├── id: Integer [PK]
│   ├── name: String [Unique, Not Null]
│   ├── description: String
│   ├── created_at: DateTime [Default: Now]
│   ├── updated_at: DateTime [Auto-update]
│   └── permissions: JSON [Optional, for future RBAC]
│
├── table: roles_users [Association Table]
│   ├── id: Integer [PK]
│   ├── user_id: Integer [FK to user.id]
│   ├── role_id: Integer [FK to role.id]
│   ├── assigned_at: DateTime [Default: Now]
│   └── UNIQUE(user_id, role_id) [Enforce unique assignments]

Indexes & Relationships
* user.username, user.email: Unique indexes for fast lookup
* roles_users: Many-to-many relationship between user and role
* Foreign keys enforce referential integrity

├── table: personas
│   ├── id: Integer [PK]
│   ├── name: String [Unique, Not Null]
│   ├── display_name: String [Not Null]
│   ├── description: String
│   ├── default_temperature: Float [Not Null]
│   ├── max_tokens: Integer [Not Null]
│   ├── user_id: Integer [FK to user.id, Default: 1]
│   ├── created_at: DateTime [Default: Now]
│   └── is_active: Boolean [Default: True]
│
├── table: resources
│   ├── id: Integer [PK]
│   ├── filename: String [Not Null]
│   ├── filepath: String [Not Null]
│   ├── file_size: Integer [Not Null]
│   ├── user_id: Integer [FK to user.id, Default: 1]
│   ├── created_at: DateTime [Default: Now]
│   ├── updated_at: DateTime [Auto-update]
│   └── is_active: Boolean [Default: True]

* personas.user_id and resources.user_id:
	- `user_id=1`: Company default (system) personas/resources (read-only for users)
	- `user_id≠1`: User-created personas/resources (editable/removable by owner)

├── table: chat_history
│   ├── id: Integer [PK]
│   ├── user_id: Integer [FK to user.id]
│   ├── message: Text [Not Null]
│   ├── response: Text [Nullable]
│   ├── source_file: String [Nullable, references knowledge base]
│   ├── created_at: DateTime [Default: Now]
│   └── context: JSON [Optional, for storing context or metadata]

├── table: file_audit_log
│   ├── id: Integer [PK]
│   ├── file_path: String [Not Null]
│   ├── user_id: Integer [FK to user.id]
│   ├── action: String [e.g., 'edit', 'create', 'delete']
│   ├── timestamp: DateTime [Default: Now]
│   └── change_summary: Text [Optional, description of changes]

├── table: session
│   ├── id: Integer [PK]
│   ├── user_id: Integer [FK to user.id]
│   ├── session_token: String [Unique, Not Null]
│   ├── created_at: DateTime [Default: Now]
│   ├── expires_at: DateTime [Not Null]
│   └── is_active: Boolean [Default: True]

├── table: password_reset_token
│   ├── id: Integer [PK]
│   ├── user_id: Integer [FK to user.id]
│   ├── token: String [Unique, Not Null]
│   ├── created_at: DateTime [Default: Now]
│   ├── expires_at: DateTime [Not Null]
│   └── used: Boolean [Default: False]

├── table: user_settings
│   ├── id: Integer [PK]
│   ├── user_id: Integer [FK to user.id]
│   ├── settings: JSON [Not Null, e.g., theme, notifications]
│   ├── created_at: DateTime [Default: Now]
│   └── updated_at: DateTime [Auto-update]

Indexes & Relationships (continued)
* chat_history.user_id: Foreign key to user
* file_audit_log.user_id: Foreign key to user
* session.user_id: Foreign key to user
* password_reset_token.user_id: Foreign key to user
* user_settings.user_id: Foreign key to user
* chat_history.source_file: Reference to knowledge base files

├── table: feedback
│   ├── id: Integer [PK]
│   ├── user_id: Integer [FK to user.id]
│   ├── chat_history_id: Integer [FK to chat_history.id]
│   ├── rating: Integer [e.g., 1-5]
│   ├── comment: Text [Optional]
│   └── created_at: DateTime [Default: Now]

Indexes & Relationships (continued)
* feedback.user_id: Foreign key to user
* feedback.chat_history_id: Foreign key to chat_history

Notes (continued)
- feedback allows users to rate and comment on AI responses for quality improvement.

Notes (continued)
- chat_history enables tracking of all user-AI interactions and context.
- file_audit_log supports auditing and compliance for knowledge base edits.
- session and password_reset_token tables improve security and user management.
- user_settings allows for personalized user experiences.

Notes
- The user.profile and role.permissions fields allow for future extensibility (e.g., storing user settings, granular permissions).
- Timestamps support auditing and tracking changes.
