# DocuMind — AI-Powered Document Q&A System

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5%2B-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-Llama_3.2-black?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-orange?style=for-the-badge)](https://www.trychroma.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

A modern, full-stack **Retrieval-Augmented Generation (RAG)** application designed to intelligently analyze PDF and plain-text documents and answer natural-language questions with citations. DocuMind executes completely **locally and privately**—leveraging **Ollama** for generative responses, **Sentence Transformers** for semantic embeddings, and **ChromaDB** for vector storage and cosine similarity retrieval.

---

## 📌 Table of Contents

- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack Deep Dive](#-tech-stack-deep-dive)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. LLM Setup (Ollama)](#1-llm-setup-ollama)
  - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
  - [3. Frontend Setup (React + Vite)](#3-frontend-setup-react--vite)
- [API Reference](#-api-reference)
- [Configuration & Environment Variables](#-configuration--environment-variables)
- [Troubleshooting & FAQ](#-troubleshooting--faq)
- [Future Roadmap](#-future-roadmap)
- [License](#-license)

---

## 🌟 Key Features

- **Privacy-First & Fully Local**: No proprietary cloud APIs or data leaks. Embeddings, vector storage, and inference run entirely on your local workstation.
- **Intelligent Document Ingestion**: Upload PDF and TXT documents up to 10 MB with automated text extraction and page tracking using PyMuPDF.
- **Configurable Chunking Pipeline**: Sliding-window word chunking with configurable overlap to preserve contextual continuity across passages.
- **Dense Semantic Retrieval**: High-speed cosine similarity search powered by Sentence Transformers (`all-MiniLM-L6-v2`) and ChromaDB vector index.
- **Grounded Answer Generation**: Strictly grounded prompts sent to local `llama3.2:3b` with hallucination guardrails.
- **Source Citation & Attribution**: Answers include source passages, document filenames, and page numbers for transparent verification.
- **Sleek, Responsive Interface**: Modern dark-themed dashboard built with React and Lucide icons featuring live upload tracking, document deletion, and interactive Q&A.

---

## 🏗 System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (React + Vite)"]
        UI["Web Dashboard"]
        UploadComp["Document Upload"]
        QueryComp["Ask Questions & View Sources"]
    end

    subgraph API ["Backend Layer (FastAPI)"]
        Router["FastAPI REST Endpoints"]
        DocProc["Document Processor (PyMuPDF)"]
        Chunker["Sliding Window Chunker"]
        RAG["RAG Orchestrator"]
        DB["SQLite Metadata Store"]
    end

    subgraph AI ["AI & Vector Engines (Local)"]
        ST["Sentence Transformers (all-MiniLM-L6-v2)"]
        Chroma[("ChromaDB Vector Store")]
        OllamaEngine["Ollama Server (Llama 3.2 3B)"]
    end

    %% Ingestion Flow
    UploadComp -->|1. Upload PDF / TXT| Router
    Router -->|2. Extract text & pages| DocProc
    DocProc -->|3. Split into words + overlap| Chunker
    Chunker -->|4. Generate vector embeddings| ST
    ST -->|5. Store vectors & chunk text| Chroma
    Router -->|6. Save document record| DB

    %% Query Flow
    QueryComp -->|7. Send Question & Doc ID| Router
    Router -->|8. Formulate RAG query| RAG
    RAG -->|9. Convert query to vector| ST
    ST -->|10. Cosine similarity search (Top-K)| Chroma
    Chroma -->|11. Return retrieved passages| RAG
    RAG -->|12. Grounded prompt with context| OllamaEngine
    OllamaEngine -->|13. Stream/generate response| RAG
    RAG -->|14. Return answer + source citations| UI
```

---

## 💻 Tech Stack Deep Dive

| Component | Technology | Version | Purpose & Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `18.x` | Declarative UI for dynamic state management and responsive component rendering. |
| **Build Tool** | **Vite** | `5.x / 8.x` | Ultra-fast build times, Instant HMR (Hot Module Replacement), and optimized production assets. |
| **Icons** | **Lucide React** | Latest | Lightweight, accessible, and modern icon library for document actions and status indicators. |
| **Styling** | **Vanilla CSS3** | Standard | Custom glassmorphism, responsive grid layout, and dark-mode aesthetic with zero runtime overhead. |
| **Backend Framework** | **FastAPI** | `0.115+` | High-throughput asynchronous REST API with automatic OpenAPI / Swagger interactive documentation. |
| **ASGI Server** | **Uvicorn** | `0.30+` | Lightning-fast ASGI web server implementation for Python. |
| **Data Validation** | **Pydantic v2** | `2.x` | Strict type validation, auto-generated JSON schemas, and reliable request parsing. |
| **PDF Extraction** | **PyMuPDF (`fitz`)** | `1.24+` | Industry-standard high-performance PDF parser retaining text blocks and exact page numbers. |
| **Vector Embeddings** | **Sentence Transformers** | `3.0+` | Model `all-MiniLM-L6-v2` produces 384-dimensional dense semantic vectors optimized for semantic search. |
| **Vector Database** | **ChromaDB** | `0.5+` | Embedded, serverless vector database utilizing HNSW indexing for rapid top-$K$ cosine similarity queries. |
| **LLM Inference** | **Ollama** | Latest | Local model runtime managing model execution, quantization, and offline GPU/CPU hardware acceleration. |
| **Foundation Model** | **Llama 3.2 3B** | 3.2 | Compact, highly capable reasoning model offering fast local inference times with minimal memory footprint. |
| **Metadata Database** | **SQLite** | `3.x` | Lightweight zero-config relational store for tracking document IDs, filenames, dates, and chunk counts. |

---

## 📂 Project Directory Structure

```text
AI-Powered-Document-Q-A-System/
├── backend/
│   ├── services/
│   │   ├── __init__.py
│   │   ├── document_processor.py   # PDF (PyMuPDF) and TXT extraction & word-chunking
│   │   ├── embeddings.py           # Sentence Transformers (all-MiniLM-L6-v2) singleton
│   │   └── rag.py                  # ChromaDB vector collection & Ollama chat prompting
│   ├── storage/                    # Persistent storage for ChromaDB and SQLite DB
│   │   ├── .gitkeep
│   │   ├── chroma/                 # ChromaDB vector index files
│   │   └── documents.db            # SQLite metadata database
│   ├── uploads/                    # Local storage directory for uploaded files
│   │   └── .gitkeep
│   ├── .env.example                # Sample environment configuration template
│   ├── config.py                   # Centralized application settings & directory paths
│   ├── database.py                 # SQLite initialization, CRUD queries
│   ├── main.py                     # FastAPI application routes & middleware
│   ├── requirements.txt            # Python dependencies
│   └── schemas.py                  # Pydantic request/response data contracts
├── frontend/
│   ├── src/
│   │   ├── api.js                  # Centralized fetch API client
│   │   ├── App.jsx                 # Main application UI layout & RAG interaction
│   │   ├── main.jsx                # React DOM root entry
│   │   └── style.css               # Modern dark-mode UI stylesheet
│   ├── index.html                  # HTML template
│   ├── package.json                # Frontend dependencies and npm scripts
│   └── vite.config.js              # Vite server & proxy configuration
├── .gitignore                      # Git exclusion rules (virtualenvs, databases, cache)
└── README.md                       # Comprehensive project documentation
```

---

## ⚙️ Prerequisites

Before getting started, make sure the following are installed on your system:

1. **Python 3.10 or 3.11** — [python.org/downloads](https://www.python.org/downloads/) *(Ensure "Add Python to PATH" is checked during installation)*.
2. **Node.js LTS (v18+) & npm** — [nodejs.org](https://nodejs.org/).
3. **Ollama** — [ollama.com](https://ollama.com/).
4. **Hardware recommendation**: 8 GB RAM minimum (16 GB recommended for smooth LLM execution).

---

## 🚀 Quick Start Guide

### 1. LLM Setup (Ollama)

Start Ollama and pull the recommended lightweight model:

```bash
# Pull Llama 3.2 3B model
ollama pull llama3.2:3b

# Verify installed models
ollama list
```

Make sure the Ollama service is active at `http://localhost:11434` (Ollama runs automatically in the background upon installation).

---

### 2. Backend Setup (FastAPI)

1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```
   > *Note on Windows PowerShell: If script execution is restricted, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`.*

3. Install dependencies:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration:
   ```bash
   # Windows
   copy .env.example .env

   # Linux / macOS
   cp .env.example .env
   ```

5. Launch the FastAPI server:
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

The backend is now live:
- **API Root**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Swagger Interactive Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

*(Note: On initial startup, Sentence Transformers will automatically download `all-MiniLM-L6-v2` ~90MB).*

---

### 3. Frontend Setup (React + Vite)

1. Open a separate terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. Install npm packages:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   👉 **`http://127.0.0.1:5173`**

---

## 📡 API Reference

Explore and test the API directly using Swagger UI at `http://127.0.0.1:8000/docs`.

### 1. Health Status
- **Method**: `GET`
- **Route**: `/api/health`
- **Response**: `{"status": "ok"}`

### 2. List Documents
- **Method**: `GET`
- **Route**: `/api/documents`
- **Response**:
  ```json
  {
    "documents": [
      {
        "id": "e45a2781-b51e-4509-90bc-2a54fb23f99a",
        "original_name": "annual_report.pdf",
        "uploaded_at": "2026-11-01T15:20:00+00:00",
        "chunk_count": 28
      }
    ]
  }
  ```

### 3. Upload & Index Document
- **Method**: `POST`
- **Route**: `/api/documents`
- **Content-Type**: `multipart/form-data`
- **Field**: `file` (PDF or TXT, max 10 MB)
- **Example cURL**:
  ```bash
  curl -X POST "http://127.0.0.1:8000/api/documents" -F "file=@document.pdf"
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "e45a2781-b51e-4509-90bc-2a54fb23f99a",
    "filename": "document.pdf",
    "uploaded_at": "2026-11-01T15:20:00+00:00",
    "chunk_count": 28,
    "message": "Document uploaded and indexed successfully."
  }
  ```

### 4. Ask Question (RAG Retrieval & Generation)
- **Method**: `POST`
- **Route**: `/api/ask`
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "document_id": "e45a2781-b51e-4509-90bc-2a54fb23f99a",
    "question": "What are the primary findings in this report?"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "answer": "According to the report, the primary findings indicate a 24% revenue increase...",
    "sources": [
      {
        "document_id": "e45a2781-b51e-4509-90bc-2a54fb23f99a",
        "filename": "document.pdf",
        "page": 3,
        "text": "In Q4, revenue grew by 24% driven by...",
        "distance": 0.284
      }
    ]
  }
  ```

### 5. Delete Document
- **Method**: `DELETE`
- **Route**: `/api/documents/{document_id}`
- **Response**:
  ```json
  {
    "message": "Document deleted successfully.",
    "id": "e45a2781-b51e-4509-90bc-2a54fb23f99a"
  }
  ```

---

## 🛠 Configuration & Environment Variables

All backend settings are loaded from `backend/.env`.

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Endpoint for the local Ollama daemon. |
| `OLLAMA_MODEL` | `llama3.2:3b` | Target Ollama model used for text generation. |
| `EMBEDDING_MODEL` | `sentence-transformers/all-MiniLM-L6-v2` | Hugging Face embedding model used for vectorization. |
| `MAX_FILE_SIZE_MB` | `10` | Maximum allowable document upload size in megabytes. |
| `CHUNK_WORDS` | `180` | Number of words per text passage chunk. |
| `CHUNK_OVERLAP_WORDS` | `35` | Overlapping words between adjacent chunks for contextual continuity. |
| `TOP_K` | `4` | Number of most relevant semantic chunks retrieved per question. |

---

## 🔍 Troubleshooting & FAQ

<details>
<summary><b>1. "Cannot connect to Ollama" error</b></summary>

Ensure the Ollama service is running. Open PowerShell or a terminal and run `ollama list`. If it is not running, launch the Ollama desktop app or run `ollama serve`.
</details>

<details>
<summary><b>2. PowerShell says script execution is disabled</b></summary>

Run this command in your PowerShell window:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then re-run the virtual environment activation script (`.\.venv\Scripts\Activate.ps1`).
</details>

<details>
<summary><b>3. Scanned PDF produces "No text was extracted"</b></summary>

This application parses digital, selectable text from PDF documents using PyMuPDF. Pure image-only or scanned PDFs require an Optical Character Recognition (OCR) engine (such as Tesseract), which can be integrated as an enhancement.
</details>

<details>
<summary><b>4. AI response takes a long time or times out</b></summary>

On the very first request, the local LLM loads weights into RAM/VRAM. Subsequent questions are significantly faster. If memory is constrained, ensure background applications are closed or test a smaller quantized model.
</details>

---

## 🗺 Future Roadmap

- [ ] **OCR Ingestion**: Support scanned PDFs via Tesseract OCR.
- [ ] **Extended Format Support**: Microsoft Word (`.docx`), Excel (`.xlsx`), and Markdown (`.md`).
- [ ] **Multi-Document Synthesis**: Cross-document semantic querying across entire knowledge vaults.
- [ ] **Streaming Responses**: Real-time server-sent events (SSE) token streaming to the frontend.
- [ ] **Multi-Turn Chat History**: Retain contextual session memory across consecutive questions.
- [ ] **Dockerized Deployment**: Multi-stage `docker-compose.yml` orchestrating FastAPI, Vite, and Ollama.

---

## 📄 License

This project is open-source and licensed under the [MIT License](LICENSE).

---

## 👤 Author

Developed by **[Jaffar Saadiq](https://github.com/jaffarsaadiq-dev)**.
Feel free to open an issue or pull request if you'd like to contribute!
