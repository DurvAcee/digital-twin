# AI Digital Twin 🤖✨

An end-to-end AI-powered **Digital Twin** interactive web application. This project allows users to chat with a personal AI agent that faithfully represents **Durvesh Danve**'s background, skills, projects, and communication style.

---

## 🌟 Overview & System Architecture

```text
┌─────────────────┐       HTTPS       ┌──────────────────┐       HTTPS       ┌────────────────────────┐
│  Browser / User ├──────────────────►│  AWS CloudFront  ├──────────────────►│     AWS S3 Bucket      │
│   (Next.js UI)  │                   │   (Global CDN)   │                   │    (Static Export)     │
└────────┬────────┘                   └──────────────────┘                   └────────────────────────┘
         │
         │ API Requests (/chat)
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

The system is composed of two main decoupled components:

1. **Frontend (UI)**: Built with **Next.js (App Router)** and **Tailwind CSS**. It provides a sleek, responsive chat interface. Hosted statically on **AWS S3** and distributed globally via **AWS CloudFront CDN** for ultra-fast HTTPS delivery.
2. **Backend (API)**: Built with **FastAPI** on Python 3.13, packaged via `deploy.py` and deployed as a serverless **AWS Lambda** function behind **AWS API Gateway**. Connects to **Google Gemini (**`gemini-2.5-flash`**)** using the official `google-genai` SDK.
  > **Note on LLM Provider Selection**: While **Amazon Bedrock Nova** (or OpenAI) can easily be swapped in as the underlying LLM provider for cloud-native AWS setups, we chose **Google Gemini 2.5 Flash** for its exceptional speed, high token limits, and strong system prompt instruction adherence.
3. **Context Engine & Memory**:
  - Parses career facts (`facts.json`), LinkedIn PDF (`linkedin.pdf`), summary notes, and communication style guides into dynamic system instructions.
  - Maintains multi-turn conversation memory per session ID (stored locally or synced to **AWS S3**).

---



## 🛠️ Tech Stack


| Layer                   | Technologies & Tools                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------- |
| **AI / LLM Engine**     | **Google Gemini 2.5 Flash** (`google-genai` SDK) *(Alternative: Amazon Bedrock Nova)* |
| **Backend API**         | **FastAPI**, Python 3.13, Uvicorn, Pydantic, `uv`                                     |
| **Frontend UI**         | **Next.js 15**, React 19, TypeScript, Tailwind CSS, Lucide Icons                      |
| **Cloud Hosting (UI)**  | **AWS S3** (Static Website Hosting) + **AWS CloudFront** (Global CDN)                 |
| **Cloud Compute (API)** | **AWS Lambda** (Python 3.13 runtime via Mangum) + **AWS API Gateway**                 |
| **Package Management**  | `uv` (Fast Python package manager), `npm` (Frontend)                                  |


---



## 📁 Repository Structure

```text
twin/
├── backend/
│   ├── data/                 # Personal context sources (facts.json, linkedin.pdf, style.txt, summary.txt)
│   ├── context.py            # System prompt generator combining context data
│   ├── resources.py          # PDF & data file parsers (pypdf)
│   ├── server.py             # FastAPI endpoints (/chat, /health, /sessions, /conversation)
│   ├── deploy.py             # AWS Lambda build packager
│   ├── requirements.txt      # Python dependencies
│   └── pyproject.toml        # uv project configuration
└── frontend/
    ├── app/                  # Next.js App Router (layout.tsx, page.tsx)
    ├── components/           # UI components (twin.tsx chat interface)
    ├── public/               # Static assets
    └── package.json          # Frontend dependencies
```

---



## 🚀 Quick Start (Local Development)



### Prerequisites

- Python >= 3.13
- `[uv](https://github.com/astral-sh/uv)` (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- Node.js >= 18 & `npm`

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
2. Sync to S3 bucket: `aws s3 sync out/ s3://your-bucket-name --delete`.
3. Invalidate CloudFront cache: `aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"`.



### Backend (AWS Lambda + API Gateway)

1. Generate deployment zip: `uv run deploy.py` (outputs `lambda-deployment.zip`).
2. Upload zip to AWS Lambda function configured with API Gateway HTTP trigger.

