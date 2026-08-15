from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
import os
from dotenv import load_dotenv
from typing import Optional, List, Dict
import json
import uuid
from datetime import datetime
from pathlib import Path

# Load environment variables
load_dotenv(override=True)

app = FastAPI()

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client
client = genai.Client()

# Memory directory
MEMORY_DIR = Path("../memory")
MEMORY_DIR.mkdir(exist_ok=True)


# Load personality details
def load_personality():
    with open("me.txt", "r", encoding="utf-8") as f:
        return f.read().strip()


PERSONALITY = load_personality()


# Memory functions
def load_conversation(session_id: str) -> List[Dict]:
    """Load conversation history from file"""
    file_path = MEMORY_DIR / f"{session_id}.json"
    if file_path.exists():
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_conversation(session_id: str, messages: List[Dict]):
    """Save conversation history to file"""
    file_path = MEMORY_DIR / f"{session_id}.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(messages, f, indent=2, ensure_ascii=False)


# Request/Response models
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str


@app.get("/")
async def root():
    return {"message": "AI Digital Twin API with Memory"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Generate session ID if not provided
        session_id = request.session_id or str(uuid.uuid4())
        
        # Load conversation history
        conversation = load_conversation(session_id)
        
        # Build contents for Gemini API
        contents = []
        for msg in conversation:
            role = "model" if msg["role"] in ("assistant", "model") else "user"
            text = msg.get("content") or (msg.get("parts", [{}])[0].get("text", ""))
            contents.append({"role": role, "parts": [{"text": text}]})
        
        contents.append({"role": "user", "parts": [{"text": request.message}]})
        
        # Call Gemini API
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            config={"system_instruction": PERSONALITY},
            contents=contents,
        )
        
        assistant_response = response.text
        
        # Update conversation history
        conversation.append({"role": "user", "content": request.message})
        conversation.append({"role": "assistant", "content": assistant_response})
        
        # Save updated conversation
        save_conversation(session_id, conversation)
        
        return ChatResponse(
            response=assistant_response,
            session_id=session_id
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/sessions")
async def list_sessions():
    """List all conversation sessions"""
    sessions = []
    for file_path in MEMORY_DIR.glob("*.json"):
        session_id = file_path.stem
        with open(file_path, "r", encoding="utf-8") as f:
            conversation = json.load(f)
            sessions.append({
                "session_id": session_id,
                "message_count": len(conversation),
                "last_message": conversation[-1]["content"] if conversation else None
            })
    return {"sessions": sessions}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)