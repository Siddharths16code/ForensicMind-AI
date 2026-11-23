
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  GitBranch,
  LayoutDashboard,
  Plus,
  Play,
  RotateCcw,
  Shield,
  Trash2,
  Usb,
  X,
  Info,
  Link2,
  Monitor,
  User,
  File,
} from "lucide-react";

import EvidenceGraph from "./EvidenceGraph";
import "@xyflow/react/dist/style.css";
import "./App.css";

const API = import.meta.env.VITE_API_URL || String.fromCharCode(104,116,116,112,58,47,47,49,50,55,46,48,46,48,46,49,58,56,48,48,48);

type EventType =
  | "login"
  | "file_modified"
  | "usb_connected"
  | "file_transfer";

type Evidence = {
  id: number;
  event_type: EventType;
  timestamp: number;
  source: string;
  device: string;
  user: string;
  file_name: string;
  metadata: string;
};

type Severity = "HIGH" | "MEDIUM" | "LOW";

type Finding = {
  rule: string;
  title: string;
  severity: Severity;
  description: string;
  matched_events?: Record<string, unknown> | Record<string, unknown>[];
};

type Correlation = {
  type: "same_device" | "same_user" | "same_file" | string;
  description: string;
  matched_events: Record<string, unknown>;
};

type AnalysisResult = {
  risk: Severity;
  finding: string;
  reasoning_engine: string;
  total_events: number;
  total_findings: number;
  total_correlations: number;
  findings: Finding[];
  correlations: Correlation[];
  evidence_records: Array<{
    id: string;
    event_type: EventType;
    timestamp: number;
    source: string;
    device: string;
    user: string;
    file_name: string;
    metadata: Record<string, string>;
  }>;
  explanation: string;
};

type SystemHealth = "checking" | "online" | "degraded" | "offline";

const eventOptions: {
  value: EventType;
  label: string;
  description: string;
}[] = [
  {
    value: "login",
    label: "User Login",
    description: "Authentication event",
  },
  {
    value: "file_modified",
    label: "File Modified",
    description: "File system activity",
  },
  {
    value: "usb_connected",
    label: "USB Connected",
    description: "External device detected",
  },
  {
    value: "file_transfer",
    label: "File Transfer",
    description: "Data movement event",
  },
];

const sampleEvents: Evidence[] = [
  {
    id: 1,
    event_type: "login",
    timestamp: 100,
    source: "Windows Security Log",
    device: "Office-Laptop-01",
    user: "alice",
    file_name: "Unknown",
    metadata: '{"ip_address":"192.168.1.10","login_status":"success"}',
  },
  {
    id: 2,
    event_type: "file_modified",
    timestamp: 110,
    source: "NTFS File System",
    device: "Office-Laptop-01",
    user: "alice",
    file_name: "Q4_Report.docx",
    metadata: '{"operation":"modified","file_size":"245 KB"}',
  },
  {
    id: 3,
    event_type: "usb_connected",
    timestamp: 120,
    source: "USB Device Log",
    device: "Office-Laptop-01",
    user: "alice",
    file_name: "Unknown",
    metadata: '{"usb_name":"SanDisk USB","vendor":"SanDisk"}',
  },
  {
    id: 4,
    event_type: "file_transfer",
    timestamp: 130,
    source: "File Transfer Log",
    device: "Office-Laptop-01",
    user: "alice",
    file_name: "Q4_Report.docx",
    metadata: '{"destination":"USB Storage","transfer_size":"245 KB"}',
  },
];

function eventLabel(type: EventType) {
  return eventOptions.find((event) => event.value === type)?.label ?? type;
}

function eventIcon(type: EventType) {
  if (type === "usb_connected") return <Usb size={17} />;
  if (type === "file_transfer") return <ArrowUpRight size={17} />;
  if (type === "file_modified") return <FileSearch size={17} />;
  return <Shield size={17} />;
}

function severityClass(severity: Severity) {
  if (severity === "HIGH") return "finding-high";
  if (severity === "MEDIUM") return "finding-medium";
  return "finding-low";
}

function bannerClass(severity: Severity) {
  if (severity === "HIGH") return "banner-high";
  if (severity === "MEDIUM") return "banner-medium";
  return "banner-low";
}

function formatMatchValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function FindingMatches({
  matches,
}: {
  matches?: Record<string, unknown> | Record<string, unknown>[];
}) {
  if (!matches) return null;

  const groups = Array.isArray(matches) ? matches : [matches];
  if (groups.length === 0) return null;

  return (
    <div className="finding-matches">
      <h4>Matched Rule Variables</h4>
      {groups.map((group, index) => (
        <div className="matches-grid" key={index}>
          {Object.entries(group).map(([key, value]) => (
            <div className="match-item" key={key}>
              <span>{key}</span>
              <strong>{formatMatchValue(value)}</strong>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function FindingCard({
  finding,
  index,
}: {
  finding: Finding;
  index: number;
}) {
  return (
    <article className="finding-card">
      <div className="finding-card-top">
        <div className="finding-card-title">
          <span className="finding-number">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h4>{finding.title}</h4>
            <span className="rule-name">{finding.rule}</span>
          </div>
        </div>

        <span className={`finding-status ${severityClass(finding.severity)}`}>
          {finding.severity === "HIGH" ? (
            <AlertTriangle size={15} />
          ) : finding.severity === "MEDIUM" ? (
            <Info size={15} />
          ) : (
            <CheckCircle2 size={15} />
          )}
          {finding.severity}
        </span>
      </div>

      <p>{finding.description}</p>
      <FindingMatches matches={finding.matched_events} />
    </article>
  );
}

function correlationLabel(type: string) {
  if (type === "same_device") return "Shared Device";
  if (type === "same_user") return "Shared User";
  if (type === "same_file") return "Shared File";
  return type.replaceAll("_", " ");
}

function CorrelationCard({ item }: { item: Correlation }) {
  return (
    <article className="correlation-card">
      <div className="correlation-card-heading">
        <Link2 size={17} />
        <strong>{correlationLabel(item.type)}</strong>
      </div>
      <p>{item.description}</p>
      <div className="matches-grid">
        {Object.entries(item.matched_events).map(([key, value]) => (
          <div className="match-item" key={key}>
            <span>{key}</span>
            <strong>{formatMatchValue(value)}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [events, setEvents] = useState<Evidence[]>(sampleEvents);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] =
    useState<SystemHealth>("checking");
  const [error, setError] = useState("");

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.timestamp - b.timestamp),
    [events]
  );

  useEffect(() => {
    let active = true;

    const checkHealth = async () => {
      try {
        const response = await axios.get(`${API}/api/health`, {
          timeout: 4000,
        });

        if (!active) return;

        if (
          response.data.status === "healthy" &&
          response.data.prolog === "available"
        ) {
          setSystemHealth("online");
        } else {
          setSystemHealth("degraded");
        }
      } catch {
        if (active) setSystemHealth("offline");
      }
    };

    void checkHealth();

    const interval = window.setInterval(() => {
      void checkHealth();
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const addEvent = () => {
    const nextTime =
      events.length > 0
        ? Math.max(...events.map((event) => event.timestamp)) + 10
        : 100;

    setEvents((current) => [
      ...current,
      {
        id: Date.now(),
        event_type: "login",
        timestamp: nextTime,
        source: "Unknown",
        device: "Unknown",
        user: "Unknown",
        file_name: "Unknown",
        metadata: "{}",
      },
    ]);

    setResult(null);
    setError("");
  };

  const updateEvent = (
    id: number,
    field: keyof Evidence,
    value: string
  ) => {
    setEvents((current) =>
      current.map((event) => {
        if (event.id !== id) return event;

        if (field === "timestamp") {
          return {
            ...event,
            timestamp: value.trim() === "" ? NaN : Number(value),
          };
        }

        if (field === "id") return event;

        return { ...event, [field]: value };
      })
    );

    setResult(null);
    setError("");
  };

  const removeEvent = (id: number) => {
    setEvents((current) => current.filter((event) => event.id !== id));
    setResult(null);
    setError("");
  };

  const resetInvestigation = () => {
    setEvents(sampleEvents);
    setResult(null);
    setError("");
    setActiveTab("Dashboard");
  };

  const analyzeEvidence = async () => {
    if (events.length === 0) {
      setError("Add at least one evidence event before analysis.");
      return;
    }

    if (
      events.some(
        (event) =>
          !Number.isFinite(event.timestamp) ||
          !Number.isInteger(event.timestamp) ||
          event.timestamp < 0
      )
    ) {
      setError("Enter a valid non-negative integer timestamp for every event.");
      return;
    }

    let payloadEvents;

    try {
      payloadEvents = sortedEvents.map((event) => {
        const parsedMetadata: unknown = JSON.parse(event.metadata || "{}");

        if (
          parsedMetadata === null ||
          Array.isArray(parsedMetadata) ||
          typeof parsedMetadata !== "object"
        ) {
          throw new Error("Metadata must be a JSON object.");
        }

        const metadata = parsedMetadata as Record<string, unknown>;

        if (
          Object.values(metadata).some(
            (value) => typeof value !== "string"
          )
        ) {
          throw new Error("Every metadata value must be text.");
        }

        return {
          id: String(event.id),
          event_type: event.event_type,
          timestamp: event.timestamp,
          source: event.source.trim() || "Unknown",
          device: event.device.trim() || "Unknown",
          user: event.user.trim() || "Unknown",
          file_name: event.file_name.trim() || "Unknown",
          metadata: metadata as Record<string, string>,
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Invalid metadata: ${err.message}`
          : "Check the metadata JSON in every evidence event."
      );
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await axios.post<AnalysisResult>(
        `${API}/api/analyze`,
        { events: payloadEvents },
        { timeout: 20000 }
      );

      setResult(response.data);
      setActiveTab("Reports");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        const detail = err.response.data?.detail;
        setError(
          `Analysis server returned an error (${err.response.status}). ${
            typeof detail === "string" ? detail : "Check the backend terminal."
          }`
        );
      } else {
        setError(
          "Could not connect to the analysis server. Make sure FastAPI is running on port 8000."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    { name: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Evidence", icon: <Database size={18} /> },
    { name: "Timeline", icon: <Clock3 size={18} /> },
    { name: "Evidence Graph", icon: <GitBranch size={18} /> },
    { name: "Reports", icon: <FileSearch size={18} /> },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Shield size={22} />
          </div>
          <div>
            <h1>ForensicMind</h1>
            <span>INTELLIGENCE PLATFORM</span>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="nav-menu">
          {navigation.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeTab === item.name ? "active" : ""}`}
              onClick={() => setActiveTab(item.name)}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.name === "Evidence" && (
                <span className="nav-count">{events.length}</span>
              )}
              {item.name === "Reports" && result && (
                <span className="nav-count">{result.total_findings}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="engine-card">
            <div className={`engine-indicator ${systemHealth}`} />
            <div>
              <strong>Reasoning Engine</strong>
              <span>
                {systemHealth === "checking"
                  ? "Checking connection..."
                  : systemHealth === "online"
                  ? "SWI-Prolog connected"
                  : systemHealth === "degraded"
                  ? "Prolog unavailable"
                  : "Backend disconnected"}
              </span>
            </div>
          </div>
          <div className="sidebar-version">FORENSICMIND AI · v3.0</div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>{activeTab}</strong>
          </div>

          <div className="topbar-right">
            <span className={`system-status ${systemHealth}`}>
              <span className="status-dot" />
              {systemHealth === "checking"
                ? "CHECKING SYSTEM"
                : systemHealth === "online"
                ? "SYSTEM OPERATIONAL"
                : systemHealth === "degraded"
                ? "ENGINE DEGRADED"
                : "SYSTEM OFFLINE"}
            </span>
            <div className="avatar">FM</div>
          </div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <div className="eyebrow">DIGITAL FORENSICS / ANALYSIS</div>
              <h2>
                {activeTab === "Dashboard"
                  ? "Investigation Overview"
                  : activeTab}
              </h2>
              <p>
                {activeTab === "Dashboard"
                  ? "Monitor evidence, reconstruct activity and identify suspicious patterns."
                  : activeTab === "Evidence"
                  ? "Manage digital evidence, source information and associated metadata."
                  : activeTab === "Timeline"
                  ? "Explore the chronological sequence of recorded digital events."
                  : activeTab === "Evidence Graph"
                  ? "Visualize event relationships and evidence connections."
                  : "Review findings and evidence correlations generated by Prolog."}
              </p>
            </div>

            <button className="reset-button" onClick={resetInvestigation}>
              <RotateCcw size={15} />
              Reset Demo
            </button>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total Evidence Events</span>
                <div className="stat-icon purple">
                  <Database size={18} />
                </div>
              </div>
              <strong>{events.length.toString().padStart(2, "0")}</strong>
              <small>Events in current investigation</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Timeline Status</span>
                <div className="stat-icon teal">
                  <Activity size={18} />
                </div>
              </div>
              <strong>{events.length > 1 ? "Active" : "Ready"}</strong>
              <small>Chronological event sequence</small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Analysis Status</span>
                <div className="stat-icon orange">
                  <FileSearch size={18} />
                </div>
              </div>
              <strong>{result ? "Complete" : "Pending"}</strong>
              <small>
                {result
                  ? `${result.total_findings} finding(s) generated`
                  : "SWI-Prolog rule evaluation"}
              </small>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Evidence Links</span>
                <div className="stat-icon red">
                  <Link2 size={18} />
                </div>
              </div>
              <strong>{result?.total_correlations ?? "—"}</strong>
              <small>
                {result
                  ? "Prolog correlation matches"
                  : "Awaiting evidence correlation"}
              </small>
            </div>
          </section>

          {activeTab === "Dashboard" && (
            <div className="dashboard-grid">
              <section className="panel evidence-panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">INVESTIGATION INPUT</div>
                    <h3>Evidence Events</h3>
                  </div>
                  <button
                    className="small-action"
                    onClick={() => setActiveTab("Evidence")}
                  >
                    Manage Evidence <ArrowUpRight size={14} />
                  </button>
                </div>

                <div className="mini-event-list">
                {sortedEvents.slice(0, 4).map((event) => (
                    <div className="mini-event" key={event.id}>
                      <div className="event-symbol">
                        {eventIcon(event.event_type)}
                      </div>
                      <div className="mini-event-info">
                        <strong>{eventLabel(event.event_type)}</strong>
                        <span>
                          {event.device} · {event.user}
                        </span>
                      </div>
                      <span className="event-time">T+{event.timestamp}</span>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="empty-state">No evidence events added yet.</div>
                  )}
                </div>

                <button className="add-event-button" onClick={addEvent}>
                  <Plus size={16} /> Add Evidence Event
                </button>
              </section>

              <section className="panel analysis-panel">
                <div className="panel-kicker">LOGICAL ANALYSIS</div>
                <div className="analysis-graphic">
                  <div className="analysis-orbit orbit-one" />
                  <div className="analysis-orbit orbit-two" />
                  <div className="analysis-core">
                    <Shield size={34} />
                  </div>
                </div>
                <h3>Prolog Reasoning Engine</h3>
                <p>
                  Evaluate evidence against logical rules and correlate
                  events by device, user and file.
                </p>
                <button
                  className="analyze-button"
                  onClick={analyzeEvidence}
                  disabled={loading || events.length === 0}
                >
                  {loading ? <span className="spinner" /> : <Play size={16} fill="currentColor" />}
                  {loading ? "Analyzing..." : "Run Investigation"}
                </button>
                <div className="engine-caption">
                  <span className="status-dot" />
                  {systemHealth === "online"
                    ? "Connected to SWI-Prolog"
                    : "Reasoning engine status: " + systemHealth}
                </div>
              </section>

              <section className="panel timeline-panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-kicker">EVENT RECONSTRUCTION</div>
                    <h3>Activity Timeline</h3>
                  </div>
                  <button
                    className="icon-button"
                    onClick={() => setActiveTab("Timeline")}
                  >
                    <ArrowUpRight size={17} />
                  </button>
                </div>
                <Timeline events={sortedEvents.slice(0, 5)} />
              </section>

              <section className="panel result-panel">
                <div className="panel-kicker">LATEST FINDING</div>
                {result ? (
                  <>
                    <div className={`finding-status ${severityClass(result.risk)}`}>
                      {result.risk === "HIGH" ? (
                        <AlertTriangle size={19} />
                      ) : result.risk === "MEDIUM" ? (
                        <Info size={19} />
                      ) : (
                        <CheckCircle2 size={19} />
                      )}
                      {result.risk} PRIORITY
                    </div>
                    <h3>{result.finding}</h3>
                    <p>{result.explanation}</p>
                    <div className="latest-finding-count">
                      {result.total_findings} finding(s) · {result.total_correlations} correlation(s)
                    </div>
                    <button
                      className="text-action"
                      onClick={() => setActiveTab("Reports")}
                    >
                      View full report <ArrowUpRight size={14} />
                    </button>
                  </>
                ) : (
                  <div className="no-result">
                    <div className="no-result-icon">
                      <FileSearch size={23} />
                    </div>
                    <h3>No analysis performed</h3>
                    <p>
                      Run an investigation to generate logical findings and
                      evidence correlations.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "Evidence" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">EVIDENCE MANAGEMENT</div>
                  <h3>Collected Digital Evidence</h3>
                </div>
                <button className="small-action" onClick={addEvent}>
                  <Plus size={15} /> Add Event
                </button>
              </div>

              {events.map((event, index) => (
                <div className="enriched-evidence-card" key={event.id}>
                  <div className="enriched-evidence-heading">
                    <div className="evidence-type">
                      <div className="event-symbol">
                        {eventIcon(event.event_type)}
                      </div>
                      <div>
                        <strong>Evidence #{index + 1}</strong>
                        <span>{eventLabel(event.event_type)}</span>
                      </div>
                    </div>
                    <button
                      className="delete-button"
                      onClick={() => removeEvent(event.id)}
                      aria-label="Remove evidence event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="enriched-evidence-fields">
                    <label>
                      Event Type
                      <select
                        value={event.event_type}
                        onChange={(e) =>
                          updateEvent(event.id, "event_type", e.target.value)
                        }
                      >
                        {eventOptions.map((option) => (
                          <option value={option.value} key={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Timestamp
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={Number.isNaN(event.timestamp) ? "" : event.timestamp}
                        onChange={(e) =>
                          updateEvent(event.id, "timestamp", e.target.value)
                        }
                      />
                    </label>

                    <label>
                      <span><Database size={13} /> Evidence Source</span>
                      <input
                        value={event.source}
                        onChange={(e) =>
                          updateEvent(event.id, "source", e.target.value)
                        }
                        placeholder="e.g. Windows Security Log"
                      />
                    </label>

                    <label>
                      <span><Monitor size={13} /> Device</span>
                      <input
                        value={event.device}
                        onChange={(e) =>
                          updateEvent(event.id, "device", e.target.value)
                        }
                        placeholder="e.g. Office-Laptop-01"
                      />
                    </label>

                    <label>
                      <span><User size={13} /> User</span>
                      <input
                        value={event.user}
                        onChange={(e) =>
                          updateEvent(event.id, "user", e.target.value)
                        }
                        placeholder="e.g. alice"
                      />
                    </label>

                    <label>
                      <span><File size={13} /> File Name</span>
                      <input
                        value={event.file_name}
                        onChange={(e) =>
                          updateEvent(event.id, "file_name", e.target.value)
                        }
                        placeholder="e.g. report.docx"
                      />
                    </label>

                    <label className="metadata-field">
                      Metadata (JSON)
                      <textarea
                        rows={3}
                        value={event.metadata}
                        onChange={(e) =>
                          updateEvent(event.id, "metadata", e.target.value)
                        }
                        placeholder='{"ip_address":"192.168.1.10"}'
                      />
                    </label>
                  </div>
                </div>
              ))}

              {events.length === 0 && (
                <div className="empty-state">
                  No evidence yet. Add an event to begin.
                </div>
              )}

              <div className="evidence-footer">
                <span>{events.length} event(s) added</span>
                <button
                  className="analyze-button compact"
                  onClick={analyzeEvidence}
                  disabled={loading || events.length === 0}
                >
                  {loading ? <span className="spinner" /> : <Play size={15} fill="currentColor" />}
                  {loading ? "Analyzing..." : "Analyze Evidence"}
                </button>
              </div>
            </section>
          )}

          {activeTab === "Timeline" && (
            <section className="panel full-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">CHRONOLOGICAL RECONSTRUCTION</div>
                  <h3>Evidence Activity Timeline</h3>
                </div>
                <span className="timeline-count">{events.length} EVENTS</span>
              </div>
              <Timeline events={sortedEvents} expanded />
              <p className="timeline-note">
                Events are displayed in timestamp order. Their sequence alone
                does not establish causation or identify a person.
              </p>
            </section>
          )}

          {activeTab === "Evidence Graph" && (
            <section className="panel full-panel">
              <EvidenceGraph
                events={events.map(({ id, event_type, timestamp }) => ({
                  id,
                  event_type,
                  timestamp,
                }))}
              />
              <p className="timeline-note">
                The current graph shows chronological event order. Shared
                device, user and file correlations are displayed in Reports.
                A graph connection does not establish causation.
              </p>
            </section>
          )}

          {activeTab === "Reports" && (
            <section className="panel full-panel report-view">
              <div className="panel-header">
                <div>
                  <div className="panel-kicker">ANALYSIS OUTPUT</div>
                  <h3>Investigation Report</h3>
                </div>
                {result && (
                  <span className={`report-risk ${severityClass(result.risk)}`}>
                    {result.risk} PRIORITY
                  </span>
                )}
              </div>

              {result ? (
                <>
                  <div className={`report-banner ${bannerClass(result.risk)}`}>
                    {result.risk === "HIGH" ? (
                      <AlertTriangle size={23} />
                    ) : result.risk === "MEDIUM" ? (
                      <Info size={23} />
                    ) : (
                      <CheckCircle2 size={23} />
                    )}
                    <div>
                      <strong>{result.finding}</strong>
                      <span>Reasoning engine: {result.reasoning_engine}</span>
                    </div>
                  </div>

                  <div className="report-summary-grid">
                    <div className="report-summary-item">
                      <span>Evidence Events</span>
                      <strong>{result.total_events}</strong>
                    </div>
                    <div className="report-summary-item">
                      <span>Logical Findings</span>
                      <strong>{result.total_findings}</strong>
                    </div>
                    <div className="report-summary-item">
                      <span>Evidence Correlations</span>
                      <strong>{result.total_correlations}</strong>
                    </div>
                    <div className="report-summary-item">
                      <span>Overall Priority</span>
                      <strong className={severityClass(result.risk)}>{result.risk}</strong>
                    </div>
                  </div>

                  <h4>Logical Explanation</h4>
                  <p className="report-explanation">{result.explanation}</p>

                  <div className="findings-section-heading">
                    <div>
                      <h4>Detected Findings</h4>
                      <span>Individual rule matches returned by the Prolog engine</span>
                    </div>
                    <span className="finding-total">
                      {result.findings?.length ?? 0} FINDINGS
                    </span>
                  </div>

                  {result.findings?.length ? (
                    <div className="findings-list">
                      {result.findings.map((finding, index) => (
                        <FindingCard
                          finding={finding}
                          index={index}
                          key={`${finding.rule}-${index}`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-findings">
                      <CheckCircle2 size={22} />
                      <div>
                        <strong>No predefined patterns matched</strong>
                        <p>
                          The submitted events did not satisfy any currently
                          configured Prolog rules. This does not establish
                          that the activity was harmless.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="correlations-section">
                    <div className="findings-section-heading">
                      <div>
                        <h4>Evidence Correlations</h4>
                        <span>
                          Events sharing an identified device, user or file
                        </span>
                      </div>
                      <span className="finding-total">
                        {result.correlations?.length ?? 0} LINKS
                      </span>
                    </div>

                    {result.correlations?.length ? (
                      <div className="correlations-list">
                        {result.correlations.map((item, index) => (
                          <CorrelationCard
                            item={item}
                            key={`${item.type}-${index}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="empty-findings">
                        <Link2 size={22} />
                        <div>
                          <strong>No shared identifiers found</strong>
                          <p>
                            No matching device, user or file identifiers were
                            found across different event types.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="report-disclaimer">
                    <AlertTriangle size={17} />
                    <span>
                      This is a rule-based investigative lead, not proof of
                      wrongdoing, data exfiltration, causation or attribution
                      to an individual. Correlations indicate shared context,
                      not causation. Results depend on the completeness and
                      accuracy of submitted evidence.
                    </span>
                  </div>
                </>
              ) : (
                <div className="empty-report">
                  <FileSearch size={35} />
                  <h3>Report not generated</h3>
                  <p>
                    Submit evidence to the Prolog reasoning engine to generate
                    an investigation report.
                  </p>
                  <button
                    className="analyze-button"
                    onClick={analyzeEvidence}
                    disabled={loading || events.length === 0}
                  >
                    {loading ? <span className="spinner" /> : <Play size={15} fill="currentColor" />}
                    {loading ? "Analyzing..." : "Run Investigation"}
                  </button>
                </div>
              )}
            </section>
          )}

          {error && (
            <div className="error-toast">
              <AlertTriangle size={17} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={16} />
              </button>
            </div>
          )}

          <footer className="page-footer">
            <span>FORENSICMIND AI</span>
            <span>Digital evidence · Logical reasoning · Investigation</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function Timeline({
  events,
  expanded = false,
}: {
  events: Evidence[];
  expanded?: boolean;
}) {
  if (events.length === 0) {
    return <div className="empty-state">No timeline events available.</div>;
  }

  return (
    <div className={`timeline ${expanded ? "timeline-expanded" : ""}`}>
      {events.map((event, index) => (
        <div className="timeline-item" key={event.id}>
          <div className="timeline-track">
            <div className="timeline-dot">{eventIcon(event.event_type)}</div>
            {index !== events.length - 1 && <div className="timeline-line" />}
          </div>
          <div className="timeline-content">
            <div>
              <strong>{eventLabel(event.event_type)}</strong>
              <span>
                {event.source} · {event.device} · {event.user}
              </span>
            </div>
            <time>T+{event.timestamp}</time>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
