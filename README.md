# Client Lead Management System (Mini CRM)

A simple CRM application to manage client leads generated from website contact forms.

## Stack
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB via Mongoose

## Features
- Lead listing with name, email, source, status
- Lead status updates: new / contacted / converted
- Notes for each lead
- Secure admin login with JSON Web Token
- Create and update leads using REST API

## Setup
1. Install dependencies:
   ```bash
   npm run install-all
   ```

2. Configure the backend environment:
   - Copy `server/.env.example` to `server/.env`
   - Set `MONGODB_URI`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`

3. Start MongoDB locally or use Docker:
   - Local MongoDB: make sure MongoDB is running on `mongodb://127.0.0.1:27017`
   - Docker: run `docker-compose up --build`

4. Run the app:
   ```bash
   npm run dev
   ```

4. Open the frontend at `http://localhost:5173`

## Notes
- The backend runs on port `4000`.
- The frontend calls the backend via `VITE_API_BASE_URL`.
