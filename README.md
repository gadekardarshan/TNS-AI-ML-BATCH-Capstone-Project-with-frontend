# St. Jude Hospital — Clinical Heart Disease Diagnostic Dashboard & Multi-Model Ensemble API

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

> **TNS AI/ML Capstone Project 2 — Production Dashboard Extension**  
> A full-stack, multi-model clinical decision-support web application for cardiologists. Runs four base machine learning classifiers simultaneously (Decision Tree, Random Forest, Logistic Regression, SVM), reconciles outputs via an ROC-AUC weighted clinical validator, computes SHAP feature attributions, persists patient assessment history to SQLite, and generates server-side typeset ReportLab PDF reports.

---

## 📌 Features & Architecture Overview

### 1. Multi-Model Ensemble & Clinical Consensus Engine
- **Base Classifiers:** Evaluates **Decision Tree**, **Random Forest**, **Logistic Regression**, and **SVM** concurrently.
- **ROC-AUC Voting Weights:** Models weighted by test-set ROC-AUC scores (Random Forest: `0.7639`, Logistic Regression: `0.7386`, SVM: `0.7279`, Decision Tree: `0.6682`).
- **Disagreement Warning Flag:** Sets `validator_flag = "review_recommended"` and surfaces a warning banner if models split (agreement ratio $\le 0.50$) or probability spread exceeds `0.40`.
- **Tuned Threshold (0.42):** Applies tuned cutoff (`0.42`) and risk-tier boundaries (`<0.35` Low, `0.35-0.42` Moderate, `0.42-0.75` High, `≥0.75` Very High).
- **Partial-Failure Resilience:** Gracefully handles single-model errors without failing the overall diagnostic request.

### 2. Frontend Hospital Dashboard
- **React 18 + TypeScript + Vite + Tailwind CSS + Recharts**.
- **Physician Sign-In:** JWT authentication with pre-seeded demo account (`doctor@hospital.org` / `Doctor123!`).
- **Validated 13-Input Form:** Grouped logically into Demographics, Vitals, ECG/Exercise Test, and Structural indicators. Includes helper text, human-readable dropdowns, "Load Sample Patient" demo button, and CSV/JSON upload.
- **Live Execution Stepper:** Real-time animated progress sequence showing model execution steps.
- **Interactive Report Card Modal:** Color-coded risk badges (Green/Yellow/Orange/Red), 2-column input summary, per-model breakdown table with disagreement indicators, SHAP horizontal bar chart, recommended clinical action callout, doctor notes auto-save, and medical decision-support disclaimer.
- **Patient History:** Searchable & filterable database of past patient assessments with direct PDF download buttons.

### 3. Server-Side PDF Report Generation
- Server-side PDF engine (`api/pdf_generator.py`) using **ReportLab** producing typeset clinical documents matching the UI design layout.

---

## 📁 Repository Structure

```
.
├── api/
│   ├── main.py                     # FastAPI service (/predict/ensemble, /auth/login, /patients, /report/pdf)
│   ├── validator.py                # ROC-AUC weighted clinical consensus engine & disagreement flagging
│   ├── shap_explainer.py           # SHAP TreeExplainer integration for Random Forest
│   ├── database.py                 # SQLite ORM models (User, Assessment) & pre-seeded doctor user
│   ├── auth.py                     # JWT token authentication & bcrypt password hashing
│   ├── pdf_generator.py            # ReportLab server-side PDF generator
│   ├── logger.py                   # Structured audit logger (anonymized input hash, no raw PHI)
│   ├── requirements.txt            # Backend dependencies
│   └── tests/
│       └── test_validator.py       # Automated unit test suite for validator logic
├── data/
│   └── heart_disease_dataset.csv   # 400 patient records, 13 features + 1 target
├── frontend/
│   ├── src/
│   │   ├── components/             # React components (Navbar, LoginForm, DashboardHome, AssessmentForm, LiveProgress, ReportCardModal, PatientHistory)
│   │   ├── api/client.ts           # Axios API client with JWT header injection & PDF blob downloader
│   │   ├── types/index.ts          # TypeScript interfaces
│   │   ├── App.tsx                 # Root application component
│   │   └── main.tsx                # Entry point
│   ├── Dockerfile                  # Multi-stage NGINX build
│   └── package.json                # Frontend dependencies
├── models/
│   ├── final_model_artifact.pkl    # Deployed Random Forest model artifact
│   ├── trained_models.pkl          # Dict containing all 4 trained model objects
│   ├── scaler.pkl                  # Fitted StandardScaler
│   ├── splits.pkl                  # Stratified 80/20 train/test split
│   └── hospital_dashboard.db       # SQLite database file
├── notebooks/                      # Pipeline scripts (01_eda.py - 07_finalize_model.py)
├── outputs/                        # Plots & metric summaries
├── Dockerfile                      # Backend Docker containerization
├── docker-compose.yml              # 1-command orchestration for backend + frontend
├── VALIDATOR_LOGIC.md              # Technical validation algorithm specification
├── PROJECT_REPORT.md               # Capstone project report
├── SLIDES_OUTLINE.md               # 20-slide presentation deck
└── README.md                       # Main documentation
```

---

## ⚡ Quickstart Guide

### Option 1: Unified 1-Command Startup with Docker Compose (Recommended)

```bash
# Build and start backend (port 8000) and frontend (port 3000)
docker compose up --build
```
Access the application at:
- **Frontend Dashboard:** `http://localhost:3000`
- **FastAPI OpenAPI Docs:** `http://localhost:8000/docs`
- **Demo Physician Credentials:** `doctor@hospital.org` / `Doctor123!`

---

### Option 2: Local Manual Startup

#### 1. Start FastAPI Backend
```bash
# From repository root
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run backend API
python3 -m uvicorn api.main:app --reload --port 8000
```

#### 2. Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Verification & Test Suite

Run the automated validator unit test suite:
```bash
PYTHONPATH=. python3 -c "import api.tests.test_validator as tv; tv.test_2_2_model_split_triggers_validator_warning(); tv.test_high_probability_spread_triggers_warning(); tv.test_unanimous_consensus_no_warning(); tv.test_risk_tier_boundaries_at_0_42_threshold(); tv.test_partial_model_failure_handling(); print('ALL VALIDATOR TESTS PASSED 100%!')"
```

---

## 📜 API Documentation Summary

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/login` | Physician login returning JWT token | ❌ |
| `GET` | `/auth/me` | Fetch active user profile | ✅ |
| `POST` | `/predict/ensemble` | Runs 4 base models, SHAP, validator consensus & persists history | ❌/Optional |
| `POST` | `/predict` | Original single-model endpoint (backward compatible) | ❌ |
| `GET` | `/patients` | List past patient assessments (searchable/filterable) | ❌ |
| `GET` | `/patients/{id}` | Fetch full detail of single assessment | ❌ |
| `POST` | `/patients/{id}/notes` | Update physician clinical notes | ❌ |
| `POST` | `/report/pdf` | Generate & download typeset ReportLab PDF report | ❌ |
| `GET` | `/patients/{id}/pdf` | Download PDF report by assessment ID | ❌ |
| `GET` | `/health` | Health check endpoint | ❌ |

---

## ⚕️ Regulatory & Medical Disclaimer
This software is a research prototype decision-support tool designed for demonstration and educational purposes. It is **not** an FDA/CE-cleared primary diagnostic device. Final diagnostic decisions and patient management remain the sole responsibility of the attending licensed physician.
