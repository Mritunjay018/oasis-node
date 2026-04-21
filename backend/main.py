import os
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# ... baaki ka purana code waisa hi rahega
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from unsloth import FastLanguageModel
import torch
import sqlite3

app = FastAPI()

# --- Security Clearance ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP (Permanent Memory) ---
def init_db():
    conn = sqlite3.connect("oasis_memory.db")
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- 1. Load the Model ---
model_name = "../ai_training/oasis_lora_model"
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = model_name,
    max_seq_length = 2048, 
    dtype = None,
    load_in_4bit = True,
)
FastLanguageModel.for_inference(model)

# --- 2. Request Format ---
class ChatRequest(BaseModel):
    session_id: str 
    message: str

# --- 3. The Separated Instruction Template ---
alpaca_prompt = """You are Oasis Node, an advanced AI Expert. 
Use the 'Conversation History' to remember context. Then, answer the 'Current Instruction' accurately.
If the user asks to summarize or define, be concise and technical. Do not repeat previous answers.

### Conversation History:
{}

### Current Instruction:
{}

### Response:
"""

# --- 4. The Core API ---
@app.post("/api/chat")
async def chat_with_ai(request: ChatRequest):
    conn = sqlite3.connect("oasis_memory.db")
    cursor = conn.cursor()

    # Step A: Fetch ONLY the past history
    cursor.execute("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC", (request.session_id,))
    history = cursor.fetchall()
    
    # Format the history cleanly
    history_text = "\n".join([f"{row[0]}: {row[1]}" for row in history])
    if not history_text:
        history_text = "No previous history. This is the start of the conversation."

    # Step B: Save NEW user message to the database
    cursor.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
                   (request.session_id, "User", request.message))
    conn.commit()

    # Step C: Feed the AI the separated History AND the Current Message
    formatted_prompt = alpaca_prompt.format(history_text, request.message)
    inputs = tokenizer([formatted_prompt], return_tensors="pt").to("cuda")
    
    # 🛑 NEW: Tell Qwen exactly when to STOP talking (The Hard Brakes)
    stop_tokens = [tokenizer.eos_token_id]
    if "<|im_end|>" in tokenizer.vocab:
        stop_tokens.append(tokenizer.convert_tokens_to_ids("<|im_end|>"))
    elif "<|endoftext|>" in tokenizer.vocab:
        stop_tokens.append(tokenizer.convert_tokens_to_ids("<|endoftext|>"))
    
    outputs = model.generate(
        **inputs, 
        max_new_tokens=350,                 # 🚀 CHANGED: Reduced to 350 for fast, concise replies
        use_cache=True,                     
        temperature=0.35,                   
        repetition_penalty=1.15,            
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id,
        eos_token_id=stop_tokens            # 🛑 CHANGED: Applied the stop tokens here
    )
    
    raw_answer = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
    final_response = raw_answer.split("### Response:\n")[-1].strip()
    
    # Step D: Save the AI's response to the database
    cursor.execute("INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)", 
                   (request.session_id, "Oasis Node", final_response))
    conn.commit()
    conn.close()
    
    return {"reply": final_response}

# --- 5. Fetch past history for the UI ---
@app.get("/api/history/{session_id}")
async def get_history(session_id: str):
    conn = sqlite3.connect("oasis_memory.db")
    cursor = conn.cursor()
    cursor.execute("SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC", (session_id,))
    history = [{"role": row[0], "content": row[1]} for row in cursor.fetchall()]
    conn.close()
    return {"session_id": session_id, "history": history}

print("Oasis Brain is fully patched with Advanced SQLite Memory & Fast Generation!")