# AI Digital Twin

An AI-powered digital twin interactive interface built with Next.js and FastAPI powered by Google Gemini.

## Project Structure

```
.
├── backend/    # FastAPI server powered by Google Gemini (uv)
└── frontend/   # Next.js UI component interface (npm)
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
# Create .env with your Gemini API Key
echo "GEMINI_API_KEY=your_key_here" > .env

# Run server with uv
uv run uvicorn server:app --reload
```

The API will run at `http://localhost:8000`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.
