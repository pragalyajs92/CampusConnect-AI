🎓 CampusConnect AI — College Knowledge Assistant

CampusConnect AI is an AI-powered college knowledge assistant that enables institutions to build a centralized knowledge base from campus documents.

Faculty can upload college-related documents such as academic guidelines, department information, regulations, notices, handbooks, and other institutional resources. Students can then ask questions in natural language and receive answers grounded in the uploaded knowledge base.

The system uses Retrieval-Augmented Generation (RAG) to retrieve relevant information from uploaded documents before generating responses.

🚀 Overview

CampusConnect AI connects college documents with an AI-powered conversational interface.

                  ┌─────────────────────────┐
                  │     Next.js Frontend    │
                  │                         │
                  │   Faculty │ Student     │
                  └────────────┬────────────┘
                               │
                               ▼
                  ┌─────────────────────────┐
                  │       FastAPI API       │
                  └────────────┬────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
       ┌─────────────────┐           ┌─────────────────┐
       │ Document Upload │           │ Student Query   │
       └────────┬────────┘           └────────┬────────┘
                │                             │
                ▼                             ▼
       ┌─────────────────┐           ┌─────────────────┐
       │  PDF Processing │           │ Query Embedding │
       └────────┬────────┘           └────────┬────────┘
                │                             │
                ▼                             ▼
       ┌─────────────────┐           ┌─────────────────┐
       │ Text Chunking   │           │ ChromaDB Search │
       └────────┬────────┘           └────────┬────────┘
                │                             │
                └──────────────┬──────────────┘
                               ▼
                    ┌─────────────────────┐
                    │      ChromaDB       │
                    │   Vector Database   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      ChatGroq       │
                    │   LLM Generation    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Grounded Answer   │
                    └─────────────────────┘

✨ Key Features

📄 Faculty Document Upload

Faculty users can upload institutional documents through the application.

Supported documents can include:

Academic regulations

Department documents

Course information

College policies

Student guidelines

Notices

Handbooks

Institutional documentation

Uploaded documents are processed and added to the knowledge base.

🤖 AI-Powered Student Q&A

Students can ask questions using natural language.

Example queries:

"What are the eligibility requirements for this course?"

"When is the internal assessment?"

"What are the attendance requirements?"

"What does the college regulation say about examination eligibility?"

The system retrieves relevant information from the uploaded knowledge base and generates an answer based on that context.

🧠 Retrieval-Augmented Generation (RAG)

CampusConnect AI uses a Retrieval-Augmented Generation (RAG) architecture.

Student Question
       ↓
Question Embedding
       ↓
Vector Search
       ↓
Relevant Document Chunks
       ↓
Context + Question
       ↓
LLM
       ↓
Grounded Response

This allows the assistant to answer questions using information from the institution's uploaded documents.

🔍 RAG Pipeline

1. Document Upload

PDF
 ↓
FastAPI
 ↓
Document Processing

2. PDF Loading

The backend extracts document content using LangChain's PDF loader.

PDF Document
     ↓
PyPDFLoader
     ↓
Extracted Text

3. Document Chunking

Large documents are divided into smaller chunks.

Large Document
      ↓
Text Splitting
      ↓
Document Chunks

Chunking allows the retrieval system to identify relevant sections instead of processing the entire document for every query.

4. Generate Embeddings

Each document chunk is converted into a vector using:

sentence-transformers/all-MiniLM-L6-v2

Document Chunk
      ↓
Hugging Face Embedding Model
      ↓
Vector Representation

5. Store in ChromaDB

The generated embeddings are stored in ChromaDB.

Document Chunks
      ↓
Embeddings
      ↓
ChromaDB
      ↓
college_documents

ChromaDB enables semantic similarity search over the uploaded knowledge base.

💬 Question Answering Pipeline

When a student asks a question:

Student Question
       ↓
FastAPI /chat
       ↓
Question Embedding
       ↓
ChromaDB Similarity Search
       ↓
Relevant Document Chunks
       ↓
Prompt + Retrieved Context
       ↓
ChatGroq
       ↓
Grounded Answer
       ↓
Student

🛡️ Grounded Responses

The RAG prompt instructs the language model to answer using the retrieved context.

Retrieved Context
       +
Student Question
       ↓
      LLM
       ↓
Grounded Answer

If the required information is not available in the retrieved context, the assistant can indicate that the information is not available in the knowledge base.

🏗️ System Architecture

Frontend

Next.js
   ↓
User Interface
   ↓
Faculty / Student Interaction

Backend

FastAPI
   ↓
Document Processing
   ↓
RAG Pipeline
   ↓
API Endpoints

AI / Knowledge Layer

Hugging Face Embeddings
          ↓
       ChromaDB
          ↓
   Semantic Retrieval
          ↓
       ChatGroq
          ↓
    Grounded Answer

🛠️ Technology Stack

Component

Technology

Frontend

Next.js

Language

TypeScript

Backend

FastAPI

AI Framework

LangChain

LLM

Groq / ChatGroq

Embeddings

Hugging Face

Embedding Model

all-MiniLM-L6-v2

Vector Database

ChromaDB

Document Processing

PyPDFLoader

API Server

Uvicorn

Styling

Tailwind CSS

📁 Project Structure

CampusConnect-AI/
│
├── backend/
│   ├── main.py
│   ├── rag/
│   │   └── ...
│   ├── chroma_db/
│   ├── uploads/
│   └── venv/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── README.md

🔌 Backend API

The FastAPI backend provides endpoints for document ingestion and question answering.

Upload Document

POST /upload

Used by faculty to upload documents to the knowledge base.

Faculty
   ↓
PDF Upload
   ↓
FastAPI
   ↓
PDF Processing
   ↓
Text Chunking
   ↓
Embeddings
   ↓
ChromaDB

Ask Question

POST /chat

Used by students to ask questions about the uploaded knowledge base.

Student Question
      ↓
FastAPI
      ↓
RAG Retrieval
      ↓
ChatGroq
      ↓
AI Response

🔄 Complete Document Flow

Faculty
   │
   │ Upload PDF
   ▼
Next.js Frontend
   │
   ▼
FastAPI
   │
   ▼
PyPDFLoader
   │
   ▼
Text Extraction
   │
   ▼
Text Chunking
   │
   ▼
Hugging Face Embeddings
   │
   ▼
ChromaDB
   │
   ▼
College Knowledge Base

🔄 Complete Question Flow

Student
   │
   │ Ask Question
   ▼
Next.js
   │
   ▼
FastAPI
   │
   ▼
Question Embedding
   │
   ▼
ChromaDB
   │
   ▼
Relevant Context
   │
   ▼
Prompt Construction
   │
   ▼
ChatGroq
   │
   ▼
Grounded Answer
   │
   ▼
Student

🎯 Project Goal

CampusConnect AI demonstrates how Generative AI, semantic search, vector databases, and Retrieval-Augmented Generation can be combined to create an AI-powered institutional knowledge system.

The project connects:

College Documents
       ↓
Document Processing
       ↓
Embeddings
       ↓
Vector Database
       ↓
Semantic Retrieval
       ↓
LLM
       ↓
Grounded AI Response

🔮 Future Improvements

Persistent user authentication

Role-based access control

PostgreSQL-based user and document management

Document deletion and versioning

Source citations in AI responses

Conversation history

Streaming AI responses

Multi-document querying

Department-specific knowledge bases

Admin analytics dashboard

Cloud vector database

Production deployment

Multi-college support

👩‍💻 Author

Pragalya J S - pragalyajs92@gmail.com

B.Tech Computer Science & Engineering
SRM Institute of Science and Technology