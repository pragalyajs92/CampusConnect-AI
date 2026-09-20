import json
import os
from datetime import datetime

DOCUMENTS_FOLDER = "documents"
DOCUMENTS_FILE = os.path.join(
    DOCUMENTS_FOLDER,
    "documents.json"
)


def initialize_documents_file():
    """
    Create the documents folder and JSON file
    if they do not already exist.
    """

    os.makedirs(DOCUMENTS_FOLDER, exist_ok=True)

    if not os.path.exists(DOCUMENTS_FILE):
        with open(
            DOCUMENTS_FILE,
            "w",
            encoding="utf-8"
        ) as file:
            json.dump([], file, indent=4)


def get_documents():
    """
    Return all stored document metadata.
    """

    initialize_documents_file()

    with open(
        DOCUMENTS_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)


def save_document(
    filename,
    pages,
    chunks,
    characters
):
    """
    Save metadata about an uploaded document.
    """

    initialize_documents_file()

    documents = get_documents()

    document = {
        "id": str(len(documents) + 1),
        "filename": filename,
        "pages": pages,
        "chunks": chunks,
        "characters_extracted": characters,
        "uploaded_at": datetime.now().isoformat(),
        "category": "official"
    }

    documents.append(document)

    with open(
        DOCUMENTS_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            documents,
            file,
            indent=4
        )

    return document