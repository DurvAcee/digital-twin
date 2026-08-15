# AI Digital Twin 🤖✨

An end-to-end AI-powered **Digital Twin** interactive web application. This project allows users to chat with a personal AI agent that faithfully represents **Durvesh Danve**'s background, skills, key projects, and communication style.

---

## 🌟 Overview & System Architecture

```text
┌─────────────────┐       HTTPS       ┌──────────────────┐       HTTPS       ┌────────────────────────┐
│  Browser / User ├──────────────────►│  AWS CloudFront  ├──────────────────►│     AWS S3 Bucket      │
│ (Next.js 15 UI) │                   │   (Global CDN)   │                   │    (Static Export)     │
└────────┬────────┘                   └──────────────────┘                   └────────────────────────┘
         │
         │ Real-time SSE / REST (/chat/stream)
         ▼
┌─────────────────┐       HTTPS       ┌──────────────────┐       HTTPS       ┌────────────────────────┐
│ AWS API Gateway ├──────────────────►│    AWS Lambda    ├──────────────────►│     Google Gemini      │
│  (HTTP Router)  │                   │ (FastAPI Runtime)│                   │   (gemini-2.5-flash)   │
└─────────────────┘                   └────────┬─────────┘                   └────────────────────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │ S3 / Local Memory│
                                      │ (Session History)│
                                      └──────────────────┘
```

The system is composed of decoupled components:

1. **Frontend (Claude-Inspired UI)**: Built with **Next.js 15 (App Router)**, **TypeScript**, and **Tailwind CSS**. Styled with Anthropic Claude-inspired warm parchment tones (`#FAF9F5`), Google Fonts (**Outfit** & **Plus Jakarta Sans**), real-time **SSE Streaming**, **Hands-Free Voice Input** (Web Speech API), interactive **Featured Project Cards**, and **Markdown Code Highlighting** with 1-click code copy buttons. Hosted statically on **AWS S3** and distributed globally via **AWS CloudFront CDN**.
2. **Backend (Serverless API & Streaming)**: Built with **FastAPI** on Python 3.13, exposing both standard `/chat` REST and real-time `/chat/stream` Server-Sent Events (SSE) endpoints. Deployed as a serverless **AWS Lambda** function behind **AWS API Gateway**. Connects to **Google Gemini (**`gemini-2.5-flash`**)** using the official `google-genai` SDK.
  > **Note on LLM Provider Selection**: While **Amazon Bedrock Nova** (or OpenAI) can easily be swapped in as the underlying LLM backend for cloud-native setups, we chose **Google Gemini 2.5 Flash** for its exceptional speed, high token limits, and strong system prompt instruction adherence.
3. **🧠 Session Memory Engine**:
  - Maintains **persistent multi-turn conversation memory** per session ID. Every turn automatically stores user and model exchanges.
  - Pluggable storage backend: saves memory locally as JSON files during development, and syncs to **AWS S3** (`boto3`) when deployed to production.
4. **🐳 Containerized Lambda Build Pipeline (Docker)**:
  - Uses **Docker** (`public.ecr.aws/lambda/python:3.13` container for `linux/amd64`) in `deploy.py` to cross-compile dependencies and binary wheels for Amazon Linux, avoiding macOS ARM64 `GLIBC` binary mismatches.
5. **Context Engine & Grounded Knowledge**:
  - Parses career facts (`facts.json`), LinkedIn PDF (`linkedin.pdf`), summary notes, and communication style guides into dynamic system instructions tailored across 3 conversation modes (`Engineer` 🛠️, `Recruiter` 💼, `Casual` 💬).

---

## 🛠️ Tech Stack

| Layer | Technologies & Tools |
| :--- | :--- |
| **AI / LLM Engine** | **Google Gemini 2.5 Flash** (`google-genai` SDK) *(Alternative: Amazon Bedrock Nova)* |
| **Backend API** | **FastAPI**, Python 3.13, Uvicorn, Pydantic, `uv` |
| **Session Memory** | **Multi-Turn Memory Engine** (AWS S3 Persistence / Local JSON Storage) |
| **Build & Docker** | **Docker** (`public.ecr.aws/lambda/python:3.13` container for `linux/amd64` cross-compilation) |
| **Frontend UI** | **Next.js 15**, React 19, TypeScript, Tailwind CSS, Lucide Icons, Google Fonts (Outfit & Plus Jakarta Sans) |
| **Cloud Hosting (UI)** | **AWS S3** (Static Website Hosting) + **AWS CloudFront** (Global CDN) |
| **Cloud Compute (API)** | **AWS Lambda** (Python 3.13 runtime via Mangum) + **AWS API Gateway** |
| **Package Management** | `uv` (Fast Python package manager), `npm` (Frontend) |

---

## 📁 Repository Structure

```text
twin/
├── backend/
│   ├── data/                 # Personal context sources (facts.json, linkedin.pdf, style.txt, summary.txt)
│   ├── context.py            # Dynamic system prompt generator with conversation modes
│   ├── resources.py          # PDF & data file parsers (pypdf)
│   ├── server.py             # FastAPI REST & SSE streaming endpoints with S3 session memory
│   ├── deploy.py             # Docker-powered AWS Lambda build packager
│   ├── requirements.txt      # Python dependencies
│   └── pyproject.toml        # uv project configuration
└── frontend/
    ├── app/                  # Next.js App Router (layout.tsx, globals.css, page.tsx)
    ├── components/           # Claude-inspired UI components (twin.tsx chat interface)
    ├── public/               # Static assets
    └── package.json          # Frontend dependencies
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- Python >= 3.13
- `[uv](https://github.com/astral-sh/uv)` (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node.js >= 18 & `npm`
- Docker Desktop (Required for AWS Lambda deployment packaging)

---

### 1. Backend Setup

```bash
cd backend

# Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Install dependencies with uv
uv add -r requirements.txt

# Start local FastAPI server
uv run uvicorn server:app --reload
```

Backend API will be running at `http://localhost:8000`.

---

### 2. Frontend Setup

```bash
cd frontend

# Install packages
npm install

# Run Next.js development server
npm run dev
```

Frontend UI will be running at `http://localhost:3000`.

---

## ☁️ Deployment Architecture

### Frontend (S3 + CloudFront)

1. Build static export: `npm run build` (outputs to `out/`).
2. Sync to S3 bucket: `aws s3 sync out/ s3://twin-frontend-925893297149/ --delete`.
3. Invalidate CloudFront cache: `aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"`.

---

### Backend (AWS Lambda + API Gateway via Docker)

1. Generate deployment zip: `uv run deploy.py` (runs Docker container `public.ecr.aws/lambda/python:3.13` to compile `lambda-deployment.zip`).
2. Upload `lambda-deployment.zip` to AWS Lambda function configured with API Gateway HTTP trigger.
