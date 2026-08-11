"""
main.py — FastAPI service for Heart Disease Risk Prediction.
Loads the finalized Random Forest model, applies the tuned decision threshold,
returns a risk tier + SHAP-based explanation for each prediction.
"""
import os
import joblib
import numpy as np
import pandas as pd
import shap
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_ARTIFACT_PATH = str(BASE_DIR / "models" / "final_model_artifact.pkl")

ARTIFACT_PATH = os.environ.get("ARTIFACT_PATH", DEFAULT_ARTIFACT_PATH)

app = FastAPI(
    title="Heart Disease Risk Prediction API",
    description="Predicts heart disease risk from patient clinical data using a tuned Random Forest classifier.",
    version="1.0.0",
)

artifact = joblib.load(ARTIFACT_PATH)
model = artifact["model"]
threshold = artifact["threshold"]
feature_names = artifact["feature_names"]
boundaries = artifact["risk_tier_boundaries"]
explainer = shap.TreeExplainer(model)


class PatientData(BaseModel):
    age: int = Field(..., ge=1, le=120, example=58)
    sex: int = Field(..., ge=0, le=1, description="1 = Male, 0 = Female", example=1)
    chest_pain_type: int = Field(..., ge=0, le=3, example=1)
    resting_blood_pressure: int = Field(..., ge=60, le=250, example=130)
    cholesterol: int = Field(..., ge=100, le=600, example=220)
    fasting_blood_sugar: int = Field(..., ge=0, le=1, description="1 if > 120 mg/dl else 0", example=0)
    resting_ecg: int = Field(..., ge=0, le=2, example=1)
    max_heart_rate: int = Field(..., ge=60, le=250, example=150)
    exercise_induced_angina: int = Field(..., ge=0, le=1, example=0)
    st_depression: float = Field(..., ge=0, le=10, example=1.2)
    st_slope: int = Field(..., ge=0, le=2, example=1)
    num_major_vessels: int = Field(..., ge=0, le=4, example=0)
    thalassemia: int = Field(..., ge=0, le=3, example=2)


def get_risk_tier(probability: float) -> dict:
    if probability < boundaries["low_max"]:
        return {"tier": "Low Risk", "action": "Routine annual check-up recommended."}
    elif probability < boundaries["moderate_max"]:
        return {"tier": "Moderate Risk", "action": "Follow-up screening within 3 months advised."}
    elif probability < boundaries["high_max"]:
        return {"tier": "High Risk", "action": "Referral to cardiologist recommended within 2 weeks."}
    else:
        return {"tier": "Very High Risk", "action": "Urgent cardiology referral recommended."}


@app.get("/")
def root():
    return {
        "service": "Heart Disease Risk Prediction API",
        "model": artifact["model_name"],
        "decision_threshold": threshold,
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(patient: PatientData):
    try:
        row = pd.DataFrame([patient.dict()])[feature_names]
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing or mismatched feature: {e}")

    probability = float(model.predict_proba(row)[0, 1])
    prediction = int(probability >= threshold)
    risk = get_risk_tier(probability)

    shap_values = explainer.shap_values(row)
    sv = shap_values[1][0] if isinstance(shap_values, list) else (
        shap_values[0, :, 1] if shap_values.ndim == 3 else shap_values[0]
    )
    top_factors = sorted(
        zip(feature_names, sv), key=lambda x: abs(x[1]), reverse=True
    )[:3]

    return {
        "prediction": prediction,
        "prediction_label": "Disease Likely" if prediction == 1 else "Disease Unlikely",
        "probability": round(probability, 4),
        "risk_tier": risk["tier"],
        "recommended_action": risk["action"],
        "decision_threshold_used": threshold,
        "top_contributing_factors": [
            {"feature": f, "impact": round(float(v), 4), "direction": "increases risk" if v > 0 else "decreases risk"}
            for f, v in top_factors
        ],
    }
