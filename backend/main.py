import os
import shutil
import tempfile

from dotenv import load_dotenv

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Depends
)

from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

from rag.chat_service import ask_question
from rag.vector_store import add_documents
from rag.text_processor import split_documents

from document_store import (
    save_document,
    get_documents
)

from auth.auth_service import (
    create_user,
    login_user
)

from auth.jwt_service import (
    get_current_user
)

from database import (
    initialize_database,
    get_connection
)


# =====================================================
# LOAD ENVIRONMENT VARIABLES
# =====================================================

load_dotenv()


# =====================================================
# DEPLOYMENT CONFIGURATION
# =====================================================

# Local development:
# http://127.0.0.1:8000
#
# Production:
# Set BACKEND_URL in Render environment variables.
#
# Example:
# BACKEND_URL=https://your-backend.onrender.com

BACKEND_URL = os.getenv(
    "BACKEND_URL",
    "http://127.0.0.1:8000"
).rstrip("/")


# Frontend URL used for CORS.
#
# Local development uses localhost/127.0.0.1.
#
# Production:
# Set FRONTEND_URL in Render.
#
# Example:
# FRONTEND_URL=https://your-frontend.vercel.app

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    ""
).rstrip("/")


# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(
    title="CampusConnect AI",
    description="AI-powered College Knowledge Assistant",
    version="1.0.0"
)


# =====================================================
# DATABASE
# =====================================================

initialize_database()


# =====================================================
# TEMPORARY STUDENT DOCUMENT STORAGE
# =====================================================

student_documents = {}


# =====================================================
# STUDENT EMBEDDINGS
# =====================================================

student_embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# =====================================================
# CORS
# =====================================================

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

# Add production frontend URL when configured.
if FRONTEND_URL:
    allowed_origins.append(FRONTEND_URL)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================================================
# REQUEST MODELS
# =====================================================

class QuestionRequest(BaseModel):
    question: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str


class LoginRequest(BaseModel):
    email: str
    password: str


# =====================================================
# SAVE CHAT HISTORY
# =====================================================

def save_chat_history(
    user_id: int,
    question: str,
    answer: str
):
    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                INSERT INTO chat_history
                (
                    user_id,
                    question,
                    answer
                )
                VALUES (%s, %s, %s)
                """,
                (
                    user_id,
                    question,
                    answer
                )
            )

        connection.commit()

    finally:
        connection.close()


# =====================================================
# NORMAL CHAT
# =====================================================

@app.post("/chat")
def chat(
    request: QuestionRequest,
    current_user: dict = Depends(
        get_current_user
    )
):

    user_id = current_user["user_id"]

    result = ask_question(
        request.question
    )

    save_chat_history(
        user_id=user_id,
        question=request.question,
        answer=result["answer"]
    )

    return result


# =====================================================
# CHAT HISTORY
# =====================================================

@app.get("/chat-history")
def get_chat_history(
    current_user: dict = Depends(
        get_current_user
    )
):

    user_id = current_user["user_id"]

    connection = get_connection()

    try:

        with connection.cursor() as cursor:

            cursor.execute(
                """
                SELECT
                    id,
                    question,
                    answer,
                    created_at
                FROM chat_history
                WHERE user_id = %s
                ORDER BY created_at DESC
                """,
                (user_id,)
            )

            history = cursor.fetchall()

            return {
                "history": history
            }

    finally:
        connection.close()


# =====================================================
# HOME
# =====================================================

@app.get("/")
def home():

    return {
        "message": "Welcome to CampusConnect AI"
    }


# =====================================================
# HEALTH CHECK
# =====================================================

@app.get("/health")
def health_check():

    return {
        "status": "running"
    }


# =====================================================
# GET OFFICIAL DOCUMENTS
# =====================================================

@app.get("/documents")
def documents():

    # This returns ONLY official documents
    # saved through the faculty /upload endpoint.
    #
    # Student temporary documents are NOT stored here.

    documents_list = get_documents()

    # Add the backend file URL dynamically.
    #
    # Local:
    # http://127.0.0.1:8000/files/filename.pdf
    #
    # Production:
    # https://your-backend.onrender.com/files/filename.pdf

    for document in documents_list:

        filename = document.get(
            "filename"
        )

        if filename:
            document["file_url"] = (
                f"{BACKEND_URL}/files/"
                f"{filename}"
            )

    return documents_list


# =====================================================
# VIEW OFFICIAL PDF
# =====================================================

@app.get("/files/{filename}")
def view_document(
    filename: str,
    current_user: dict = Depends(
        get_current_user
    )
):

    # Only students and faculty can view
    # official college documents.

    if current_user["role"] not in [
        "student",
        "faculty"
    ]:

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized "
                "to view documents."
            )
        )

    # Prevent directory traversal.
    safe_filename = os.path.basename(
        filename
    )

    file_path = os.path.join(
        "uploads",
        safe_filename
    )

    if not os.path.exists(
        file_path
    ):

        raise HTTPException(
            status_code=404,
            detail="Document not found."
        )

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=safe_filename
    )


# =====================================================
# SIGNUP
# =====================================================

@app.post("/signup")
def signup(
    request: SignupRequest
):

    # Only these two roles are supported.

    if request.role not in [
        "student",
        "faculty"
    ]:

        raise HTTPException(
            status_code=400,
            detail=(
                "Role must be "
                "student or faculty."
            )
        )

    result = create_user(
        name=request.name,
        email=request.email,
        password=request.password,
        role=request.role
    )

    if not result["success"]:

        raise HTTPException(
            status_code=400,
            detail=result["message"]
        )

    return result


# =====================================================
# LOGIN
# =====================================================

@app.post("/login")
def login(
    request: LoginRequest
):

    result = login_user(
        email=request.email,
        password=request.password
    )

    if not result["success"]:

        raise HTTPException(
            status_code=401,
            detail=result["message"]
        )

    return result


# =====================================================
# OFFICIAL PDF UPLOAD
# =====================================================

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(
        get_current_user
    )
):

    # Only faculty can upload official
    # college documents.

    if current_user["role"] != "faculty":

        raise HTTPException(
            status_code=403,
            detail=(
                "Only faculty members "
                "can upload official documents."
            )
        )

    # =================================================
    # CHECK FILE TYPE
    # =================================================

    if not file.filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF files are "
                "currently supported."
            )
        )

    # =================================================
    # CREATE UPLOAD FOLDER
    # =================================================

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    # =================================================
    # SAFE FILE NAME
    # =================================================

    safe_filename = os.path.basename(
        file.filename
    )

    # =================================================
    # FILE PATH
    # =================================================

    file_path = os.path.join(
        "uploads",
        safe_filename
    )

    # =================================================
    # SAVE PDF
    # =================================================

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    # =================================================
    # LOAD PDF
    # =================================================

    loader = PyPDFLoader(
        file_path
    )

    documents = loader.load()

    # =================================================
    # SPLIT DOCUMENT
    # =================================================

    chunks = split_documents(
        documents
    )

    # =================================================
    # STORE IN OFFICIAL CHROMADB
    # =================================================

    stored_chunks = add_documents(
        chunks
    )

    # =================================================
    # PAGE COUNT
    # =================================================

    page_count = len(
        documents
    )

    # =================================================
    # EXTRACT FULL TEXT
    # =================================================

    full_text = "\n".join(
        document.page_content
        for document in documents
    )

    # =================================================
    # SAVE OFFICIAL DOCUMENT METADATA
    # =================================================

    document = save_document(
        filename=safe_filename,
        pages=page_count,
        chunks=len(chunks),
        characters=len(full_text)
    )

    # =================================================
    # RESPONSE
    # =================================================

    return {

        "message":
            "PDF uploaded and added "
            "to knowledge base",

        "filename":
            safe_filename,

        "pages":
            page_count,

        "chunks_created":
            len(chunks),

        "chunks_stored":
            stored_chunks,

        "characters_extracted":
            len(full_text),

        "document":
            document
    }


# =====================================================
# STUDENT TEMPORARY PDF UPLOAD
# =====================================================

@app.post("/student/upload")
async def upload_student_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(
        get_current_user
    )
):

    # =================================================
    # ROLE CHECK
    # =================================================

    if current_user["role"] != "student":

        raise HTTPException(
            status_code=403,
            detail=(
                "Only students can use "
                "temporary document upload."
            )
        )

    user_id = current_user["user_id"]

    # =================================================
    # CHECK FILE TYPE
    # =================================================

    if not file.filename.lower().endswith(
        ".pdf"
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Only PDF files are "
                "currently supported."
            )
        )

    # =================================================
    # READ PDF INTO MEMORY
    # =================================================

    file_bytes = await file.read()

    temp_path = None

    try:

        # =================================================
        # CREATE TEMPORARY PDF
        # =================================================

        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False
        ) as temp_file:

            temp_file.write(
                file_bytes
            )

            temp_path = temp_file.name

        # =================================================
        # LOAD PDF
        # =================================================

        loader = PyPDFLoader(
            temp_path
        )

        documents = loader.load()

        # =================================================
        # SPLIT DOCUMENT
        # =================================================

        chunks = split_documents(
            documents
        )

        # =================================================
        # CREATE TEMPORARY VECTOR STORE
        # =================================================

        student_vector_store = Chroma(
            collection_name=(
                f"student_{user_id}"
            ),
            embedding_function=(
                student_embeddings
            )
        )

        # =================================================
        # ADD CHUNKS
        # =================================================

        student_vector_store.add_documents(
            chunks
        )

        # =================================================
        # STORE VECTOR STORE IN MEMORY
        # =================================================

        student_documents[user_id] = {
            "filename": file.filename,
            "vector_store": student_vector_store
        }

        # =================================================
        # RESPONSE
        # =================================================

        return {

            "message":
                "PDF processed successfully. "
                "You can now ask questions "
                "about it.",

            "filename":
                file.filename,

            "pages":
                len(documents),

            "chunks":
                len(chunks)
        }

    finally:

        # =================================================
        # DELETE TEMPORARY PHYSICAL PDF
        # =================================================

        if (
            temp_path
            and os.path.exists(
                temp_path
            )
        ):

            os.remove(
                temp_path
            )


# =====================================================
# STUDENT CHAT
# =====================================================

@app.post("/student/chat")
def student_chat(
    request: QuestionRequest,
    current_user: dict = Depends(
        get_current_user
    )
):

    # =================================================
    # ROLE CHECK
    # =================================================

    if current_user["role"] != "student":

        raise HTTPException(
            status_code=403,
            detail=(
                "Only students can use "
                "student document chat."
            )
        )

    user_id = current_user["user_id"]

    # =================================================
    # FIND STUDENT DOCUMENT
    # =================================================

    student_document = (
        student_documents.get(
            user_id
        )
    )

    # =================================================
    # NO DOCUMENT
    # =================================================

    if not student_document:

        raise HTTPException(
            status_code=404,
            detail=(
                "No student document is "
                "currently active. "
                "Please upload a PDF first."
            )
        )

    # =================================================
    # ASK QUESTION USING STUDENT VECTOR STORE
    # =================================================

    result = ask_question(
        question=request.question,
        custom_vector_store=(
            student_document[
                "vector_store"
            ]
        )
    )

    # =================================================
    # SAVE CHAT HISTORY
    # =================================================

    save_chat_history(
        user_id=user_id,
        question=request.question,
        answer=result["answer"]
    )

    # =================================================
    # RETURN RESPONSE
    # =================================================

    return result