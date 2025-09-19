# Project Knowledge Base

## Files and Resources

This app uses a simple Retrieval-Augmented Generation (RAG) flow that reads Markdown (`.md`) files from `backend/resources`.

- Location: `backend/resources`
- Format: Plain Markdown (`.md`)
- Purpose: Provide context for answering user questions in the chat

You can manage these files from the Admin console:

- Admin → Tools: List current resources, upload new `.md`, delete files, and view audit logs
- Admin → Editor: Open any Markdown file by relative path, edit its contents, and save

## How to Add Content

1. Log into the Admin console (`/admin`)
2. Open "Tools" to upload a new `.md` file or "Editor" to edit an existing one
3. Ask questions in the frontend chat — matches will be pulled from these docs

## Example Questions

- "What files are there?"
  - The knowledge base consists of Markdown files under `backend/resources`. Use Admin → Tools to see the list.
- "How do I upload new docs?"
  - Go to Admin → Tools, choose a `.md` file, optionally set a subfolder, and upload.
- "Where are resources stored?"
  - On disk under `backend/resources` (recursively scanned for `*.md`).

## Notes

- If no relevant Markdown is found, the system will say it doesn't know.
- Adding or editing files takes effect immediately — no rebuild needed.
