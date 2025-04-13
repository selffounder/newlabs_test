import os
import sys
import json
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import DocArrayInMemorySearch
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA


def log(step, message):
    print(f"[{step}] {message}", flush=True)


def respond(data: dict, status: int = 0):
    print(json.dumps(data), flush=True)
    sys.exit(status)


# === Load env and validate ===
load_dotenv(".env.local")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if len(sys.argv) != 3:
    log("ERROR", "Invalid number of arguments")
    respond({"error": "Usage: python rag_runner.py <fernet_key> <query>"}, 1)

key, query = sys.argv[1], sys.argv[2]
enc_path = os.path.join(os.getcwd(), "public", "source_example1.md.enc")

log("INFO", f"Looking for file at: {enc_path}")

if not os.path.isfile(enc_path):
    log("ERROR", "Encrypted file not found")
    respond({"error": "Encrypted file not found"}, 1)

if not GROQ_API_KEY:
    log("ERROR", "Missing GROQ_API_KEY")
    respond({"error": "Missing GROQ_API_KEY"}, 1)

# === Decrypt ===
try:
    log("DECRYPT", "Starting decryption...")
    with open(enc_path, "rb") as f:
        decrypted = Fernet(key).decrypt(f.read()).decode("utf-8")
    log("DECRYPT", "Decryption successful")
except InvalidToken:
    log("DECRYPT", "Invalid Fernet key")
    respond({"error": "Invalid decryption key"}, 1)
except Exception as e:
    log("DECRYPT", f"Decryption failed: {str(e)}")
    respond({"error": "Decryption error"}, 1)

# === RAG ===
try:
    log("RAG", "Splitting and embedding...")
    chunks = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)\
        .split_documents([Document(page_content=decrypted)])
    vectorstore = DocArrayInMemorySearch.from_documents(
        chunks,
        HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    )

    log("RAG", "Initializing Groq LLM...")
    llm = ChatGroq(model="llama3-8b-8192", api_key=GROQ_API_KEY)

    chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=vectorstore.as_retriever()
    )

    log("RAG", f"Asking: {query}")
    result = chain.invoke(query)
    log("DONE", "Query answered successfully")
    respond({"answer": result["result"]})

except Exception as e:
    log("RAG", f"LangChain failed: {str(e)}")
    respond({"error": "RAG pipeline failed"}, 1)
