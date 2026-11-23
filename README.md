# ForensicMind AI

### Digital Forensics Investigation & Reasoning System

ForensicMind AI is a rule-based digital forensics investigation platform that analyzes digital evidence events, identifies predefined suspicious activity patterns, correlates related evidence, and presents explainable investigative findings using SWI-Prolog.

**Live Application:** https://forensic-mind-ai.vercel.app

**Backend API:** https://forensicmind-api.onrender.com

**Health Check:** https://forensicmind-api.onrender.com/api/health

---

## Overview

Digital investigations often involve multiple evidence sources, devices, users, and file activities. Examining these events individually can make it difficult to identify meaningful patterns.

ForensicMind AI provides a centralized interface to:

- Ingest digital evidence events.
- Examine event sequences and timelines.
- Apply logical forensic rules using SWI-Prolog.
- Identify predefined suspicious activity patterns.
- Correlate events through shared device, user, and file attributes.
- Present findings with explanations.
- Visualize evidence and generate investigation reports.

The system is designed as an explainable, rule-based reasoning application rather than a machine-learning classifier.

## Features

### 1. Evidence Management
- Add and analyze structured digital evidence events.
- Record event type, timestamp, source, device, user, and file information.
- Attach additional metadata to evidence records.

### 2. Prolog-Based Reasoning
The reasoning engine uses SWI-Prolog to evaluate predefined rules, including:

- Suspicious chronological activity sequences.
- Repeated login activity.
- Repeated file modifications.
- USB connection and file transfer patterns.
- File transfers without a preceding USB connection in the submitted evidence.

### 3. Evidence Correlation
Identifies relationships between events using shared:

- Device identifiers.
- User identifiers.
- File names.

These relationships provide investigative context and are not proof of common ownership or malicious intent.

### 4. Investigation Timeline
Displays evidence events in chronological order to help investigators understand the sequence of recorded activities.

### 5. Evidence Graph
Provides a visual representation of the submitted investigation events.

### 6. Findings and Reports
Presents rule-based findings, risk classifications, evidence correlations, and reasoning explanations.

### 7. System Health Monitoring
Checks backend availability and SWI-Prolog reasoning engine status.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI | CSS, Lucide React |
| Evidence Visualization | XYFlow |
| Backend | Python, FastAPI |
| Data Validation | Pydantic |
| Reasoning Engine | SWI-Prolog |
| Python Integration | PySwip |
| Containerization | Docker |
| Backend Hosting | Render |
| Frontend Hosting | Vercel |
| Version Control | Git, GitHub |

## Architecture

Browser / React Frontend
        |
        | HTTP API Requests
        v
FastAPI Backend
        |
        | Evidence Validation
        v
PySwip Integration
        |
        v
SWI-Prolog Reasoning Engine
        |
        | Rule Evaluation
        v
Findings and Correlations
        |
        v
Frontend Visualization

## Supported Evidence Event Types

| Event Type | Description |
|---|---|
| login | User login activity |
| file_modified | File modification activity |
| usb_connected | USB device connection |
| file_transfer | File transfer activity |

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| /api/health | GET | Backend and Prolog health status |
| /api/analyze | POST | Analyze submitted evidence events |
| /openapi.json | GET | API schema |

### Example Analysis Request

Submit an investigation containing an events array to `/api/analyze`.

Each event supports:

- id
- event_type
- timestamp
- source
- device
- user
- file_name
- metadata

The required fields are `event_type` and `timestamp`. Other fields have defaults.

## Local Installation

### Prerequisites

- Python 3.13
- Node.js and npm
- SWI-Prolog
- Git

### 1. Clone the repository

    git clone https://github.com/Siddharths16code/ForensicMind-AI.git
    cd ForensicMind-AI

### 2. Install SWI-Prolog

On macOS with Homebrew:

    brew install swi-prolog

Verify the installation:

    swipl --version

### 3. Start the backend

    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
    uvicorn app.main:app --reload --port 8000

Run the final command from the backend directory. If you are already in the project root, use:

    cd backend
    uvicorn app.main:app --reload --port 8000

### 4. Start the frontend

Open a separate terminal:

    cd ForensicMind-AI/frontend
    npm install
    npm run dev

### 5. Configure the frontend API

Create a `.env` file inside the frontend directory and set:

    VITE_https://forensicmind-api.onrender.com=YOUR_BACKEND_https://forensicmind-api.onrender.com

For local development, use your local FastAPI server address.

Restart the Vite development server after changing environment variables.

## Docker Deployment

A Dockerfile is provided at the project root.

Build the backend image:

    docker build -t forensicmind-api .

Run the container:

    docker run --rm -p 8000:8000 forensicmind-api

Check the health endpoint to verify backend and SWI-Prolog availability.

## Deployment

The project is deployed using:

- **Frontend:** Vercel
- **Backend:** Render
- **Container:** Docker
- **Source Code:** GitHub

The frontend connects to the backend through the `VITE_https://forensicmind-api.onrender.com` environment variable.

## Important Limitations

- The current application uses predefined logical rules; it does not use a trained machine-learning model.
- Evidence is processed in memory. Persistent database storage is not currently implemented.
- Submitted evidence is not retained as a permanent forensic case record.
- The evidence graph is a visualization of investigation events, not a verified causal or ownership graph.
- Correlations indicate shared attributes, not proof of identity, access, or wrongdoing.
- A missing event in the submitted dataset does not establish that the event never occurred.
- Findings are investigative leads and require independent verification using original forensic evidence.

ForensicMind AI is an academic and demonstrative investigation-support project. It is not a replacement for validated forensic acquisition, chain-of-custody procedures, or professional forensic examination.

## Future Improvements

- Persistent investigation and evidence storage.
- Evidence integrity verification using cryptographic hashes.
- File-based evidence ingestion.
- More advanced temporal and contextual reasoning.
- Investigation case management.
- Exportable forensic reports.
- Automated test coverage and API security improvements.

## Author

**Siddharth**

B.Tech Computer Science and Engineering

GitHub: [Siddharths16code](https://github.com/Siddharths16code)

Project: ForensicMind AI

---

*Built as an academic project exploring digital forensics, knowledge representation, logical reasoning, and explainable investigation systems.*
