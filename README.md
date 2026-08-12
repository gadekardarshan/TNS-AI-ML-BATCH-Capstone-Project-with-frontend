# Heart Disease Risk Prediction & ML Analytics Dashboard

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.9-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

> **TNS AI/ML Capstone Project — Full-Stack Supervised ML Classification & Clinical Analytics Platform**  
> **GitHub Repository:** [TNS-AI-ML-BATCH-Capstone-Project-with-frontend](https://github.com/gadekardarshan/TNS-AI-ML-BATCH-Capstone-Project-with-frontend)

---

## 📌 Executive Summary & Architecture Overview

This web application extends a supervised machine learning classification pipeline for heart disease detection into a data-driven clinical analytics and decision-support dashboard. 

The system evaluates four candidate classification algorithms (**Decision Tree**, **Random Forest**, **Logistic Regression**, and **SVM**), selecting **Random Forest** (ROC-AUC `0.764`) tuned to a recall-optimized decision threshold of **0.42** (`95.5%` test recall).

```
[ Patient Form (13 Features) ]
             │  HTTP POST /predict
             ▼
[ FastAPI Backend (Python 3.12) ]
             │  Loads models/final_model_artifact.pkl
             ├── Random Forest Inference (Cutoff: 0.42)
             ├── SHAP Feature Attribution (TreeExplainer)
             └── SQLite Assessment Audit Log
             │
             ▼
[ React 18 + TypeScript + Tailwind UI ]
 ├── 1. Overview         (Dataset profile, active model stats, class distribution)
 ├── 2. Predict          (Interactive 13-input form + inline result & SHAP factors)
 ├── 3. Model Comparison (Metrics matrix & interactive chart comparing DT, RF, LogReg, SVM)
 ├── 4. Dataset Insights (EDA correlation rankings & target distribution)
 └── 5. History           (Filterable past audit logs & server-side PDF downloads)
```

---

## 🌟 Key Application Features

### 1. Five Primary Dashboard Sections
1. **Overview:** High-level project specifications (400 records, 13 features), active model metadata (Random Forest, 0.42 threshold), system status, target class balance donut chart (55.5% Disease vs 44.5% No Disease), and deployed model summary.
2. **Predict:** Patient assessment input form split into logical sections (Demographics, Vitals, ECG/Exercise, Structural) with numerical bounds validation, human-readable dropdowns, plain-language tooltips, sample patient auto-fill, file upload, and an immediate desktop 2-column inline result view with SHAP feature impacts.
3. **Model Comparison:** Test-set metric comparison table and interactive Recharts bar chart comparing Decision Tree, Random Forest, Logistic Regression, and SVM across Recall, Precision, F1-Score, ROC-AUC, Specificity, and Accuracy using exact project evaluation outputs.
4. **Dataset Insights:** Exploratory Data Analysis (EDA) visualizations showing target class balance and Pearson correlation rankings (Age: +0.341, Max Heart Rate: -0.328, Resting BP: +0.218, Sex: +0.169, Cholesterol: +0.148).
5. **History:** Filterable database of past patient assessments with direct ReportLab PDF report generation and download.

### 2. Machine Learning Core
- **Dataset:** `data/heart_disease_dataset.csv` (400 patient records, 13 clinical features + 1 target).
- **Selected Model:** Random Forest classifier packaged in `models/final_model_artifact.pkl`.
- **Tuned Decision Threshold:** **0.42** (Sensitivity: `95.45%`, Precision: `62.69%`, F1-Score: `75.68%`).
- **Explainability:** SHAP `TreeExplainer` feature attributions for patient-level risk explanation.

### 3. Server-Side PDF Report Generation
- Renders typeset clinical PDF report cards containing customizable **Patient Name**, Patient Reference ID, Date/Time, risk badges, SHAP factors, and clinical recommendations using **ReportLab**.

---

## 📁 Repository Structure

```
.
├── api/
│   ├── main.py                     # FastAPI web service endpoints
│   ├── validator.py                # ROC-AUC consensus engine & disagreement logic
│   ├── shap_explainer.py           # SHAP TreeExplainer integration for Random Forest
│   ├── database.py                 # SQLite ORM models (User, Assessment) with automatic migration
│   ├── auth.py                     # JWT token authentication helpers
│   ├── pdf_generator.py            # ReportLab server-side PDF engine with Patient Name
│   ├── logger.py                   # Non-PHI audit logging
│   └── tests/                      # Automated unit test suite
├── data/
│   └── heart_disease_dataset.csv   # Reference dataset (400 records, 13 features)
├── frontend/
│   ├── src/
│   │   ├── components/             # React UI components (Navbar, DashboardHome, AssessmentForm, ModelPerformance, DataInsights, PatientHistory)
│   │   ├── data/projectData.ts     # Verified metric & EDA data module
│   │   ├── api/client.ts           # Axios client & PDF downloader
│   │   ├── types/index.ts          # TypeScript interfaces
│   │   ├── App.tsx                 # Tab navigation & root layout
│   │   └── main.tsx                # React entry point
│   ├── Dockerfile                  # Multi-stage frontend Docker build
│   └── package.json                # Frontend npm configuration
├── models/
│   ├── final_model_artifact.pkl    # Deployed Random Forest artifact
│   └── hospital_dashboard.db       # SQLite database file
├── notebooks/                      # Reference ML pipeline (01_eda.py - 07_finalize_model.py)
├── outputs/                        # Plots & metric CSV/JSON summaries
├── Dockerfile                      # Backend Docker containerization
├── docker-compose.yml              # 1-command orchestration for backend + frontend
├── VALIDATOR_LOGIC.md              # Technical validation algorithm specification
├── PROJECT_REPORT.md               # Detailed capstone project report
├── SLIDES_OUTLINE.md               # 20-slide presentation deck
└── README.md                       # Main documentation
```

---

## 🚀 Quickstart Guide

### Option 1: Local Development Startup (Recommended)

#### 1. Start FastAPI Backend
```bash
# From repository root
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Launch FastAPI server on port 8000
python3 -m uvicorn api.main:app --reload --port 8000
```

#### 2. Start React Frontend
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

### Option 2: Docker Compose Startup

```bash
docker compose up --build
```

Access points:
- **Frontend App:** `http://localhost:3000`
- **FastAPI OpenAPI Docs:** `http://localhost:8000/docs`

---

## 📤 How to Push Code to Remote Repository

To push the latest commits to your remote GitHub repository (`https://github.com/gadekardarshan/TNS-AI-ML-BATCH-Capstone-Project-with-frontend.git`):

```bash
git push -u origin main
```

*(If prompted, enter your GitHub Personal Access Token as the password.)*

---

## ⚕️ Regulatory & Academic Disclaimer
This software is an educational research prototype built for capstone evaluation. It is **not** an FDA/CE-cleared medical device. Diagnostic decisions remain the responsibility of qualified medical professionals.
