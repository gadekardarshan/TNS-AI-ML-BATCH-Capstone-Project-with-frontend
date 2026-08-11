# Heart Disease Detection using Classification Algorithms

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.3+-F7931E?style=flat&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-blue)](https://shap.readthedocs.io/)

> **TNS AI/ML Capstone Project 2**  
> A machine learning pipeline and API for early heart disease detection, comparing Decision Trees, Random Forest, Logistic Regression, and Support Vector Machines (SVM). Features hyperparameter tuning via 5-fold Stratified CV, recall-optimized threshold tuning, SHAP explainability, and containerized FastAPI deployment.

---

## 📌 Executive Summary

Heart disease remains one of the leading causes of mortality globally. Early and accurate detection through diagnostic screening can significantly improve patient survival rates and optimize healthcare costs. This project builds and compares multiple supervised classification models to predict the presence of heart disease (`heart_disease`: 0 = No, 1 = Yes) using demographic, clinical, and diagnostic data from 400 patient records.

### Key Highlights
- **Winning Model:** **Random Forest** achieved the highest discrimination capacity (**ROC-AUC = 0.7639**, **Accuracy = 67.5%**, **Specificity = 50.0%** at default threshold).
- **Clinical Decision Threshold Tuning:** Tuned operating threshold from `0.50` to `0.42`, increasing **Recall (Sensitivity) to 95.45%** while keeping **Precision at 62.69%** (minimizing missed diagnoses in screening).
- **Explainable AI (XAI):** Integrated **SHAP TreeExplainer** into the API to return patient-specific top 3 risk factors along with each risk tier recommendation.
- **Production Deployment:** Fully containerized **FastAPI** service serving low-latency inference endpoints with automated OpenAPI docs.

---

## 📁 Repository Structure

```
.
├── api/
│   ├── main.py                     # FastAPI service (/predict, /health, SHAP explanations)
│   └── requirements.txt            # API dependencies
├── data/
│   └── heart_disease_dataset.csv   # 400 records, 13 features + 1 target
├── models/
│   ├── final_model_artifact.pkl    # Packaged RF model + threshold + feature schema
│   ├── tuning_results.json         # Best hyperparameters & CV scores
│   ├── scaler.pkl                  # Fitted StandardScaler
│   ├── splits.pkl                  # 80/20 train/test stratified data
│   ├── trained_models.pkl          # Trained Scikit-Learn model objects
│   └── test_probabilities.pkl      # Saved test set probability predictions
├── notebooks/
│   ├── 01_eda.py                   # Exploratory Data Analysis & visual plots
│   ├── 02_preprocessing.py         # Stratified 80/20 train/test split & scaling
│   ├── 03_model_training.py        # 5-fold CV tuning for DT, RF, LogReg, SVM
│   ├── 04_evaluation.py            # Test evaluation across 6 metrics & ROC curves
│   ├── 05_threshold_tuning.py      # Precision-Recall threshold tuning
│   ├── 06_explainability.py        # SHAP global & patient-level feature explanations
│   └── 07_finalize_model.py        # Packages model artifact for deployment
├── outputs/                        # Saved PNG plots, metrics CSVs & JSON summaries
├── .gitignore                      # Git exclusion rules
├── Dockerfile                      # Containerization recipe for FastAPI service
├── PROJECT_REPORT.md               # Detailed Capstone Project Report
├── SLIDES_OUTLINE.md               # 20-slide presentation content deck
├── README.md                       # Main project documentation
└── requirements.txt                # Full environment dependencies
```

---

## 📊 Dataset & Feature Description

The dataset comprises **400 patient records** with **13 clinical features** and 1 binary class label:

| Feature Name | Description | Value Range / Units |
| :--- | :--- | :--- |
| `age` | Patient age | Years (29–77) |
| `sex` | Biological sex | `0` = Female, `1` = Male |
| `chest_pain_type` | Type of chest pain experienced | `0` = Typical, `1` = Atypical, `2` = Non-anginal, `3` = Asymptomatic |
| `resting_blood_pressure` | Resting blood pressure | mm Hg (94–200) |
| `cholesterol` | Serum cholesterol | mg/dl (126–564) |
| `fasting_blood_sugar` | Fasting blood sugar > 120 mg/dl | `0` = False, `1` = True |
| `resting_ecg` | Resting ECG results | `0` = Normal, `1` = ST-T wave abnormality, `2` = LV hypertrophy |
| `max_heart_rate` | Maximum heart rate achieved | bpm (71–202) |
| `exercise_induced_angina` | Angina induced by exercise | `0` = No, `1` = Yes |
| `st_depression` | ST depression induced by exercise relative to rest | Float (0.0–6.2) |
| `st_slope` | Slope of peak exercise ST segment | `0` = Upsloping, `1` = Flat, `2` = Downsloping |
| `num_major_vessels` | Number of major vessels colored by fluoroscopy | `0`–`4` |
| `thalassemia` | Thalassemia condition type | `0` = Normal, `1` = Fixed defect, `2` = Reversible defect, `3` = Other |
| **`heart_disease`** | **Target Variable** | **`0` = No Disease, `1` = Disease Present** |

---

## 📈 Model Performance & Comparison

All 4 models were tuned using **5-fold Stratified Cross-Validation** (optimizing Recall) and evaluated on the held-out **80-patient test set** (20%):

| Algorithm | Recall (Sensitivity) 🎯 | Precision | F1-Score | ROC-AUC 🏆 | Specificity | Accuracy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Decision Tree** | 0.8636 | 0.6333 | 0.7308 | 0.6682 | 0.3889 | 0.6500 |
| **Random Forest (Selected)** | **0.8182** | **0.6667** | **0.7347** | **0.7639** | **0.5000** | **0.6750** |
| **Logistic Regression** | 0.8182 | 0.6429 | 0.7200 | 0.7386 | 0.4444 | 0.6500 |
| **SVM (RBF Kernel)** | 0.9773 | 0.5811 | 0.7288 | 0.7279 | 0.1389 | 0.6000 |

### 🎯 Threshold Optimization (Random Forest)

To prioritize patient safety in clinical screening, the decision threshold was tuned from `0.50` to `0.42`:
- **Default Threshold (0.50):** Recall = **81.82%**, Precision = **66.67%**
- **Tuned Threshold (0.42):** Recall = **95.45%**, Precision = **62.69%**, Specificity = **44.44%**

> **Clinical Rationale:** In screening, a False Negative (missing a diseased patient) carries severe consequences. Lowering the threshold to 0.42 catches **95.5% of all positive cases** while maintaining Precision above 60%.

---

## ⚡ Quickstart Guide

### 1. Prerequisites & Installation
```bash
# Clone the repository
git clone https://github.com/gadekardarshan/TNS-AI-ML-BATCH-Capstone-Project-without-frontend.git
cd TNS-AI-ML-BATCH-Capstone-Project-without-frontend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Pipeline Scripts
```bash
python3 notebooks/01_eda.py
python3 notebooks/02_preprocessing.py
python3 notebooks/03_model_training.py
python3 notebooks/04_evaluation.py
python3 notebooks/05_threshold_tuning.py
python3 notebooks/06_explainability.py
python3 notebooks/07_finalize_model.py
```

### 3. Launch Local FastAPI Service
```bash
python3 -m uvicorn api.main:app --reload --port 8000
```
Interactive Swagger API documentation will be available at: **`http://localhost:8000/docs`**

---

## 🐳 Docker Deployment

### Build & Run Container
```bash
# Build the Docker image
docker build -t heart-disease-api .

# Run the container on port 8000
docker run -d -p 8000:8000 --name heart-disease-service heart-disease-api
```

### Example API Request (`/predict`)
```bash
curl -X 'POST' \
  'http://localhost:8000/predict' \
  -H 'Content-Type: application/json' \
  -d '{
  "age": 58,
  "sex": 1,
  "chest_pain_type": 1,
  "resting_blood_pressure": 130,
  "cholesterol": 220,
  "fasting_blood_sugar": 0,
  "resting_ecg": 1,
  "max_heart_rate": 150,
  "exercise_induced_angina": 0,
  "st_depression": 1.2,
  "st_slope": 1,
  "num_major_vessels": 0,
  "thalassemia": 2
}'
```

### Sample JSON Response
```json
{
  "prediction": 1,
  "prediction_label": "Disease Likely",
  "probability": 0.5421,
  "risk_tier": "High Risk",
  "recommended_action": "Referral to cardiologist recommended within 2 weeks.",
  "decision_threshold_used": 0.42,
  "top_contributing_factors": [
    {
      "feature": "max_heart_rate",
      "impact": 0.0842,
      "direction": "increases risk"
    },
    {
      "feature": "age",
      "impact": 0.0615,
      "direction": "increases risk"
    },
    {
      "feature": "sex",
      "impact": 0.0431,
      "direction": "increases risk"
    }
  ]
}
```

---

## 📑 Additional Documentation
- 📖 **[Detailed Project Report](PROJECT_REPORT.md)** — In-depth methodology, literature background, EDA analysis, and metric breakdowns.
- 📺 **[Presentation Slides Outline](SLIDES_OUTLINE.md)** — 20-slide slide-by-slide structure for academic & stakeholder presentations.

---

## 👥 Authors & Acknowledgments
- **Project Title:** Heart Disease Detection using Classification Algorithms
- **Category:** Supervised Machine Learning (Classification)
- **Domain:** Healthcare AI / Medical Diagnostic Screening
