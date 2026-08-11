# CAPSTONE PRESENTATION SLIDE DECK OUTLINE (20 SLIDES)

## Project Title: Heart Disease Detection using Classification Algorithms
**Category:** Supervised Learning (Classification)  
**Presenter:** Capstone Project Team  

---

### Slide 1: Title & Overview
- **Title:** Heart Disease Detection using Machine Learning Classification
- **Subtitle:** Predictive Risk Stratification, Threshold Tuning, and Explainable AI
- **Key Focus:** Medical Screening, Model Comparison, FastAPI Deployment

### Slide 2: Problem Statement & Motivation
- **Context:** Cardiovascular diseases (CVDs) are the leading cause of global deaths (~17.9M annually).
- **Challenge:** Early screening can prevent adverse cardiac events, but diagnostic resources must be targeted efficiently.
- **Goal:** Develop an accurate, recall-optimized ML classification pipeline to flag high-risk patients early.

### Slide 3: Project Objectives
- Compare 4 supervised algorithms: Decision Tree, Random Forest, Logistic Regression, SVM.
- Evaluate primary metrics: Recall, Precision, F1-Score, ROC-AUC.
- Optimize operating threshold to maximize sensitivity without excessive false alarms.
- Deploy an explainable REST API using FastAPI and Docker.

### Slide 4: Dataset Overview & Schema
- **Dataset Size:** 400 patient records
- **Features:** 13 clinical & diagnostic features
- **Target:** `heart_disease` (0 = No Disease, 1 = Disease Present)
- **Key Features:** Age, Sex, Chest Pain Type, Resting BP, Cholesterol, Max Heart Rate, ST Depression, Thalassemia.

### Slide 5: Exploratory Data Analysis (EDA) — Class Balance
- **Class Balance:** 55.0% Positive (Disease), 45.0% Negative (No Disease).
- **Insight:** Mild class balance allows standard stratified split without synthetic oversampling (SMOTE).

### Slide 6: EDA — Correlation & Key Feature Drivers
- **Top Positive Correlators:** `chest_pain_type`, `st_depression`, `exercise_induced_angina`.
- **Top Negative Correlators:** `max_heart_rate`, `st_slope`.
- **Insight:** Multiple weak-to-moderate signals require non-linear ensemble methods to capture feature interactions.

### Slide 7: Preprocessing & Split Methodology
- **Train/Test Split:** 80% Train (320 samples), 20% Test (80 samples).
- **Stratification:** Preserved 55:45 ratio in both subsets.
- **Scaling:** `StandardScaler` applied for SVM & Logistic Regression; raw features preserved for Decision Tree & Random Forest.

### Slide 8: Model Training Strategy
- **Hyperparameter Optimization:** `GridSearchCV` with **5-fold Stratified Cross-Validation**.
- **Scoring Function:** CV optimized specifically for **Recall** (Sensitivity).

### Slide 9: Model Performance Matrix (Test Set)
- Table showing 6 metrics across 4 models (Decision Tree, Random Forest, Logistic Regression, SVM).
- Highlight Random Forest's **ROC-AUC = 0.7639** and **Accuracy = 67.5%**.

### Slide 10: Model Selection Rationale — Why Random Forest Wins
- **The SVM Trap:** SVM default Recall was 97.7%, but Specificity was only 13.9% (flagged almost everyone).
- **Random Forest Victory:** Highest ROC-AUC (0.764) and strongest baseline balance across all 6 metrics.

### Slide 11: Confusion Matrix & ROC Curve Analysis
- Visual comparison of Confusion Matrices across all 4 models.
- ROC Curve Overlay demonstrating superior area under the curve for Random Forest.

### Slide 12: Decision Threshold Optimization
- **Default Cutoff (0.50):** Recall = 81.82%, Precision = 66.67%.
- **Tuned Cutoff (0.42):** Recall = **95.45%**, Precision = **62.69%**.
- **Clinical Justification:** In medical screening, missing a sick patient (False Negative) carries far worse outcomes than a follow-up test (False Positive).

### Slide 13: Explainable AI (SHAP) — Global Feature Importance
- Global SHAP Summary Plot & Mean |SHAP| Bar Chart.
- Top drivers confirmed: `max_heart_rate`, `age`, `sex`, `st_depression`.

### Slide 14: Explainable AI (SHAP) — Patient-Level Transparency
- Individual patient SHAP waterfall plot demo.
- API returns top 3 patient-specific risk drivers alongside every prediction.

### Slide 15: System Architecture & Deployment Workflow
- Architecture diagram: User Payload -> FastAPI Schema Validation -> Preprocessor -> Random Forest Artifact (0.42 Threshold) -> SHAP Explainer -> JSON Response.

### Slide 16: FastAPI Implementation Details
- Pydantic data validation model (`PatientData`).
- Endpoint structure (`/predict`, `/health`, `/`).
- Automated OpenAPI / Swagger UI generation.

### Slide 17: Containerization with Docker
- Multi-stage Docker build details (`python:3.11-slim`).
- Reproducible environment isolation & zero host dependency.

### Slide 18: Sample API Request & Response
- Live curl payload sample & structured JSON response showing Risk Tier & Recommended Clinical Action.

### Slide 19: Limitations & Future Scope
- **Limitations:** Small dataset size (400 records); synthetic/pedagogical dataset provenance.
- **Future Scope:** Multi-center clinical validation, integration with EHR systems, Tabular Neural Networks.

### Slide 20: Conclusion & Q&A
- **Summary:** Delivered a complete, end-to-end, explainable, and containerized heart disease screening pipeline.
- Open for Questions & Feedback.
