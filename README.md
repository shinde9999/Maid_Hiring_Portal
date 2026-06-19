Maid Portal — Setup Guide

Overview

This repository contains a full‑stack React + Express application (Frontend + Backend) and a PostgreSQL database. This README explains step‑by‑step how to set up the development environment on Windows (PowerShell), install dependencies, configure environment variables, create the database, and run both frontend and backend.

Prerequisites

- Node.js (16+ recommended) and npm
- PostgreSQL installed and running
- Windows PowerShell (instructions below use PowerShell syntax)

Project layout

- backend/ — Express server, API routes, uploads folder
- frontend/ — React app (create‑react‑app)

Quick checklist (high level)

1) Create a Postgres database and user
2) Configure environment variables for backend
3) Install backend dependencies and start server
4) Install frontend dependencies and start React dev server

Detailed steps

1) Create the database (PostgreSQL)

Open PowerShell and run (replace placeholders):

# Create a DB user and database (run in an elevated psql shell / psql -U postgres)
# Example commands (run in `psql`):
# CREATE ROLE maid_user WITH LOGIN PASSWORD 'your_password';
# CREATE DATABASE maid_portal OWNER maid_user;
# GRANT ALL PRIVILEGES ON DATABASE maid_portal TO maid_user;

If you prefer to run from PowerShell using psql directly:

psql -U postgres -c "CREATE ROLE maid_user WITH LOGIN PASSWORD 'your_password';"
psql -U postgres -c "CREATE DATABASE maid_portal OWNER maid_user;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE maid_portal TO maid_user;"

# Alternative (using createuser / createdb utilities):
# You will be prompted for a password when using -P
createuser -P maid_user
createdb -O maid_user maid_portal

# Verify database and tables (login as the new user):
psql -U maid_user -d maid_portal -c "\l"
psql -U maid_user -d maid_portal -c "\dt"

# Optional: run an SQL schema/seed file (if you have backend/sql/schema.sql)
# psql -U maid_user -d maid_portal -f backend/sql/schema.sql

Notes:
- If you installed PostgreSQL with a GUI (pgAdmin), you can also create the role and database there.
- After creating the DB, update backend/.env DATABASE_URL to match the user, password and DB name.

2) Backend configuration

- Copy or create a .env file inside the backend folder (backend/.env) with at least these variables:

DATABASE_URL=postgres://maid_user:your_password@localhost:5432/maid_portal
JWT_SECRET=your_jwt_secret_here
PORT=5000

Notes:
- The server code includes a startup routine that adds missing columns/tables (ALTER/CREATE IF NOT EXISTS). You do not need a separate migration step: start the server and it will ensure required columns are present.

3) Install and run the backend

Open PowerShell, change directory to the backend and install dependencies:

cd "c:\Users\ACER\Desktop\Maid portal\backend"
npm install

Start the server in development mode (nodemon) or production mode:

npm run dev   # restarts server automatically when code changes (nodemon)
# or
npm start     # runs node server.js

By default the backend listens on port 5000. It exposes uploaded files under /uploads and API under /api.

4) Frontend configuration and run

Open a new PowerShell window and run:

cd "c:\Users\ACER\Desktop\Maid portal\frontend"
npm install
npm start

The CRA dev server runs on port 3000 by default and proxies API requests to the backend baseURL configured in `frontend/src/services/api.js` (default: http://localhost:5000/api). If you change backend port, update that file.

5) Uploads folder

The backend serves uploaded files from backend/uploads. The server creates this folder automatically if missing.

6) Useful endpoints (examples)

- POST /api/auth/register — create a user
- POST /api/auth/login — login and receive JWT
- GET /api/maids — list maids
- GET /api/maids/profile — get logged in maid's profile (requires auth)
- POST /api/maids/profile — create maid profile (requires auth)
- POST /api/auth/profile/photo — upload user profile photo (multipart/form-data)

(See backend/routes for the full list)

7) Notes & troubleshooting

- If you get SQL errors about missing columns, ensure backend server was restarted after .env DATABASE_URL is correct. The server has a startup routine that will add missing columns/tables on first run.
- If frontend compilation complains about missing modules after you removed files, run `npm start` again in the frontend directory after making edits.
- If you want to reset DB schema during development, you can drop and recreate the database using psql, or manually remove problematic tables/columns.

8) Optional: Seed data

You can add seed scripts or insert rows manually with psql for faster testing.

9) Helpful commands summary (PowerShell)

# Backend
cd "c:\Users\ACER\Desktop\Maid portal\backend"; npm install; npm run dev

# Frontend
cd "c:\Users\ACER\Desktop\Maid portal\frontend"; npm install; npm start

10) Contact / Next steps

If you want I can add:
- A simple seed script (SQL) to create a few users/maids for development
- A proper migration tool (e.g., node‑migrate or knex) instead of startup ALTER statements
- A docker-compose file to run Postgres + backend + frontend with a single command

---

End of README
