import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { getLoggedInUser } from "../auth";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  MessageSquare,
  BookOpen,
  Upload,
  Settings,
  LogOut,
  Send,
  Paperclip,
  UserRound,
  FileText,
  X,
  LoaderCircle,
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

interface UploadedDocument {
  id: string;
  filename: string;
  pages: number;
  chunks: number;
  characters_extracted: number;
  uploaded_at: string;
  category: string;
  file_url?: string;
}

// =====================================================
// FACULTY DASHBOARD
// =====================================================

export default function FacultyDashboard() {
  const navigate = useNavigate();

  // =====================================================
  // AUTHENTICATION PROTECTION
  // =====================================================

  useEffect(() => {
    const user = getLoggedInUser();

    // No user logged in
    if (!user) {
      navigate("/");
      return;
    }

    // Student trying to access faculty dashboard
    if (user.role !== "faculty") {
      navigate("/student");
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

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [chatHistoryLoading, setChatHistoryLoading] =
    useState(false);

  // =====================================================
  // DOCUMENT UPLOAD
  // =====================================================

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadedDocuments, setUploadedDocuments] =
    useState<UploadedDocument[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [documentsLoading, setDocumentsLoading] =
    useState(false);

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // =====================================================
  // FACULTY PROFILE
  // =====================================================

  const [facultyName, setFacultyName] =
    useState("Faculty Member");

  const [facultyEmail, setFacultyEmail] =
    useState("faculty@college.edu");

  const [facultyDepartment, setFacultyDepartment] =
    useState(
      "Computer Science & Engineering"
    );

  const [savedName, setSavedName] =
    useState("Faculty Member");

  const [savedEmail, setSavedEmail] =
    useState("faculty@college.edu");

  const [savedDepartment, setSavedDepartment] =
    useState(
      "Computer Science & Engineering"
    );

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  // =====================================================
  // NAVIGATION
  // =====================================================

  const handleNavigation = (
    section: Section
  ) => {
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
  // FETCH OFFICIAL DOCUMENTS
  // =====================================================

  const fetchDocuments = async () => {
    setDocumentsLoading(true);

    try {
      const token =
        localStorage.getItem(
          "campusconnect_token"
        );

      if (!token) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      const response =
        await fetch(
          "http://127.0.0.1:8000/documents",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch documents."
        );
      }

      const data =
        await response.json();

      if (Array.isArray(data)) {
        setUploadedDocuments(data);
      } else {
        console.error(
          "Unexpected documents response:",
          data
        );

        setUploadedDocuments([]);
      }

    } catch (error) {
      console.error(
        "Error fetching documents:",
        error
      );

      setUploadedDocuments([]);

    } finally {
      setDocumentsLoading(false);
    }
  };

  // =====================================================
  // LOAD PERSISTENT CHAT HISTORY
  // =====================================================

  const loadChatHistory = async () => {
    const user = getLoggedInUser();

    const token =
      localStorage.getItem(
        "campusconnect_token"
      );

    if (
      !user ||
      user.role !== "faculty"
    ) {
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
      const response =
        await fetch(
          "http://127.0.0.1:8000/chat-history",
          {
            method: "GET",
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) {
        throw new Error(
          "Could not load chat history."
        );
      }

      const data =
        await response.json();

      const history =
        Array.isArray(data.history)
          ? data.history
          : [];

      // PostgreSQL returns newest first.
      // Reverse it so the conversation appears
      // in normal oldest -> newest order.
      const restoredMessages: Message[] = [];

      [...history]
        .reverse()
        .forEach((item: {
          question: string;
          answer: string;
        }) => {
          restoredMessages.push({
            role: "user",
            content:
              item.question,
          });

          restoredMessages.push({
            role: "assistant",
            content:
              item.answer,
          });
        });

      setMessages(
        restoredMessages
      );

    } catch (error) {
      console.error(
        "Chat history loading error:",
        error
      );
    } finally {
      setChatHistoryLoading(false);
    }
  };

  // =====================================================
  // LOAD DOCUMENTS WHEN DASHBOARD OPENS
  // =====================================================

  useEffect(() => {
    const user = getLoggedInUser();

    if (user?.role === "faculty") {
      fetchDocuments();
      loadChatHistory();
    }
  }, []);

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

      event.target.value = "";

      return;
    }

    setSelectedFile(file);
  };

  // =====================================================
  // REMOVE SELECTED FILE
  // =====================================================

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // =====================================================
  // UPLOAD DOCUMENT TO FASTAPI
  // =====================================================

  const uploadDocument = async () => {
    if (!selectedFile) {
      alert(
        "Please choose a PDF document first."
      );

      return;
    }

    const user = getLoggedInUser();
    const token = localStorage.getItem(
      "campusconnect_token"
    );

    if (!user || user.role !== "faculty") {
      alert("Please log in again.");
      return;
    }

    if (!token) {
      alert(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    setUploading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          "http://127.0.0.1:8000/upload",
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
            "Upload failed."
        );
      }

      const data =
        await response.json();

      console.log(
        "Upload response:",
        data
      );

      await fetchDocuments();

      removeSelectedFile();

      alert(
        `Document uploaded successfully!\n\nPages: ${
          data.pages ?? "N/A"
        }\nChunks created: ${
          data.chunks_created ?? "N/A"
        }`
      );

    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Could not upload the document. Please make sure the FastAPI backend is running."
      );

    } finally {
      setUploading(false);
    }
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

    const userMessage:
      Message = {
      role: "user",
      content:
        currentQuestion,
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
      const user = getLoggedInUser();
      const token = localStorage.getItem(
        "campusconnect_token"
      );

      if (!user || user.role !== "faculty" || !token) {
        throw new Error(
          "Your login session has expired. Please log in again."
        );
      }

      const response =
        await fetch(
          "http://127.0.0.1:8000/chat",
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
        throw new Error(
          "Failed to get response."
        );
      }

      const data =
        await response.json();

      const assistantMessage:
        Message = {
        role: "assistant",

        content:
          data.answer,

        sources:
          data.sources,
      };

      setMessages(
        (previous) => [
          ...previous,
          assistantMessage,
        ]
      );

      // Refresh the PostgreSQL-backed history
      // after saving the latest conversation.
      await loadChatHistory();

    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

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
    if (
      event.key === "Enter"
    ) {
      event.preventDefault();

      sendMessage();
    }
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const saveProfile = () => {
    setSavedName(
      facultyName
    );

    setSavedEmail(
      facultyEmail
    );

    setSavedDepartment(
      facultyDepartment
    );

    setIsEditingProfile(
      false
    );

    alert(
      "Profile updated successfully."
    );
  };

  // =====================================================
  // CANCEL PROFILE EDIT
  // =====================================================

  const cancelProfileEdit = () => {
    setFacultyName(
      savedName
    );

    setFacultyEmail(
      savedEmail
    );

    setFacultyDepartment(
      savedDepartment
    );

    setIsEditingProfile(
      false
    );
  };

  // =====================================================
  // CONTENT
  // =====================================================

  const renderContent = () => {

    // ===================================================
    // ASK SECTION
    // ===================================================

    if (
      activeSection === "ask"
    ) {
      return (
        <section className="chat-area">

          {chatHistoryLoading ? (

            <div className="welcome-content">

              <LoaderCircle
                size={30}
                className="loading-icon"
              />

              <h1>
                Loading your conversations...
              </h1>

              <p>
                Restoring your saved CampusConnect AI
                conversations.
              </p>

            </div>

          ) : messages.length === 0 ? (

            <div className="welcome-content">

              <div className="welcome-icon">
                🎓
              </div>

              <h1>
                How can I help you?
              </h1>

              <p>
                Ask questions about your
                college, campus, academic
                information, events, policies,
                or student services.
              </p>

              <div className="suggestions">

                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "What are the current college policies?"
                    )
                  }
                >
                  What are the current
                  college policies?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "What facilities are available on campus?"
                    )
                  }
                >
                  What facilities are
                  available on campus?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "What are the upcoming college events?"
                    )
                  }
                >
                  What are the upcoming
                  college events?
                </button>

                <button
                  type="button"
                  onClick={() =>
                    sendMessage(
                      "Tell me about placement information."
                    )
                  }
                >
                  Tell me about placement
                  information.
                </button>

              </div>

            </div>

          ) : (

            <div className="chat-messages">

              {messages.map(
                (
                  message,
                  index
                ) => (

                  <div
                    key={index}
                    className={`message ${
                      message.role ===
                      "user"
                        ? "user-message"
                        : "assistant-message"
                    }`}
                  >

                    <div className="message-bubble">

                      <ReactMarkdown
                        remarkPlugins={[
                          remarkGfm,
                        ]}
                      >
                        {message.content}
                      </ReactMarkdown>

                    </div>

                    {message.sources &&
                      message.sources.length >
                        0 && (

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
                                key={
                                  sourceIndex
                                }
                              >
                                {source.source}

                                {source.page !==
                                  null &&
                                  ` • Page ${
                                    source.page +
                                    1
                                  }`}
                              </span>

                            )
                          )}

                        </div>

                      )}

                  </div>

                )
              )}

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

          <div className="chat-input-container">

            <input
              type="text"

              value={question}

              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }

              onKeyDown={
                handleKeyDown
              }

              placeholder="Ask anything about your college..."

              disabled={loading}
            />

            <button
              type="button"
              className="send-button"

              title="Send"

              onClick={() =>
                sendMessage()
              }

              disabled={loading}
            >

              {loading ? (

                <LoaderCircle
                  size={19}
                  className="loading-icon"
                />

              ) : (

                <Send
                  size={19}
                />

              )}

            </button>

          </div>

          <p className="chat-disclaimer">
            CampusConnect AI uses
            information from the official
            college knowledge base.
          </p>

        </section>
      );
    }

    // ===================================================
    // COLLEGE KNOWLEDGE
    // ===================================================

    if (
      activeSection === "knowledge"
    ) {
      return (
        <section className="content-section">

          <div className="content-heading">

            <h1>
              College Knowledge
            </h1>

            <p>
              Upload and manage official
              college documents used by
              CampusConnect AI.
            </p>

          </div>

          <div className="knowledge-upload-card">

            <div className="knowledge-upload-icon">

              <Upload
                size={32}
              />

            </div>

            <div className="knowledge-upload-content">

              <h2>
                Upload official document
              </h2>

              <p>
                Add college circulars,
                academic schedules,
                policies, placement notices,
                event schedules, and other
                official campus information.
              </p>

            </div>

            <input
              ref={fileInputRef}

              type="file"

              accept=".pdf,application/pdf"

              onChange={
                handleFileSelect
              }

              style={{
                display: "none",
              }}
            />

            <button
              type="button"
              className="knowledge-upload-button"

              onClick={() =>
                fileInputRef.current?.click()
              }

              disabled={uploading}
            >

              <Paperclip
                size={18}
              />

              Choose PDF

            </button>

          </div>

          {selectedFile && (

            <div className="selected-document-card">

              <div className="selected-document-info">

                <div className="selected-document-icon">

                  <FileText
                    size={22}
                  />

                </div>

                <div>

                  <strong>
                    {selectedFile.name}
                  </strong>

                  <span>
                    {(
                      selectedFile.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </span>

                </div>

              </div>

              <div className="selected-document-actions">

                <button
                  type="button"
                  className="remove-file-button"

                  onClick={
                    removeSelectedFile
                  }

                  disabled={uploading}

                  title="Remove file"
                >

                  <X
                    size={18}
                  />

                </button>

                <button
                  type="button"
                  className="confirm-upload-button"

                  onClick={
                    uploadDocument
                  }

                  disabled={uploading}
                >

                  {uploading ? (

                    <>
                      <LoaderCircle
                        size={17}
                        className="loading-icon"
                      />

                      Uploading...
                    </>

                  ) : (

                    <>
                      <Upload
                        size={17}
                      />

                      Upload PDF
                    </>

                  )}

                </button>

              </div>

            </div>

          )}

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

                {uploadedDocuments.length}{" "}

                {uploadedDocuments.length ===
                1
                  ? "document"
                  : "documents"}

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
                  Fetching official college
                  documents.
                </p>

              </div>

            ) : uploadedDocuments.length ===
            0 ? (

              <div className="knowledge-empty">

                <div className="knowledge-empty-icon">

                  <BookOpen
                    size={30}
                  />

                </div>

                <h3>
                  No documents uploaded yet
                </h3>

                <p>
                  Official documents uploaded
                  by faculty will appear here.
                </p>

                <button
                  type="button"
                  className="empty-upload-button"

                  onClick={() =>
                    fileInputRef.current?.click()
                  }

                  disabled={uploading}
                >

                  <Upload
                    size={17}
                  />

                  Upload your first document

                </button>

              </div>

            ) : (

              <div className="document-list">

                {uploadedDocuments.map(
                  (document) => (

                    <div
                      key={
                        document.id
                      }

                      className="document-card"
                    >

                      <div className="document-icon">

                        <FileText
                          size={24}
                        />

                      </div>

                      <div className="document-info">

                        <h3>
                          {document.filename}
                        </h3>

                        <p>
                          Official college
                          document
                        </p>

                        <span>
                          {document.pages} pages
                          {" • "}
                          {document.category}
                        </span>

                      </div>

                      <button
                        type="button"
                        className="document-view-button"

                        onClick={async () => {
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
                            const fileUrl =
                              document.file_url ||
                              `http://127.0.0.1:8000/files/${encodeURIComponent(
                                document.filename
                              )}`;

                            const response =
                              await fetch(
                                fileUrl,
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
                                  .catch(
                                    () => null
                                  );

                              throw new Error(
                                errorData?.detail ||
                                "Could not open the document."
                              );
                            }

                            const blob =
                              await response.blob();

                            const blobUrl =
                              URL.createObjectURL(
                                blob
                              );

                            window.open(
                              blobUrl,
                              "_blank"
                            );

                            setTimeout(() => {
                              URL.revokeObjectURL(
                                blobUrl
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
                        }}
                      >
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
              Official Knowledge Base
            </strong>

            <p>
              Documents uploaded by faculty
              are intended to become part of
              the official college knowledge
              available to students and faculty.
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
            faculty profile.
          </p>

        </div>

        <div className="profile-settings-card">

          <div className="profile-settings-header">

            <div>

              <h2>
                Faculty Profile
              </h2>

              <p>
                Update your personal and
                department information.
              </p>

            </div>

            {!isEditingProfile && (

              <button
                type="button"
                className="edit-profile-button"

                onClick={() =>
                  setIsEditingProfile(
                    true
                  )
                }
              >
                Edit Profile
              </button>

            )}

          </div>

          <div className="profile-form">

            <div className="profile-form-group">

              <label htmlFor="faculty-name">
                Faculty Name
              </label>

              <input
                id="faculty-name"

                type="text"

                value={
                  facultyName
                }

                onChange={(event) =>
                  setFacultyName(
                    event.target.value
                  )
                }

                disabled={
                  !isEditingProfile
                }
              />

            </div>

            <div className="profile-form-group">

              <label htmlFor="faculty-email">
                College Email
              </label>

              <input
                id="faculty-email"

                type="email"

                value={
                  facultyEmail
                }

                onChange={(event) =>
                  setFacultyEmail(
                    event.target.value
                  )
                }

                disabled={
                  !isEditingProfile
                }
              />

            </div>

            <div className="profile-form-group">

              <label htmlFor="faculty-department">
                Department
              </label>

              <input
                id="faculty-department"

                type="text"

                value={
                  facultyDepartment
                }

                onChange={(event) =>
                  setFacultyDepartment(
                    event.target.value
                  )
                }

                disabled={
                  !isEditingProfile
                }
              />

            </div>

            <div className="profile-form-group">

              <label>
                Account Type
              </label>

              <input
                type="text"

                value="Faculty"

                disabled
              />

            </div>

          </div>

          {isEditingProfile && (

            <div className="profile-actions">

              <button
                type="button"
                className="cancel-profile-button"

                onClick={
                  cancelProfileEdit
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="save-profile-button"

                onClick={
                  saveProfile
                }
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
              activeSection ===
              "ask"
                ? "active"
                : ""
            }`}

            onClick={() =>
              handleNavigation(
                "ask"
              )
            }
          >

            <MessageSquare
              size={19}
            />

            <span>
              Ask
            </span>

          </button>

          <button
            type="button"
            className={`nav-item ${
              activeSection ===
              "knowledge"
                ? "active"
                : ""
            }`}

            onClick={() =>
              handleNavigation(
                "knowledge"
              )
            }
          >

            <BookOpen
              size={19}
            />

            <span>
              College Knowledge
            </span>

          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            type="button"
            className={`nav-item ${
              activeSection ===
              "settings"
                ? "active"
                : ""
            }`}

            onClick={() =>
              handleNavigation(
                "settings"
              )
            }
          >

            <Settings
              size={19}
            />

            <span>
              Settings
            </span>

          </button>

          <button
            type="button"
            className="nav-item logout"

            onClick={
              handleLogout
            }
          >

            <LogOut
              size={19}
            />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

      <main className="dashboard-main">

        <header className="dashboard-header">

          <div>

            <h2>

              {activeSection ===
                "ask" &&
                "Ask CampusConnect AI"}

              {activeSection ===
                "knowledge" &&
                "College Knowledge"}

              {activeSection ===
                "settings" &&
                "Settings"}

            </h2>

            <p>
              Your campus knowledge
              assistant.
            </p>

          </div>

          <button
            type="button"
            className="user-profile"

            onClick={() =>
              handleNavigation(
                "settings"
              )
            }
          >

            <div className="user-avatar">

              <UserRound
                size={18}
              />

            </div>

            <div>

              <strong>
                {facultyName}
              </strong>

              <span>
                Faculty Account
              </span>

            </div>

          </button>

        </header>

        {renderContent()}

      </main>

    </div>
  );
}