from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma


# Create embedding model
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


# Create/load ChromaDB
vector_store = Chroma(
    collection_name="college_documents",
    embedding_function=embeddings,
    persist_directory="./chroma_db"
)


def add_documents(chunks):
    vector_store.add_documents(chunks)

    return len(chunks)