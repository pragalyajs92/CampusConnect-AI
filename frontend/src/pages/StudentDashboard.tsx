import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedInUser } from "../auth";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  MessageSquare,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Send,
  Paperclip,
  UserRound,
  X,
  LoaderCircle,
  Eye,
} from "lucide-react";

import "./Dashboard.css";

// =====================================================
// TYPES
// =====================================================

type Section =
  | "ask"
  | "knowledge"
  | "settings";

interface Message {
  role: "user" | "assistant";
  content: string;

  sources?: {
    source: string;
    page: number | null;
  }[];
}

interface CollegeDocument {
  id: number;
  filename: string;
  description?: string;
  uploaded_by?: string;
  pages?: number;
  file_url?: string;
}

interface ChatHistoryItem {
  id: number;
  question: string;
  answer: string;
  created_at: string;
}

// =====================================================
// STUDENT DASHBOARD
// =====================================================

export default function StudentDashboard() {
  const navigate = useNavigate();

  // =====================================================
  // AUTHENTICATION PROTECTION
  // =====================================================

  useEffect(() => {
    const user = getLoggedInUser();

    if (!user) {
      navigate("/", { replace: true });
      return;
    }

    if (user.role !== "student") {
      navigate("/faculty", { replace: true });
    }
  }, [navigate]);

  // =====================================================
  // ACTIVE SECTION
  // =====================================================

  const [activeSection, setActiveSection] =
    useState<Section>("ask");

  // =====================================================
  // CHAT
  // =====================================================

  const [question, setQuestion] = useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [loading, setLoading] =
    useState(false);

  // =====================================================
  // STUDENT DOCUMENT
  // =====================================================

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [studentDocumentActive, setStudentDocumentActive] =
    useState(false);

  const [studentDocumentName, setStudentDocumentName] =
    useState("");

  const [uploadingDocument, setUploadingDocument] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // =====================================================
  // COLLEGE DOCUMENTS
  // =====================================================

  const [collegeDocuments, setCollegeDocuments] =
    useState<CollegeDocument[]>([]);

  const [documentsLoading, setDocumentsLoading] =
    useState(false);

  // =====================================================
  // CHAT HISTORY
  // =====================================================

  const [chatHistory, setChatHistory] =
    useState<ChatHistoryItem[]>([]);

  const [chatHistoryLoading, setChatHistoryLoading] =
    useState(false);

  const [showChatHistory, setShowChatHistory] =
    useState(false);

  // =====================================================
  // STUDENT PROFILE
  // =====================================================

  const [studentName, setStudentName] =
    useState("Student");

  const [studentEmail, setStudentEmail] =
    useState("student@college.edu");

  const [studentDepartment, setStudentDepartment] =
    useState("Computer Science & Engineering");

  const [studentYear, setStudentYear] =
    useState("3rd Year");

  const [studentSection, setStudentSection] =
    useState("A");

  const [studentRollNumber, setStudentRollNumber] =
    useState("CS2026001");

  // =====================================================
  // SAVED PROFILE VALUES
  // =====================================================

  const [savedStudentName, setSavedStudentName] =
    useState("Student");

  const [savedStudentEmail, setSavedStudentEmail] =
    useState("student@college.edu");

  const [savedStudentDepartment, setSavedStudentDepartment] =
    useState("Computer Science & Engineering");

  const [savedStudentYear, setSavedStudentYear] =
    useState("3rd Year");

  const [savedStudentSection, setSavedStudentSection] =
    useState("A");

  const [savedStudentRollNumber, setSavedStudentRollNumber] =
    useState("CS2026001");

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  // =====================================================
  // LOAD LOGGED-IN STUDENT
  // =====================================================

  useEffect(() => {
    const user = getLoggedInUser();

    if (!user || user.role !== "student") {
      return;
    }

    setStudentName(user.name);
    setStudentEmail(user.email);

    setSavedStudentName(user.name);
    setSavedStudentEmail(user.email);
  }, []);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (section: Section) => {
    setActiveSection(section);
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "campusconnect_user"
    );

    localStorage.removeItem(
      "campusconnect_token"
    );

    navigate("/", { replace: true });
  };

  // =====================================================
  // LOAD OFFICIAL COLLEGE DOCUMENTS
  // =====================================================

  useEffect(() => {
    const loadCollegeDocuments = async () => {
      const user = getLoggedInUser();

      if (!user || user.role !== "student") {
        return;
      }

      setDocumentsLoading(true);

      try {
        const token = localStorage.getItem(
          "campusconnect_token"
        );

        if (!token) {
          throw new Error(
            "Your login session has expired. Please log in again."
          );
        }

        const response = await fetch(
          "http://127.0.0.1:8000/documents",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Could not load documents."
          );
        }

        const data =
          await response.json();

        setCollegeDocuments(data);

      } catch (error) {
        console.log(
          "College documents are not available yet.",
          error
        );

        setCollegeDocuments([]);

      } finally {
        setDocumentsLoading(false);
      }
    };

    loadCollegeDocuments();
  }, []);

  // =====================================================
  // LOAD CHAT HISTORY
  // =====================================================

  const loadChatHistory = async () => {
    const user = getLoggedInUser();
    const token = localStorage.getItem(
      "campusconnect_token"
    );

    if (!user || user.role !== "student") {
      return;
    }

    if (!token) {
      console.error(
        "Authentication token is missing."
      );
      return;
    }

    setChatHistoryLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/chat-history",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Could not load chat history."
        );
      }

      const data = await response.json();

      setChatHistory(data.history || []);
    } catch (error) {
      console.error(
        "Chat history loading error:",
        error
      );
      setChatHistory([]);
    } finally {
      setChatHistoryLoading(false);
    }
  };

  // =====================================================
  // FILE SELECTION
  // =====================================================

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      alert(
        "Please select a PDF document."
      );

      return;
    }

    setSelectedFile(file);
  };

  // =====================================================
  // UPLOAD STUDENT PDF
  // =====================================================

  const uploadStudentDocument = async (): Promise<boolean> => {
    if (!selectedFile) {
      alert(
        "Please choose a PDF document first."
      );

      return false;
    }

    const user =
      getLoggedInUser();

    const token =
      localStorage.getItem(
        "campusconnect_token"
      );

    if (!user || user.role !== "student") {
      alert(
        "Please log in again."
      );

      return false;
    }

    if (!token) {
      alert(
        "Your login session has expired. Please log in again."
      );

      return false;
    }

    setUploadingDocument(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          "http://127.0.0.1:8000/student/upload",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
          "Could not process the PDF."
        );
      }

      const data =
        await response.json();

      setStudentDocumentActive(true);

      setStudentDocumentName(
        data.filename
      );

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return true;

    } catch (error) {
      console.error(
        "Student PDF upload error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Could not process the PDF."
      );

      return false;

    } finally {
      setUploadingDocument(false);
    }
  };

  // =====================================================
  // STOP USING STUDENT DOCUMENT
  // =====================================================

  const stopUsingStudentDocument = () => {
    setStudentDocumentActive(false);
    setStudentDocumentName("");
  };

  // =====================================================
  // ASK AI
  // =====================================================

  const sendMessage = async (
    text?: string
  ) => {
    const currentQuestion =
      text?.trim() ||
      question.trim();

    if (
      !currentQuestion ||
      loading
    ) {
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: currentQuestion,
    };

    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setQuestion("");
    setLoading(true);

    try {
      const user =
        getLoggedInUser();

      const token =
        localStorage.getItem(
          "campusconnect_token"
        );

      if (!user || !token) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      // =================================================
      // CHOOSE WHICH KNOWLEDGE SOURCE TO USE
      // =================================================

      let useStudentDocument =
        studentDocumentActive;

      // If a PDF has been selected but not yet uploaded,
      // upload it before asking the question.
      if (
        selectedFile &&
        !studentDocumentActive
      ) {
        const uploaded =
          await uploadStudentDocument();

        if (!uploaded) {
          setLoading(false);
          return;
        }

        useStudentDocument = true;
      }

      // =================================================
      // CHOOSE ENDPOINT
      // =================================================

      const endpoint =
        useStudentDocument
          ? "http://127.0.0.1:8000/student/chat"
          : "http://127.0.0.1:8000/chat";

      // =================================================
      // SEND QUESTION
      // =================================================

      const response =
        await fetch(
          endpoint,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              question:
                currentQuestion,
            }),
          }
        );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
          "Failed to get response."
        );
      }

      const data =
        await response.json();

      // =================================================
      // AI RESPONSE
      // =================================================

      const assistantMessage: Message = {
        role: "assistant",
        content:
          data.answer ||
          "I couldn't generate an answer.",
        sources:
          data.sources || [],
      };

      setMessages(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );

      // Refresh PostgreSQL-backed history.
      loadChatHistory();

    } catch (error) {
      console.error(error);

      setMessages(
        (previous) => [
          ...previous,

          {
            role: "assistant",

            content:
              "Sorry, I couldn't connect to CampusConnect AI. Please make sure the FastAPI backend is running.",
          },
        ]
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // ENTER KEY
  // =====================================================

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();

      sendMessage();
    }
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const saveProfile = () => {
    setSavedStudentName(
      studentName
    );

    setSavedStudentEmail(
      studentEmail
    );

    setSavedStudentDepartment(
      studentDepartment
    );

    setSavedStudentYear(
      studentYear
    );

    setSavedStudentSection(
      studentSection
    );

    setSavedStudentRollNumber(
      studentRollNumber
    );

    setIsEditingProfile(false);

    alert(
      "Profile updated successfully."
    );
  };

  // =====================================================
  // CANCEL PROFILE EDIT
  // =====================================================

  const cancelProfileEdit = () => {
    setStudentName(
      savedStudentName
    );

    setStudentEmail(
      savedStudentEmail
    );

    setStudentDepartment(
      savedStudentDepartment
    );

    setStudentYear(
      savedStudentYear
    );

    setStudentSection(
      savedStudentSection
    );

    setStudentRollNumber(
      savedStudentRollNumber
    );

    setIsEditingProfile(false);
  };

  // =====================================================
  // VIEW DOCUMENT
  // =====================================================

  const handleViewDocument = async (
    document: CollegeDocument
  ) => {
    if (!document.file_url) {
      alert(
        "This document does not have a viewing link."
      );

      return;
    }

    const token =
      localStorage.getItem(
        "campusconnect_token"
      );

    if (!token) {
      alert(
        "Your login session has expired. Please log in again."
      );

      navigate("/", {
        replace: true,
      });

      return;
    }

    try {
      const response =
        await fetch(
          document.file_url,
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        const errorData =
          await response
            .json()
            .catch(() => null);

        throw new Error(
          errorData?.detail ||
          "Could not open the document."
        );
      }

      const blob =
        await response.blob();

      const fileUrl =
        URL.createObjectURL(blob);

      window.open(
        fileUrl,
        "_blank"
      );

      setTimeout(() => {
        URL.revokeObjectURL(
          fileUrl
        );
      }, 60000);

    } catch (error) {
      console.error(
        "Document viewing error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Could not open this document."
      );
    }
  };

  // =====================================================
  // CONTENT
  // =====================================================

  const renderContent = () => {

    // ===================================================
    // ASK
    // ===================================================

    if (activeSection === "ask") {
      return (
        <section className="chat-area">

          {/* ===========================================
              CHAT HISTORY TOGGLE
          =========================================== */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "14px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                const nextValue = !showChatHistory;
                setShowChatHistory(nextValue);

                if (nextValue) {
                  loadChatHistory();
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "9px 15px",
                borderRadius: "10px",
                border: "1px solid #dbe4ef",
                background: "#ffffff",
                color: "#12366b",
                fontFamily: "inherit",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <MessageSquare size={16} />
              {showChatHistory
                ? "Hide Chat History"
                : "Chat History"}
            </button>
          </div>

          {/* ===========================================
              CHAT HISTORY
          =========================================== */}

          {showChatHistory && (
            <div
              style={{
                marginBottom: "18px",
                padding: "18px",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                background: "#ffffff",
                boxShadow:
                  "0 6px 20px rgba(15, 23, 42, 0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#12366b",
                    }}
                  >
                    Previous Conversations
                  </h3>

                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                      fontSize: "13px",
                    }}
                  >
                    Your saved questions and AI responses.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadChatHistory}
                  disabled={chatHistoryLoading}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#1d5a91",
                    fontWeight: 700,
                    cursor: chatHistoryLoading
                      ? "default"
                      : "pointer",
                  }}
                >
                  {chatHistoryLoading
                    ? "Loading..."
                    : "Refresh"}
                </button>
              </div>

              {chatHistoryLoading ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#64748b",
                    padding: "12px 0",
                  }}
                >
                  <LoaderCircle
                    size={18}
                    className="loading-icon"
                  />
                  Loading chat history...
                </div>
              ) : chatHistory.length === 0 ? (
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "12px",
                    background: "#f8fafc",
                    color: "#64748b",
                    textAlign: "center",
                  }}
                >
                  No previous conversations yet.
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    maxHeight: "360px",
                    overflowY: "auto",
                  }}
                >
                  {chatHistory.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        background: "#f8fafc",
                        border: "1px solid #e8eef5",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "12px",
                          marginBottom: "8px",
                        }}
                      >
                        <strong
                          style={{
                            color: "#12366b",
                            fontSize: "14px",
                          }}
                        >
                          {item.question}
                        </strong>

                        <span
                          style={{
                            flexShrink: 0,
                            color: "#94a3b8",
                            fontSize: "11px",
                          }}
                        >
                          {new Date(
                            item.created_at
                          ).toLocaleString()}
                        </span>
                      </div>

                      <div
                        style={{
                          color: "#334155",
                          fontSize: "14px",
                          lineHeight: 1.6,
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                        >
                          {item.answer}
                        </ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===========================================
              ACTIVE STUDENT DOCUMENT
          =========================================== */}

          {studentDocumentActive && (
            <div className="active-document-banner">

              <div className="active-document-info">

                <div className="active-document-icon">
                  <FileText size={18} />
                </div>

                <div>
                  <strong>
                    Using your uploaded document
                  </strong>

                  <span>
                    {studentDocumentName}
                  </span>
                </div>

              </div>

              <button
                type="button"
                onClick={
                  stopUsingStudentDocument
                }
              >
                <X size={16} />

                Stop using document
              </button>

            </div>
          )}

          {/* ===========================================
              WELCOME
          =========================================== */}

          {messages.length === 0 ? (

            <div className="welcome-content">

              <div className="welcome-icon">
                🎓
              </div>

              <h1>
                How can I help you?
              </h1>

              <p>
                {studentDocumentActive
                  ? "Ask questions about your uploaded document."
                  : "Ask me anything about your college, campus, events, facilities, placements, or student life."}
              </p>

              {/* =======================================
                  SUGGESTIONS
              ======================================= */}

              <div className="suggestions">

                <button
                  onClick={() =>
                    sendMessage(
                      "What are the attendance requirements?"
                    )
                  }
                >
                  What are the attendance requirements?
                </button>

                <button
                  onClick={() =>
                    sendMessage(
                      "What facilities are available on campus?"
                    )
                  }
                >
                  What facilities are available on campus?
                </button>

                <button
                  onClick={() =>
                    sendMessage(
                      "What are the upcoming college events?"
                    )
                  }
                >
                  What are the upcoming college events?
                </button>

                <button
                  onClick={() =>
                    sendMessage(
                      "Tell me about placement opportunities."
                    )
                  }
                >
                  Tell me about placement opportunities.
                </button>

              </div>

              {/* =======================================
                  STUDENT PDF UPLOAD
              ======================================= */}

              {!studentDocumentActive && (
                <div className="dashboard-upload">

                  <div className="dashboard-upload-icon">
                    <FileText size={28} />
                  </div>

                  <div className="dashboard-upload-content">

                    <h3>
                      Upload a document
                    </h3>

                    <p>
                      Upload a PDF and ask questions
                      specifically from that document.
                    </p>

                  </div>

                  <button
                    type="button"
                    className="dashboard-upload-button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    disabled={uploadingDocument}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "9px",
                      minWidth: "150px",
                      padding: "13px 22px",
                      border: "none",
                      borderRadius: "14px",
                      background:
                        "linear-gradient(135deg, #12366b, #1d5a91, #258978)",
                      color: "#ffffff",
                      fontFamily: "inherit",
                      fontSize: "15px",
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow:
                        "0 7px 18px rgba(18, 54, 107, 0.18)",
                    }}
                  >
                    <Paperclip size={18} />

                    <span>
                      Choose PDF
                    </span>
                  </button>

                </div>
              )}

            </div>

          ) : (

            /* =========================================
               CHAT MESSAGES
            ========================================= */

            <div className="chat-messages">

              {messages.map(
                (
                  message,
                  index
                ) => (

                  <div
                    key={index}
                    className={`message ${
                      message.role === "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >

                    <div className="message-bubble">

                      {message.role === "assistant" ? (

                        <ReactMarkdown
                          remarkPlugins={[
                            remarkGfm,
                          ]}
                        >
                          {message.content}
                        </ReactMarkdown>

                      ) : (

                        message.content

                      )}

                    </div>

                    {/* =================================
                        SOURCES
                    ================================= */}

                    {message.sources &&
                      message.sources.length > 0 && (

                        <div className="message-sources">

                          <strong>
                            Sources
                          </strong>

                          {message.sources.map(
                            (
                              source,
                              sourceIndex
                            ) => (

                              <span
                                key={sourceIndex}
                              >

                                {source.source}

                                {source.page !== null &&
                                  ` • Page ${
                                    source.page + 1
                                  }`}

                              </span>

                            )
                          )}

                        </div>

                      )}

                  </div>

                )
              )}

              {/* =====================================
                  LOADING
              ===================================== */}

              {loading && (

                <div className="assistant-message">

                  <div className="message-bubble loading-message">

                    <LoaderCircle
                      size={18}
                      className="loading-icon"
                    />

                    Thinking...

                  </div>

                </div>

              )}

            </div>

          )}

          {/* =========================================
              HIDDEN FILE INPUT
          ========================================= */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            style={{
              display: "none",
            }}
          />

          {/* =========================================
              SELECTED FILE
          ========================================= */}

          {selectedFile && (
            <div className="selected-file">

              <FileText size={16} />

              <span>
                {selectedFile.name}
              </span>

              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                title="Remove file"
              >
                <X size={16} />
              </button>

              <button
                type="button"
                className="upload-document-action"
                onClick={
                  uploadStudentDocument
                }
                disabled={uploadingDocument}
              >

                {uploadingDocument ? (
                  <>
                    <LoaderCircle
                      size={15}
                      className="loading-icon"
                    />

                    Processing...
                  </>
                ) : (
                  "Use this document"
                )}

              </button>

            </div>
          )}

          {/* =========================================
              CHAT INPUT
          ========================================= */}

          <div className="chat-input-container">

            <button
              type="button"
              className="attachment-button"
              title="Attach PDF"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                uploadingDocument
              }
            >
              <Paperclip size={20} />
            </button>

            <input
              type="text"
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={handleKeyDown}
              placeholder={
                studentDocumentActive
                  ? "Ask a question about your uploaded PDF..."
                  : "Ask anything about your college..."
              }
              disabled={
                loading ||
                uploadingDocument
              }
            />

            <button
              type="button"
              className="send-button"
              title="Send"
              onClick={() =>
                sendMessage()
              }
              disabled={
                loading ||
                uploadingDocument
              }
            >

              {loading ? (

                <LoaderCircle
                  size={19}
                  className="loading-icon"
                />

              ) : (

                <Send size={19} />

              )}

            </button>

          </div>

          {/* =========================================
              CHAT DISCLAIMER
          ========================================= */}

          <p className="chat-disclaimer">

            {studentDocumentActive ? (
              <>
                Answers are based on{" "}
                <strong>
                  {studentDocumentName}
                </strong>
                .
              </>
            ) : (
              <>
                CampusConnect AI answers using
                information available in the
                official college knowledge base.
              </>
            )}

          </p>

        </section>
      );
    }

    // ===================================================
    // COLLEGE KNOWLEDGE
    // ===================================================

    if (activeSection === "knowledge") {
      return (
        <section className="content-section">

          <div className="content-heading">

            <h1>
              College Knowledge
            </h1>

            <p>
              Explore official information
              uploaded by faculty.
            </p>

          </div>

          <div className="knowledge-documents">

            <div className="documents-heading">

              <div>

                <h2>
                  Official Documents
                </h2>

                <p>
                  Documents available in
                  the college knowledge base.
                </p>

              </div>

              <span className="document-count">

                {documentsLoading
                  ? "Loading..."
                  : `${collegeDocuments.length} ${
                      collegeDocuments.length === 1
                        ? "document"
                        : "documents"
                    }`}

              </span>

            </div>

            {documentsLoading ? (

              <div className="knowledge-empty">

                <LoaderCircle
                  size={30}
                  className="loading-icon"
                />

                <h3>
                  Loading documents...
                </h3>

                <p>
                  Checking the official
                  college knowledge base.
                </p>

              </div>

            ) : collegeDocuments.length === 0 ? (

              <div className="knowledge-empty">

                <div className="knowledge-empty-icon">
                  <BookOpen size={30} />
                </div>

                <h3>
                  No documents uploaded yet
                </h3>

                <p>
                  Official documents uploaded
                  by faculty will appear here.
                </p>

              </div>

            ) : (

              <div className="document-list">

                {collegeDocuments.map(
                  (document) => (

                    <div
                      key={document.id}
                      className="document-card"
                    >

                      <div className="document-icon">
                        <FileText size={25} />
                      </div>

                      <div className="document-info">

                        <h3>
                          {document.filename}
                        </h3>

                        <p>
                          {document.description ||
                            "Official college document"}
                        </p>

                        <span>

                          {document.uploaded_by &&
                            `Uploaded by ${document.uploaded_by}`}

                          {document.pages &&
                            ` • ${document.pages} pages`}

                        </span>

                      </div>

                      <button
                        type="button"
                        className="document-view-button"
                        onClick={() =>
                          handleViewDocument(
                            document
                          )
                        }
                      >

                        <Eye size={17} />

                        View

                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

          <div className="document-note">

            <strong>
              Official College Knowledge
            </strong>

            <p>
              These documents are uploaded
              by faculty and form the official
              knowledge base used by
              CampusConnect AI.
            </p>

          </div>

        </section>
      );
    }

    // ===================================================
    // SETTINGS
    // ===================================================

    return (
      <section className="content-section">

        <div className="content-heading">

          <h1>
            Settings
          </h1>

          <p>
            Manage your CampusConnect
            student profile.
          </p>

        </div>

        <div className="profile-settings-card">

          <div className="profile-settings-header">

            <div>

              <h2>
                Student Profile
              </h2>

              <p>
                Update your personal and
                academic information.
              </p>

            </div>

            {!isEditingProfile && (

              <button
                type="button"
                className="edit-profile-button"
                onClick={() =>
                  setIsEditingProfile(true)
                }
              >
                Edit Profile
              </button>

            )}

          </div>

          <div className="profile-form">

            <div className="profile-form-group">

              <label htmlFor="student-name">
                Student Name
              </label>

              <input
                id="student-name"
                type="text"
                value={studentName}
                onChange={(event) =>
                  setStudentName(
                    event.target.value
                  )
                }
                disabled={!isEditingProfile}
              />

            </div>

            <div className="profile-form-group">

              <label htmlFor="student-email">
                College Email
              </label>

              <input
                id="student-email"
                type="email"
                value={studentEmail}
                onChange={(event) =>
                  setStudentEmail(
                    event.target.value
                  )
                }
                disabled={!isEditingProfile}
              />

            </div>

            <div className="profile-form-group">

              <label htmlFor="student-department">
                Department
              </label>

              <input
                id="student-department"
                type="text"
                value={studentDepartment}
                onChange={(event) =>
                  setStudentDepartment(
                    event.target.value
                  )
                }
                disabled={!isEditingProfile}
              />

            </div>

            <div className="profile-form-group">

              <label htmlFor="student-year">
                Year
              </label>

              <select
                id="student-year"
                value={studentYear}
                onChange={(event) =>
                  setStudentYear(
                    event.target.value
                  )
                }
                disabled={!isEditingProfile}
              >

                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>

              </select>

            </div>

            <div className="profile-form-group">

              <label htmlFor="student-section">
                Section
              </label>

              <input
                id="student-section"
                type="text"
                value={studentSection}
                onChange={(event) =>
                  setStudentSection(
                    event.target.value
                  )
                }
                disabled={!isEditingProfile}
              />

            </div>

            <div className="profile-form-group">

              <label htmlFor="student-roll">
                Roll Number
              </label>

              <input
                id="student-roll"
                type="text"
                value={studentRollNumber}
                onChange={(event) =>
                  setStudentRollNumber(
                    event.target.value
                  )
                }
                disabled={!isEditingProfile}
              />

            </div>

            <div className="profile-form-group">

              <label>
                Account Type
              </label>

              <input
                type="text"
                value="Student"
                disabled
              />

            </div>

          </div>

          {isEditingProfile && (

            <div className="profile-actions">

              <button
                type="button"
                className="cancel-profile-button"
                onClick={cancelProfileEdit}
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-profile-button"
                onClick={saveProfile}
              >
                Save Changes
              </button>

            </div>

          )}

        </div>

      </section>
    );
  };

  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <div className="dashboard">

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="sidebar">

        <div className="sidebar-logo">

          <div className="sidebar-logo-icon">
            🎓
          </div>

          <div>

            <h1>
              CampusConnect
            </h1>

            <span>
              AI Assistant
            </span>

          </div>

        </div>

        <nav className="sidebar-nav">

          <button
            type="button"
            className={`nav-item ${
              activeSection === "ask"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("ask")
            }
          >

            <MessageSquare size={19} />

            <span>
              Ask
            </span>

          </button>

          <button
            type="button"
            className={`nav-item ${
              activeSection === "knowledge"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("knowledge")
            }
          >

            <BookOpen size={19} />

            <span>
              College Knowledge
            </span>

          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            type="button"
            className={`nav-item ${
              activeSection === "settings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("settings")
            }
          >

            <Settings size={19} />

            <span>
              Settings
            </span>

          </button>

          <button
            type="button"
            className="nav-item logout"
            onClick={handleLogout}
          >

            <LogOut size={19} />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <h2>

              {activeSection === "ask" &&
                "Ask CampusConnect AI"}

              {activeSection === "knowledge" &&
                "College Knowledge"}

              {activeSection === "settings" &&
                "Settings"}

            </h2>

            <p>
              Your campus knowledge assistant.
            </p>

          </div>

          <button
            type="button"
            className="user-profile"
            onClick={() =>
              handleNavigation("settings")
            }
          >

            <div className="user-avatar">
              <UserRound size={18} />
            </div>

            <div>

              <strong>
                {studentName}
              </strong>

              <span>
                Student Account
              </span>

            </div>

          </button>

        </header>

        {renderContent()}

      </main>

    </div>
  );
}