"""
main.py — FastAPI service for Heart Disease Risk Prediction & Hospital Dashboard.
Extends original API to support multi-model ensemble inference, ROC-AUC consensus validation,
ReportLab PDF report generation, SQLite history persistence, JWT auth, and audit logging.
"""
import os
import time
import json
import uuid
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Request, Response, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .database import init_db, get_db, User, Assessment, pwd_context
from .auth import create_access_token, get_current_user, verify_password
from .validator import evaluate_consensus, get_risk_tier_info, TUNED_THRESHOLD
from .shap_explainer import FeatureExplainer
from .pdf_generator import generate_patient_pdf_report
from .logger import log_prediction_audit

# Directory Setup & Artifact Paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
ARTIFACT_PATH = os.environ.get("ARTIFACT_PATH", str(MODEL_DIR / "final_model_artifact.pkl"))
TRAINED_MODELS_PATH = str(MODEL_DIR / "trained_models.pkl")
SCALER_PATH = str(MODEL_DIR / "scaler.pkl")

# Initialize FastAPI App
app = FastAPI(
    title="Hospital Heart Disease Diagnostic Dashboard API",
    description="Multi-model classification & explainable clinical decision-support API.",
    version="2.0.0",
)

# Enable CORS for Frontend Development & Deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple Rate Limiting Middleware (60 req/min sliding window per IP)
RATE_LIMIT_STORE = {}

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    if request.url.path in ["/predict", "/predict/ensemble"]:
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        timestamps = RATE_LIMIT_STORE.get(client_ip, [])
        # Filter timestamps older than 60s
        timestamps = [t for t in timestamps if now - t < 60]
        if len(timestamps) >= 60:
            return Response(
                content=json.dumps({"detail": "Rate limit exceeded (60 req/min). Please wait."}),
                status_code=429,
                media_type="application/json",
            )
        timestamps.append(now)
        RATE_LIMIT_STORE[client_ip] = timestamps
    return await call_next(request)

# Load Artifacts & Models
print("[STARTUP] Initializing Database & Loading ML Artifacts...")
init_db()

artifact = joblib.load(ARTIFACT_PATH)
primary_rf_model = artifact["model"]
threshold = artifact["threshold"]
feature_names = artifact["feature_names"]
boundaries = artifact["risk_tier_boundaries"]

# Load All 4 Models & Scaler (if available)
try:
    trained_models = joblib.load(TRAINED_MODELS_PATH)
    scaler = joblib.load(SCALER_PATH)
except Exception as e:
    print(f"[STARTUP WARNING] Optional multi-model files unavailable: {e}. Single-model Random Forest mode active.")
    trained_models = None
    scaler = None

shap_explainer = FeatureExplainer(primary_rf_model)


# --- Pydantic Data Validation Schemas ---
class PatientData(BaseModel):
    age: int = Field(..., ge=1, le=120, description="Patient age (1-120)", example=58)
    sex: int = Field(..., ge=0, le=1, description="0 = Female, 1 = Male", example=1)
    chest_pain_type: int = Field(..., ge=0, le=3, description="0 = Typical, 1 = Atypical, 2 = Non-anginal, 3 = Asymptomatic", example=1)
    resting_blood_pressure: int = Field(..., ge=60, le=250, description="Resting BP mm Hg (60-250)", example=130)
    cholesterol: int = Field(..., ge=100, le=600, description="Serum cholesterol mg/dl (100-600)", example=220)
    fasting_blood_sugar: int = Field(..., ge=0, le=1, description="1 if > 120 mg/dl else 0", example=0)
    resting_ecg: int = Field(..., ge=0, le=2, description="0 = Normal, 1 = ST-T wave, 2 = LV hypertrophy", example=1)
    max_heart_rate: int = Field(..., ge=60, le=250, description="Max heart rate bpm (60-250)", example=150)
    exercise_induced_angina: int = Field(..., ge=0, le=1, description="0 = No, 1 = Yes", example=0)
    st_depression: float = Field(..., ge=0.0, le=10.0, description="ST depression (0.0 - 10.0)", example=1.2)
    st_slope: int = Field(..., ge=0, le=2, description="0 = Upsloping, 1 = Flat, 2 = Downsloping", example=1)
    num_major_vessels: int = Field(..., ge=0, le=4, description="Vessels colored by fluoroscopy (0-4)", example=0)
    thalassemia: int = Field(..., ge=0, le=3, description="0 = Normal, 1 = Fixed, 2 = Reversible, 3 = Other", example=2)
    patient_ref: Optional[str] = Field(None, description="Optional custom patient reference code")


class LoginRequest(BaseModel):
    email: str
    password: str


class DoctorNoteRequest(BaseModel):
    doctor_notes: str


# --- Backward Compatible Helpers ---
def get_risk_tier(probability: float) -> dict:
    if probability < boundaries["low_max"]:
        return {"tier": "Low Risk", "action": "Routine annual check-up recommended."}
    elif probability < boundaries["moderate_max"]:
        return {"tier": "Moderate Risk", "action": "Follow-up screening within 3 months advised."}
    elif probability < boundaries["high_max"]:
        return {"tier": "High Risk", "action": "Referral to cardiologist recommended within 2 weeks."}
    else:
        return {"tier": "Very High Risk", "action": "Urgent cardiology referral recommended."}


# --- API Routes ---

@app.get("/")
def root():
    return {
        "service": "Hospital Heart Disease Diagnostic Dashboard API",
        "model": artifact["model_name"],
        "available_models": list(trained_models.keys()) if trained_models else [artifact["model_name"]],
        "decision_threshold": threshold,
        "status": "running",
        "version": "2.0.0",
    }


@app.get("/health")
def health():
    return {"status": "ok", "db": "connected"}


# --- Auth Endpoints ---
@app.post("/auth/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
        }
    }


@app.get("/auth/me")
def get_me(user: User = Depends(get_current_user)):
    return {
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
    }


# --- Original Single-Model Endpoint (Backward Compatible) ---
@app.post("/predict")
def predict(patient: PatientData):
    try:
        data_dict = patient.dict()
        data_dict.pop("patient_ref", None)
        row = pd.DataFrame([data_dict])[feature_names]
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing or mismatched feature: {e}")

    probability = float(primary_rf_model.predict_proba(row)[0, 1])
    prediction = int(probability >= threshold)
    risk = get_risk_tier(probability)

    top_factors = shap_explainer.explain(row, feature_names, top_k=3)

    return {
        "prediction": prediction,
        "prediction_label": "Disease Likely" if prediction == 1 else "Disease Unlikely",
        "probability": round(probability, 4),
        "risk_tier": risk["tier"],
        "recommended_action": risk["action"],
        "decision_threshold_used": threshold,
        "top_contributing_factors": top_factors,
    }


# --- Multi-Model Ensemble Endpoint ---
@app.post("/predict/ensemble")
def predict_ensemble(patient: PatientData, request: Request, db: Session = Depends(get_db)):
    start_time = time.time()
    data_dict = patient.dict()
    custom_ref = data_dict.pop("patient_ref", None)
    patient_ref = custom_ref if custom_ref else f"PAT-{uuid.uuid4().hex[:6].upper()}"

    row_unscaled = pd.DataFrame([data_dict])[feature_names]
    row_scaled = pd.DataFrame(scaler.transform(row_unscaled), columns=feature_names) if scaler is not None else row_unscaled

    model_results = []
    models_dict = trained_models if trained_models else {"Random Forest": primary_rf_model}

    # Run available models with partial-failure try-except handling
    for m_name, m_obj in models_dict.items():
        try:
            # Scaled vs Unscaled input selection
            use_scaled = (m_name in ["Logistic Regression", "SVM"])
            eval_row = row_scaled if use_scaled else row_unscaled

            prob = float(m_obj.predict_proba(eval_row)[0, 1])
            # Use 0.42 tuned threshold for RF, 0.50 for others at base layer
            m_thresh = TUNED_THRESHOLD if m_name == "Random Forest" else 0.50
            pred = int(prob >= m_thresh)
            tier_info = get_risk_tier_info(prob)

            m_res = {
                "model_name": m_name,
                "prediction": pred,
                "prediction_label": "Disease Likely" if pred == 1 else "Disease Unlikely",
                "probability": round(prob, 4),
                "risk_tier": tier_info["tier"],
                "status": "success",
            }

            # Attach SHAP feature factors to Random Forest primary model
            if m_name == "Random Forest":
                m_res["top_contributing_factors"] = shap_explainer.explain(row_unscaled, feature_names, top_k=5)

            model_results.append(m_res)

        except Exception as err:
            model_results.append({
                "model_name": m_name,
                "prediction": 0,
                "prediction_label": "Error",
                "probability": 0.0,
                "risk_tier": "Unknown",
                "status": "error",
                "error_message": str(err),
            })

    # Consensus & Validator Evaluation
    consensus = evaluate_consensus(model_results)

    execution_time_ms = (time.time() - start_time) * 1000

    # Structured Audit Logging
    client_ip = request.client.host if request.client else "unknown"
    log_prediction_audit(data_dict, model_results, consensus, execution_time_ms, client_ip)

    response_payload = {
        "assessment_id": f"ASM-{uuid.uuid4().hex[:8].upper()}",
        "patient_ref": patient_ref,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "input_summary": data_dict,
        "model_results": model_results,
        "consensus": consensus,
        "doctor_notes": "",
    }

    # Persist to SQLite Database
    new_assessment = Assessment(
        id=response_payload["assessment_id"],
        patient_ref=patient_ref,
        input_summary=json.dumps(data_dict),
        model_results=json.dumps(model_results),
        consensus=json.dumps(consensus),
        doctor_notes="",
    )
    db.add(new_assessment)
    db.commit()

    return response_payload


# --- Patient Assessment History Endpoints ---
@app.get("/patients")
def list_patient_assessments(
    search: Optional[str] = None,
    risk_tier: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    query = db.query(Assessment)
    if search:
        query = query.filter(Assessment.patient_ref.icontains(search))

    all_records = query.order_by(Assessment.timestamp.desc()).all()

    # In-memory filter for risk_tier inside consensus JSON
    filtered = []
    for r in all_records:
        consensus_dict = json.loads(r.consensus)
        if risk_tier and consensus_dict.get("risk_tier") != risk_tier:
            continue
        filtered.append({
            "id": r.id,
            "patient_ref": r.patient_ref,
            "timestamp": r.timestamp.isoformat() + "Z",
            "final_label": consensus_dict.get("final_label"),
            "risk_tier": consensus_dict.get("risk_tier"),
            "confidence_score": consensus_dict.get("confidence_score"),
            "agreement_ratio": consensus_dict.get("agreement_ratio"),
            "validator_flag": consensus_dict.get("validator_flag"),
            "doctor_notes": r.doctor_notes,
        })

    total = len(filtered)
    start_idx = (page - 1) * limit
    paginated = filtered[start_idx : start_idx + limit]

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "assessments": paginated,
    }


@app.get("/patients/{assessment_id}")
def get_patient_assessment(assessment_id: str, db: Session = Depends(get_db)):
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment record not found")

    return {
        "assessment_id": record.id,
        "patient_ref": record.patient_ref,
        "timestamp": record.timestamp.isoformat() + "Z",
        "input_summary": json.loads(record.input_summary),
        "model_results": json.loads(record.model_results),
        "consensus": json.loads(record.consensus),
        "doctor_notes": record.doctor_notes or "",
    }


@app.post("/patients/{assessment_id}/notes")
def update_doctor_notes(assessment_id: str, note_req: DoctorNoteRequest, db: Session = Depends(get_db)):
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment record not found")

    record.doctor_notes = note_req.doctor_notes
    db.commit()
    return {"status": "success", "assessment_id": record.id, "doctor_notes": record.doctor_notes}


# --- ReportLab PDF Generation Endpoints ---
@app.post("/report/pdf")
def generate_pdf_report(payload: dict):
    """Generates server-side PDF from an ensemble response payload."""
    patient_ref = payload.get("patient_ref", "PATIENT-REPORT")
    doctor_notes = payload.get("doctor_notes", "")
    pdf_bytes = generate_patient_pdf_report(payload, patient_ref=patient_ref, doctor_notes=doctor_notes)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={patient_ref}_clinical_report.pdf"},
    )


@app.get("/patients/{assessment_id}/pdf")
def get_patient_pdf_by_id(assessment_id: str, db: Session = Depends(get_db)):
    record = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Assessment record not found")

    payload = {
        "patient_ref": record.patient_ref,
        "input_summary": json.loads(record.input_summary),
        "model_results": json.loads(record.model_results),
        "consensus": json.loads(record.consensus),
        "doctor_notes": record.doctor_notes or "",
    }
    pdf_bytes = generate_patient_pdf_report(payload, patient_ref=record.patient_ref, doctor_notes=record.doctor_notes or "")

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={record.patient_ref}_clinical_report.pdf"},
    )
