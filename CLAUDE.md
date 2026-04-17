# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the index.json file in the data/templates directory, included here:

@data/templates/index.json

The current implementation supports all 11 document types via AI chat with full user authentication and document persistence.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your ai-assistant skill to use Vertex AI with Zod.js and `gpt-4.1-mini` model as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENAI_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in server/ folder.  
The frontend should be in client/ folder.  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via node server, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:9000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Current progress

### PL-2: Legal document template dataset
- Added 10 template JSON files in data/templates/ with index.json registry
- Each template has fields (text, textarea, number, date, select) and sections with {{key}} placeholders

### PL-3: Prototype NDA creator web app
- Angular 19 frontend with standalone components and Angular Material
- Express + TypeScript backend serving template JSON files
- NDA-only route with live form, document preview, and client-side PDF generation via jsPDF
- Two-column layout: form on left, preview on right

### PL-4: Build foundation of V1 product (merged)
- Docker Compose with separate containers: frontend (node:20-alpine + Express static server) and backend (node:20-slim + Express API)
- Backend port changed from 3000 to 9000
- SQLite database via better-sqlite3 with users table schema, created fresh each startup
- Frontend built statically and served via Express with http-proxy-middleware proxying /api to backend
- Start/stop scripts for Mac, Linux, and Windows
- Existing NDA creator works unchanged through the new infrastructure

### PL-5: Add AI Chat for Mutual NDA (merged)
- Replaced static form with freeform AI chat that guides users through NDA creation step by step
- Backend POST /api/chat endpoint using Vercel AI SDK with OpenAI gpt-4.1-mini and Zod structured outputs
- AI extracts field values from natural language and returns them alongside conversational messages
- Document preview updates in real time as fields are extracted from chat
- NDA type hardcoded to Mutual per ticket scope
- Chat panel component with message bubbles, typing indicator, and Enter-to-send

### PL-6: Expand to all supported legal document types (merged)
- Two-phase chat: Phase 1 lists all 10 document types for selection, Phase 2 collects fields dynamically
- Dynamic Zod schemas built at runtime from each template's field definitions (no hardcoded schemas)
- Graceful handling of unsupported document requests with closest-match suggestions
- New generic DocumentCreatorComponent replaces NDA-specific NdaCreatorComponent
- Dynamic toolbar title updates to show selected document type
- Preview placeholder shown until document type is selected
- Manual "Download PDF" button always available in the preview panel

### Change request: Ask before downloading (PR #8)
- Removed unconditional auto-download when all fields were filled
- AI now confirms collected details and asks the user whether they want to download
- New `downloadConfirmed` boolean on the collection response; set to true only after explicit user consent
- Client auto-downloads only when `allFieldsFilled && downloadConfirmed`, guarded to fire once
- Revising fields after a "no" keeps the conversation open without triggering a download

