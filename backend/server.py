from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google import genai
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import json
import uuid
from datetime import datetime
from context import prompt

# Load environment variables
load_dotenv(override=True)

app = FastAPI()

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Initialize Gemini client
client = genai.Client()
PRIMARY_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.1-flash-lite")

# Memory storage configuration
USE_S3 = os.getenv("USE_S3", "false").lower() == "true"
S3_BUCKET = os.getenv("S3_BUCKET", "")
MEMORY_DIR = os.getenv("MEMORY_DIR", "../memory")

# Initialize S3 client if needed
if USE_S3:
    import boto3
    from botocore.exceptions import ClientError
    s3_client = boto3.client("s3")


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    mode: Optional[str] = "engineer"  # "engineer", "recruiter", "casual"


class ChatResponse(BaseModel):
    response: str
    session_id: str


class Message(BaseModel):
    role: str
    content: str
    timestamp: str


def get_mode_instruction(mode: Optional[str]) -> str:
    """Return tailored mode instructions based on user selected mode"""
    if mode == "recruiter":
        return "\n\n[MODE INSTRUCTION: You are conversing with a Recruiter / Hiring Manager. Emphasize career impact, key achievements, project outcomes, leadership, and professional experience concisely.]"
    elif mode == "casual":
        return "\n\n[MODE INSTRUCTION: You are conversing with a casual visitor. Be friendly, approachable, easy to understand, and conversational while keeping it professional.]"
    else:
        # Default engineer mode
        return "\n\n[MODE INSTRUCTION: You are conversing with a Software Engineer / Technical Peer. Focus on system architecture, code quality, trade-offs, infrastructure design, and technical depth.]"


# Memory management functions
def get_memory_path(session_id: str) -> str:
    return f"{session_id}.json"


def load_conversation(session_id: str) -> List[Dict]:
    """Load conversation history from storage"""
    if USE_S3:
        try:
            response = s3_client.get_object(Bucket=S3_BUCKET, Key=get_memory_path(session_id))
            return json.loads(response["Body"].read().decode("utf-8"))
        except ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                return []
            raise
    else:
        # Local file storage
        file_path = os.path.join(MEMORY_DIR, get_memory_path(session_id))
        if os.path.exists(file_path):
            with open(file_path, "r") as f:
                return json.load(f)
        return []


def save_conversation(session_id: str, messages: List[Dict]):
    """Save conversation history to storage"""
    if USE_S3:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=get_memory_path(session_id),
            Body=json.dumps(messages, indent=2),
            ContentType="application/json",
        )
    else:
        # Local file storage
        os.makedirs(MEMORY_DIR, exist_ok=True)
        file_path = os.path.join(MEMORY_DIR, get_memory_path(session_id))
        with open(file_path, "w") as f:
            json.dump(messages, f, indent=2)


@app.get("/")
async def root():
    return {
        "message": "AI Digital Twin API",
        "memory_enabled": True,
        "storage": "S3" if USE_S3 else "local",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "use_s3": USE_S3}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())

        # Load conversation history
        conversation = load_conversation(session_id)

        # Build contents for Gemini API
        contents = []
        for msg in conversation[-10:]:
            role = "model" if msg["role"] in ("assistant", "model") else "user"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        contents.append({"role": "user", "parts": [{"text": request.message}]})

        system_instruction = prompt() + get_mode_instruction(request.mode)
        config = {"system_instruction": system_instruction}

        # Call Gemini API with automatic fallback on 429 quota error
        try:
            response = client.models.generate_content(
                model=PRIMARY_MODEL,
                config=config,
                contents=contents,
            )
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"[Quota Exceeded] Primary model '{PRIMARY_MODEL}' exhausted. Falling back to '{FALLBACK_MODEL}'...")
                response = client.models.generate_content(
                    model=FALLBACK_MODEL,
                    config=config,
                    contents=contents,
                )
            else:
                raise e

        assistant_response = response.text

        # Update conversation history
        conversation.append(
            {"role": "user", "content": request.message, "timestamp": datetime.now().isoformat()}
        )
        conversation.append(
            {
                "role": "assistant",
                "content": assistant_response,
                "timestamp": datetime.now().isoformat(),
            }
        )

        # Save conversation
        save_conversation(session_id, conversation)

        return ChatResponse(response=assistant_response, session_id=session_id)

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Server-Sent Events (SSE) real-time streaming endpoint"""
    try:
        session_id = request.session_id or str(uuid.uuid4())
        conversation = load_conversation(session_id)

        contents = []
        for msg in conversation[-10:]:
            role = "model" if msg["role"] in ("assistant", "model") else "user"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})

        contents.append({"role": "user", "parts": [{"text": request.message}]})

        system_instruction = prompt() + get_mode_instruction(request.mode)
        config = {"system_instruction": system_instruction}

        def event_generator():
            yield f"data: {json.dumps({'type': 'session', 'session_id': session_id})}\n\n"

            try:
                response = client.models.generate_content_stream(
                    model=PRIMARY_MODEL,
                    config=config,
                    contents=contents,
                )
                full_text = ""
                for chunk in response:
                    if chunk.text:
                        full_text += chunk.text
                        yield f"data: {json.dumps({'type': 'chunk', 'text': chunk.text})}\n\n"
            except Exception as e:
                if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                    print(f"[Quota Exceeded] Primary model '{PRIMARY_MODEL}' streaming exhausted. Falling back to '{FALLBACK_MODEL}'...")
                    response = client.models.generate_content_stream(
                        model=FALLBACK_MODEL,
                        config=config,
                        contents=contents,
                    )
                    full_text = ""
                    for chunk in response:
                        if chunk.text:
                            full_text += chunk.text
                            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk.text})}\n\n"
                else:
                    raise e

            conversation.append(
                {"role": "user", "content": request.message, "timestamp": datetime.now().isoformat()}
            )
            conversation.append(
                {
                    "role": "assistant",
                    "content": full_text,
                    "timestamp": datetime.now().isoformat(),
                }
            )
            save_conversation(session_id, conversation)
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        print(f"Error in chat stream endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/conversation/{session_id}")
async def get_conversation(session_id: str):
    """Retrieve conversation history"""
    try:
        conversation = load_conversation(session_id)
        return {"session_id": session_id, "messages": conversation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)