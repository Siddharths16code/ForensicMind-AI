
import json
from pathlib import Path
from uuid import uuid4
from typing import Literal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pyswip import Prolog


app = FastAPI(
    title="ForensicMind AI",
    description="Prolog-based Digital Forensics Reasoning System",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RULES = (
    Path(__file__).resolve().parents[2]
    / "prolog_engine"
    / "rules.pl"
)

EventType = Literal[
    "login",
    "file_modified",
    "usb_connected",
    "file_transfer"
]


class Evidence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    event_type: EventType
    timestamp: int = Field(ge=0)

    source: str = Field(default="Unknown", max_length=200)
    device: str = Field(default="Unknown", max_length=200)
    user: str = Field(default="Unknown", max_length=200)
    file_name: str = Field(default="Unknown", max_length=500)

    metadata: dict[str, str] = Field(default_factory=dict)


class Investigation(BaseModel):
    events: list[Evidence]


def get_matches(prolog, query):
    return list(prolog.query(query))


def prolog_string(value: str) -> str:
    """Safely encode user-provided text as a Prolog string."""
    return json.dumps(value, ensure_ascii=False)


def add_finding(findings, rule, title, severity, description, matches):
    if matches:
        findings.append({
            "rule": rule,
            "title": title,
            "severity": severity,
            "description": description,
            "matched_events": matches
        })


@app.get("/")
def home():
    return {
        "message": "ForensicMind AI is running",
        "version": "3.0.0",
        "reasoning_engine": "SWI-Prolog"
    }


@app.get("/api/health")
def health():
    try:
        if not RULES.exists():
            raise FileNotFoundError("Prolog rules file not found")

        prolog = Prolog()
        prolog.consult(str(RULES))
        list(prolog.query("true"))

        return {
            "status": "healthy",
            "api": "online",
            "reasoning_engine": "SWI-Prolog",
            "prolog": "available",
            "rules_file": True
        }

    except Exception as exc:
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "api": "online",
                "reasoning_engine": "unavailable",
                "prolog": "unavailable",
                "rules_file": RULES.exists(),
                "error": str(exc)
            }
        )


@app.post("/api/analyze")
def analyze(data: Investigation):

    prolog = Prolog()
    prolog.consult(str(RULES))

    # Clear facts for this investigation
    list(prolog.query("retractall(event(_, _))"))
    list(prolog.query("retractall(evidence_event(_, _, _, _, _, _, _, _))"))

    evidence_records = []

    # Insert evidence into Prolog
    for item in data.events:

        evidence_records.append({
            "id": item.id,
            "event_type": item.event_type,
            "timestamp": item.timestamp,
            "source": item.source,
            "device": item.device,
            "user": item.user,
            "file_name": item.file_name,
            "metadata": item.metadata
        })

        # Preserve original event facts for existing rules
        prolog.assertz(
            f"event({item.event_type},{item.timestamp})"
        )

        # Insert enriched evidence facts
        metadata_json = json.dumps(
            item.metadata,
            ensure_ascii=False
        )

        fact = (
            f"evidence_event("
            f"{prolog_string(item.id)},"
            f"{item.event_type},"
            f"{item.timestamp},"
            f"{prolog_string(item.source)},"
            f"{prolog_string(item.device)},"
            f"{prolog_string(item.user)},"
            f"{prolog_string(item.file_name)},"
            f"{prolog_string(metadata_json)}"
            f")"
        )

        prolog.assertz(fact)

    findings = []

    # RULE 1: Complete suspicious chronological sequence
    matches = get_matches(
        prolog,
        "suspicious_sequence(T1,T2,T3,T4)"
    )

    add_finding(
        findings,
        "suspicious_sequence",
        "Complete Suspicious Event Sequence",
        "HIGH",
        "Login, file modification, USB connection and file transfer occurred in chronological order.",
        matches
    )

    # RULE 2: Repeated login activity
    matches = get_matches(
        prolog,
        "repeated_login(T1,T2)"
    )

    add_finding(
        findings,
        "repeated_login",
        "Repeated Login Activity",
        "MEDIUM",
        "Multiple login events were recorded in the supplied evidence.",
        matches
    )

    # RULE 3: Repeated file modifications
    matches = get_matches(
        prolog,
        "repeated_file_modification(T1,T2)"
    )

    add_finding(
        findings,
        "repeated_file_modification",
        "Repeated File Modifications",
        "MEDIUM",
        "Multiple file modification events were recorded.",
        matches
    )

    # RULE 4: USB followed by file transfer
    matches = get_matches(
        prolog,
        "usb_transfer_pattern(T1,T2)"
    )

    add_finding(
        findings,
        "usb_transfer_pattern",
        "USB Followed by File Transfer",
        "MEDIUM",
        "A USB connection was followed by a file transfer event.",
        matches
    )

    # RULE 5: Transfer without preceding USB event
    matches = get_matches(
        prolog,
        "transfer_without_prior_usb(T)"
    )

    add_finding(
        findings,
        "transfer_without_prior_usb",
        "Transfer Without Preceding USB Event",
        "MEDIUM",
        "A file transfer was recorded without a preceding USB connection event in the supplied evidence.",
        matches
    )

    # EVIDENCE CORRELATION 1: Same device
    device_matches = get_matches(
        prolog,
        "same_device_activity(T1,T2,Type1,Type2,Device)"
    )

    # EVIDENCE CORRELATION 2: Same user
    user_matches = get_matches(
        prolog,
        "same_user_activity(T1,T2,Type1,Type2,User)"
    )

    # EVIDENCE CORRELATION 3: Same file
    file_matches = get_matches(
        prolog,
        "same_file_activity(T1,T2,Type1,Type2,File)"
    )

    correlations = []

    for match in device_matches:
        correlations.append({
            "type": "same_device",
            "description": "Events are associated with the same device.",
            "matched_events": match
        })

    for match in user_matches:
        correlations.append({
            "type": "same_user",
            "description": "Events are associated with the same user.",
            "matched_events": match
        })

    for match in file_matches:
        correlations.append({
            "type": "same_file",
            "description": "Events are associated with the same file.",
            "matched_events": match
        })

    # Overall risk: based on predefined investigation rules only
    if any(f["severity"] == "HIGH" for f in findings):
        risk = "HIGH"
    elif findings:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    if risk == "HIGH":
        summary = "A complete predefined suspicious sequence was identified."
    elif risk == "MEDIUM":
        summary = "One or more events require further investigation."
    else:
        summary = "No predefined suspicious pattern was identified."

    return {
        "risk": risk,
        "finding": summary,
        "reasoning_engine": "SWI-Prolog",
        "total_events": len(data.events),
        "total_findings": len(findings),
        "total_correlations": len(correlations),
        "findings": findings,
        "correlations": correlations,
        "evidence_records": evidence_records,
        "explanation": (
            "Results are based on predefined logical rules and "
            "evidence correlations. Correlations show shared "
            "context, not causation. Findings are investigative "
            "leads, not proof of wrongdoing."
        )
    }
