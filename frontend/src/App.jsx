import { useEffect, useRef, useState } from "react";
import {
  Bot, FileText, UploadCloud, Plus, Send, Trash2, Sparkles,
  PanelLeftClose, Menu, MessageSquareText, CheckCircle2, LoaderCircle,
  BookOpen, ShieldCheck, X
} from "lucide-react";
import { api } from "./api";

const formatDate = (value) => {
  try { return new Date(value).toLocaleDateString(); }
  catch { return ""; }
};

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const fileRef = useRef(null);
  const endRef = useRef(null);

  const selected = documents.find((doc) => doc.id === selectedId);

  async function loadDocuments(preferredId = "") {
    const data = await api.documents();
    setDocuments(data.documents);
    const target = preferredId || selectedId;
    if (target && data.documents.some((doc) => doc.id === target)) {
      setSelectedId(target);
    } else if (!data.documents.some((doc) => doc.id === selectedId)) {
      setSelectedId(data.documents[0]?.id || "");
      setMessages([]);
    }
  }

  useEffect(() => {
    loadDocuments().catch((e) => setError(e.message)).finally(() => setLoadingDocs(false));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(pdf|txt)$/i.test(file.name)) {
      setError("Choose a PDF or TXT file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10 MB limit.");
      return;
    }
    setError("");
    setNotice("");
    setUploading(true);
    try {
      const result = await api.upload(file);
      await loadDocuments(result.id);
      setSelectedId(result.id);
      setMessages([]);
      setNotice(`${result.filename} indexed successfully (${result.chunk_count} chunks).`);
      setMobileSidebar(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAsk(event) {
    event?.preventDefault();
    const text = question.trim();
    if (!text || !selectedId || asking) return;
    setError("");
    setNotice("");
    setQuestion("");
    setMessages((current) => [...current, { role: "user", content: text }]);
    setAsking(true);
    try {
      const result = await api.ask(selectedId, text);
      setMessages((current) => [...current, {
        role: "assistant", content: result.answer, sources: result.sources || []
      }]);
    } catch (e) {
      setError(e.message);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: `I couldn't complete that request: ${e.message}`, sources: [] }
      ]);
    } finally {
      setAsking(false);
    }
  }

  async function handleDelete(doc, event) {
    event?.stopPropagation();
    if (!window.confirm(`Delete "${doc.original_name}" and its indexed content?`)) return;
    setError("");
    try {
      await api.deleteDocument(doc.id);
      const remaining = documents.filter((item) => item.id !== doc.id);
      setDocuments(remaining);
      if (selectedId === doc.id) {
        setSelectedId(remaining[0]?.id || "");
        setMessages([]);
      }
      setNotice("Document deleted.");
    } catch (e) {
      setError(e.message);
    }
  }

  function chooseDocument(doc) {
    setSelectedId(doc.id);
    setMessages([]);
    setError("");
    setNotice("");
    setMobileSidebar(false);
  }

  const starters = [
    "Summarize this document",
    "What are the key points?",
    "List the important dates or numbers"
  ];

  return (
    <div className="app-shell">
      {mobileSidebar && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileSidebar(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "" : "sidebar-collapsed"} ${mobileSidebar ? "mobile-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={20} /></div>
          {sidebarOpen && <div className="brand-copy"><strong>DocuMind</strong><span>DOCUMENT INTELLIGENCE</span></div>}
          <button className="icon-button sidebar-toggle" title="Collapse sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <PanelLeftClose size={17} />
          </button>
          <button className="icon-button mobile-close" title="Close sidebar" onClick={() => setMobileSidebar(false)}><X size={18}/></button>
        </div>

        <button className="new-chat-button" onClick={() => { setMessages([]); setError(""); setNotice(""); }}>
          <Plus size={18} /> {sidebarOpen && "New conversation"}
        </button>

        {sidebarOpen && <div className="section-label">YOUR DOCUMENTS <span>{documents.length}</span></div>}
        <div className="document-list">
          {loadingDocs ? <div className="muted small sidebar-message">Loading documents…</div> :
            documents.length === 0 ? (
              <div className="empty-docs">
                <FileText size={22} />
                {sidebarOpen && <><strong>No documents yet</strong><span>Upload a file to get started.</span></>}
              </div>
            ) : documents.map((doc) => (
              <div key={doc.id} className={`document-item ${selectedId === doc.id ? "selected" : ""}`} onClick={() => chooseDocument(doc)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && chooseDocument(doc)}>
                <FileText size={17} className="document-icon" />
                {sidebarOpen && <div className="document-info"><span title={doc.original_name}>{doc.original_name}</span><small>{doc.chunk_count} chunks · {formatDate(doc.uploaded_at)}</small></div>}
                {sidebarOpen && <button className="delete-button" title="Delete document" onClick={(e) => handleDelete(doc, e)}><Trash2 size={15}/></button>}
              </div>
            ))}
        </div>

        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={17}/>{sidebarOpen && <span>Local AI · Your files stay on this machine</span>}</div>
          <button className="upload-button" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <LoaderCircle className="spin" size={18}/> : <UploadCloud size={18}/>}
            {sidebarOpen && (uploading ? "Processing…" : "Upload document")}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.txt,application/pdf,text/plain" hidden onChange={handleUpload}/>
          {sidebarOpen && <span className="file-hint">PDF or TXT · Max 10 MB</span>}
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button mobile-menu" onClick={() => setMobileSidebar(true)} aria-label="Open menu"><Menu size={20}/></button>
            <div><div className="eyebrow">AI WORKSPACE</div><h1>{selected ? selected.original_name : "Document Q&A"}</h1></div>
          </div>
          <div className="connection-status"><span className="status-dot"/><span>Local workspace</span></div>
        </header>

        {(error || notice) && <div className={`toast ${error ? "toast-error" : "toast-success"}`} role="status">
          {error ? <X size={17}/> : <CheckCircle2 size={17}/>}<span>{error || notice}</span>
          <button onClick={() => {setError(""); setNotice("");}} aria-label="Dismiss"><X size={15}/></button>
        </div>}

        {!selected ? (
          <div className="welcome-wrap">
            <div className="welcome-orb"><Bot size={34}/><span className="orb-spark">✦</span></div>
            <div className="eyebrow">YOUR PERSONAL DOCUMENT ASSISTANT</div>
            <h2>Answers are already<br/><span>in your documents.</span></h2>
            <p>Upload a PDF or text file, then ask questions in plain language. Get grounded answers with source passages you can inspect.</p>
            <button className="primary-button" onClick={() => fileRef.current?.click()}><UploadCloud size={18}/> Upload your first document</button>
            <div className="welcome-features">
              <div><BookOpen size={18}/><strong>Understand</strong><span>Summaries and key insights</span></div>
              <div><MessageSquareText size={18}/><strong>Ask naturally</strong><span>Questions in plain English</span></div>
              <div><ShieldCheck size={18}/><strong>Stay local</strong><span>Local model and storage</span></div>
            </div>
          </div>
        ) : (
          <>
            <section className={`chat-area ${messages.length === 0 ? "chat-empty" : ""}`}>
              {messages.length === 0 ? (
                <div className="chat-intro">
                  <div className="assistant-avatar"><Bot size={22}/></div>
                  <h2>Let's explore your document.</h2>
                  <p>Ask a question about <strong>{selected.original_name}</strong>. I'll look for relevant passages and show you the sources.</p>
                  <div className="suggestion-grid">
                    {starters.map((item) => <button key={item} onClick={() => setQuestion(item)}><Sparkles size={15}/>{item}<span>↗</span></button>)}
                  </div>
                </div>
              ) : (
                <div className="message-list">
                  {messages.map((message, index) => (
                    <div className={`message-row ${message.role}`} key={index}>
                      <div className={`message-avatar ${message.role}`}>{message.role === "assistant" ? <Bot size={18}/> : "Y"}</div>
                      <div className="message-content">
                        <div className="message-author">{message.role === "assistant" ? "DocuMind" : "You"}</div>
                        <div className="message-text">{message.content}</div>
                        {message.sources?.length > 0 && <div className="sources-panel">
                          <div className="sources-heading"><BookOpen size={15}/> Retrieved source passages <span>{message.sources.length}</span></div>
                          {message.sources.map((source, sourceIndex) => (
                            <details className="source-card" key={`${source.document_id}-${sourceIndex}`}>
                              <summary><span className="source-number">{sourceIndex + 1}</span><span className="source-title">{source.filename}{source.page ? ` · Page ${source.page}` : ""}</span><span className="source-chevron">+</span></summary>
                              <p>{source.text}</p>
                            </details>
                          ))}
                        </div>}
                      </div>
                    </div>
                  ))}
                  {asking && <div className="message-row assistant"><div className="message-avatar assistant"><Bot size={18}/></div><div className="message-content"><div className="message-author">DocuMind</div><div className="thinking"><span/><span/><span/> Searching document and generating answer…</div></div></div>}
                  <div ref={endRef}/>
                </div>
              )}
            </section>
            <div className="composer-wrap">
              <form className="composer" onSubmit={handleAsk}>
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask anything about this document…" rows={1} maxLength={2000} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(e); } }}/>
                <button type="submit" className="send-button" disabled={!question.trim() || asking} aria-label="Send question">{asking ? <LoaderCircle className="spin" size={18}/> : <Send size={18}/>}</button>
              </form>
              <div className="composer-foot"><span><ShieldCheck size={13}/> Answers are based on retrieved document passages.</span><span>Enter to send · Shift + Enter for new line</span></div>
            </div>
          </>
        )}
        <footer className="app-footer"><span>DOCUMIND <b>·</b> AI DOCUMENT Q&A</span><span>Built with RAG · FastAPI · React · Ollama</span></footer>
      </main>
    </div>
  );
}
