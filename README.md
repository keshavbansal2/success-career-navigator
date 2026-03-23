# CareerNav AI — Career Navigation Platform

A full-stack AI-powered career navigation platform that helps students and early-career professionals identify skill gaps and get personalized learning roadmaps.

## Features

- **Skill Gap Analysis** — AI identifies your skill gaps vs. target role requirements
- **Readiness Score** — Visual percentage showing how ready you are for the role
- **Personalized Roadmap** — Phase-by-phase learning plan with curated resources
- **Mock Interview Questions** — AI-generated technical questions tailored to your role
- **Fallback Demo Mode** — Works even without an API key using realistic mock data

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + React Router
- **Backend**: Python FastAPI + Uvicorn + SQLAlchemy
- **AI**: Anthropic Claude (claude-sonnet-4-6)
- **Auth**: JWT-based authentication with bcrypt password hashing
- **Database**: SQLite (local dev) — easily swappable to PostgreSQL

---

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env and add your Anthropic API key:
# ANTHROPIC_API_KEY=sk-ant-...

# Start the server
uvicorn main:app --reload --port 8000
```

The backend will be available at http://localhost:8000
API docs at http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:5173

---

## Docker Setup

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-your_key_here

# Build and run both services
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/analyze` | Analyze profile, return gap analysis + roadmap |
| POST | `/api/interview-questions` | Generate mock interview questions |

### POST /api/analyze

Request body:
```json
{
  "resume_text": "Your resume content here...",
  "target_role": "Cloud Engineer",
  "github_url": "https://github.com/username",
  "name": "Alex Johnson",
  "education": "B.S. Computer Science",
  "experience": "1 year junior dev"
}
```

### POST /api/interview-questions

Request body:
```json
{
  "resume_text": "Your resume content...",
  "target_role": "Cloud Engineer",
  "skill_gaps": ["Kubernetes", "Terraform", "AWS"]
}
```

---

## Without an API Key

The app works in demo mode without an Anthropic API key. It returns realistic mock data for a Cloud Engineer profile so you can explore all features.

---

## Project Structure

```
success_career_navigator/
├── backend/
│   ├── main.py              # FastAPI app + all endpoints
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app with routing & navbar
│   │   ├── pages/
│   │   │   ├── Home.tsx      # Landing page
│   │   │   └── Analyze.tsx   # Analysis workflow page
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   ├── GapAnalysis.tsx
│   │   │   ├── Roadmap.tsx
│   │   │   ├── InterviewPrep.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── types/index.ts    # TypeScript types
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```
