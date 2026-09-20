import os

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from rag.vector_store import vector_store


load_dotenv()


# =====================================================
# LLM
# =====================================================

llm = ChatGroq(
    model="openai/gpt-oss-20b",
    temperature=0
)


# =====================================================
# PROMPT
# =====================================================

prompt = ChatPromptTemplate.from_template("""
You are CampusConnect AI, a college knowledge assistant.

Answer the user's question using ONLY the information
contained in the provided documents.

Follow these rules:

1. Do not use outside knowledge.
2. Do not invent information.
3. Do not make assumptions or fill in missing information.
4. Preserve factual details from the documents accurately,
   especially:
   - numbers
   - percentages
   - dates
   - ranges
   - codes
   - names
   - rules
   - conditions
   - eligibility requirements
5. If the document contains a table or structured information,
   preserve the relationships between the values accurately.
6. Do not change numerical ranges or values.
7. Do not create a conclusion that is not supported by the
   documents.
8. If multiple relevant pieces of information are found,
   combine them into one clear answer.
9. Explain the answer naturally instead of simply copying
   isolated sentences from the document.
10. Keep the response concise but sufficiently descriptive
    to answer the question.
11. Use bullet points or tables when they make the information
    easier to understand.
12. If the documents do not contain enough information, say:

"I couldn't find enough information about this in the
uploaded documents."

13. Never pretend information is present when it is not.
14. Do not mention retrieval, vector database, chunks,
    embeddings, or internal system details unless the user
    asks.
15. Answer conversationally and professionally.

--------------------------------------------------
DOCUMENTS
--------------------------------------------------

{context}

--------------------------------------------------
USER QUESTION
--------------------------------------------------

{question}

--------------------------------------------------
ANSWER
--------------------------------------------------
""")


# =====================================================
# RAG CHAIN
# =====================================================

rag_chain = (
    prompt
    | llm
    | StrOutputParser()
)


# =====================================================
# ASK QUESTION
# =====================================================

def ask_question(
    question: str,
    custom_vector_store=None
):
    """
    Ask a question using either:

    1. Official college vector store
       OR
    2. A temporary student vector store
    """

    # -------------------------------------------------
    # Choose which vector store to search
    # -------------------------------------------------

    if custom_vector_store is not None:

        # Student's temporary PDF
        search_store = custom_vector_store

    else:

        # Official faculty-uploaded documents
        search_store = vector_store


    # -------------------------------------------------
    # Retrieve relevant documents
    # -------------------------------------------------

    documents = search_store.similarity_search(
        question,
        k=4
    )


    # -------------------------------------------------
    # No relevant documents
    # -------------------------------------------------

    if not documents:

        return {
            "answer": (
                "I couldn't find enough information "
                "about this in the uploaded documents."
            ),
            "sources": []
        }


    # -------------------------------------------------
    # Build context
    # -------------------------------------------------

    context_parts = []


    for document in documents:

        source = document.metadata.get(
            "source",
            "Unknown"
        )

        page = document.metadata.get(
            "page"
        )


        source_name = (
            os.path.basename(source)
            if source
            else "Unknown"
        )


        page_number = (
            page + 1
            if page is not None
            else "Unknown"
        )


        context_parts.append(
            f"""
SOURCE: {source_name}
PAGE: {page_number}

{document.page_content}
"""
        )


    context = (
        "\n\n--------------------\n\n"
        .join(context_parts)
    )


    # -------------------------------------------------
    # Generate answer
    # -------------------------------------------------

    answer = rag_chain.invoke({
        "context": context,
        "question": question
    })


    # -------------------------------------------------
    # Build sources
    # -------------------------------------------------

    sources = []

    seen = set()


    for document in documents:

        source = document.metadata.get(
            "source"
        )

        page = document.metadata.get(
            "page"
        )


        source_name = (
            os.path.basename(source)
            if source
            else "Unknown"
        )


        key = (
            source_name,
            page
        )


        if key not in seen:

            seen.add(key)

            sources.append({
                "source": source_name,
                "page": page
            })


    return {
        "answer": answer.strip(),
        "sources": sources
    }