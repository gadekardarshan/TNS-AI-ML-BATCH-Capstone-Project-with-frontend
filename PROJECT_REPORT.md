# CAPSTONE PROJECT REPORT

# Heart Disease Detection using Classification Algorithms

**Category:** Supervised Machine Learning (Classification)  
**Domain:** Healthcare Analytics & Clinical Predictive Screening  
**Tools & Technologies:** Python, Pandas, NumPy, Matplotlib, Seaborn, Scikit-Learn, SciPy, SHAP, FastAPI, Docker  

---

## 1. Executive Summary

Heart disease remains the leading cause of global mortality, accounting for millions of deaths annually. Diagnostic screening models powered by machine learning offer an opportunity to catch early-stage cardiovascular risks before clinical complications manifest. 

This project developed, evaluated, and deployed a machine learning solution to predict the presence of heart disease (`heart_disease`: 0 = No, 1 = Yes) using clinical, demographic, and diagnostic features from 400 patient records. Four core classification algorithms—Decision Trees, Random Forest, Logistic Regression, and Support Vector Machines (SVM)—were trained using 5-fold Stratified Cross-Validation on an 80% training set and evaluated on an 80-patient held-out test set (20%).

**Key Project Outcomes:**
- **Selected Model:** **Random Forest** achieved the highest overall discrimination performance with a **ROC-AUC of 0.7639**, **Accuracy of 67.50%**, and **F1-Score of 0.7347** at default threshold.
- **Threshold Optimization:** Lowered the decision cutoff from `0.50` to `0.42`, increasing **Recall (Sensitivity) to 95.45%** while maintaining **Precision at 62.69%**, aligning with clinical screening goals to minimize false negatives.
- **Explainability Integration:** Utilized **SHAP (SHapley Additive exPlanations)** to extract global feature rankings and deliver patient-specific factor breakdowns per prediction.
- **Production API & Deployment:** Containerized a **FastAPI** service serving low-latency REST endpoints with automated validation and risk tier stratification (`Low`, `Moderate`, `High`, `Very High`).

---

## 2. Problem Statement & Objectives

### 2.1 Problem Context
Diagnostic screening procedures for heart disease often involve multi-step tests. Machine learning models can analyze non-invasive diagnostic indicators to highlight patients who require urgent follow-up care, reducing diagnostic delays and healthcare system expenditure.

### 2.2 Objectives
1. **Model Development:** Develop and hyperparameter-tune 4 supervised classification models (Decision Tree, Random Forest, Logistic Regression, SVM).
2. **Metric Evaluation:** Evaluate models across both primary metrics (Recall, Precision, F1-Score, ROC-AUC) and secondary metrics (Specificity, Accuracy).
3. **Threshold Tuning:** Justify and select an optimal operating threshold to maximize Recall without unacceptable losses in Precision.
4. **Explainable Predictions:** Implement SHAP explainability to clarify key clinical features driving model predictions.
5. **REST API & Containerization:** Deploy the tuned model via FastAPI and containerize it using Docker.

---

## 3. Dataset & Preprocessing

### 3.1 Dataset Profile
- **Total Records:** 400 patients
- **Total Features:** 13 predictive features + 1 binary target label (`heart_disease`)
- **Missing Values:** 0 missing values (complete dataset)
- **Target Distribution:** 55.0% Class 1 (Disease Present), 45.0% Class 0 (No Disease Present)

### 3.2 Feature Dictionary
1. `age`: Age in years
2. `sex`: Biological sex (0 = Female, 1 = Male)
3. `chest_pain_type`: Chest pain type (0–3)
4. `resting_blood_pressure`: Resting blood pressure in mm Hg
5. `cholesterol`: Serum cholesterol in mg/dl
6. `fasting_blood_sugar`: Fasting blood sugar > 120 mg/dl (0 = False, 1 = True)
7. `resting_ecg`: Resting electrocardiographic results (0–2)
8. `max_heart_rate`: Maximum heart rate achieved during exercise (bpm)
9. `exercise_induced_angina`: Exercise-induced angina (0 = No, 1 = Yes)
10. `st_depression`: ST depression induced by exercise relative to rest
11. `st_slope`: Slope of the peak exercise ST segment (0–2)
12. `num_major_vessels`: Number of major vessels colored by fluoroscopy (0–4)
13. `thalassemia`: Thalassemia condition status (0–3)

### 3.3 Data Preprocessing & Splitting Strategy
- **Stratified Train-Test Split:** Split into **80% training** (320 samples) and **20% testing** (80 samples) using `stratify=y` with `random_state=42` to maintain equal class proportions.
- **Feature Scaling:** Applied `StandardScaler` to continuous variables for distance-sensitive models (Logistic Regression and SVM). Tree-based models (Decision Tree, Random Forest) used unscaled features to preserve native feature values for split nodes.

---

## 4. Model Training & Evaluation Results

### 4.1 Hyperparameter Tuning Strategy
Models were tuned using `GridSearchCV` with **5-fold Stratified Cross-Validation**, optimizing specifically for **Recall** to prioritize sensitivity to disease cases.

### 4.2 Test Set Performance Comparison (80 Patients)

| Model | Recall (Sensitivity) 🎯 | Precision | F1-Score | ROC-AUC 🏆 | Specificity | Accuracy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Decision Tree** | 0.8636 | 0.6333 | 0.7308 | 0.6682 | 0.3889 | 0.6500 |
| **Random Forest** | **0.8182** | **0.6667** | **0.7347** | **0.7639** | **0.5000** | **0.6750** |
| **Logistic Regression** | 0.8182 | 0.6429 | 0.7200 | 0.7386 | 0.4444 | 0.6500 |
| **SVM (RBF Kernel)** | 0.9773 | 0.5811 | 0.7288 | 0.7279 | 0.1389 | 0.6000 |

### 4.3 Why Random Forest Was Selected Over SVM
Although SVM exhibited a higher raw Recall (97.73%), its **Specificity was only 13.89%**. SVM achieved high sensitivity by classifying nearly every patient as high risk, creating an unacceptably high number of false alarms. **Random Forest** demonstrated the highest discrimination capacity (**ROC-AUC = 0.7639**) and balanced performance across all metrics.

---

## 5. Threshold Optimization & Clinical Trade-Offs

In medical diagnostic screening, the cost of a **False Negative** (failing to identify a patient with heart disease) is significantly higher than a **False Positive** (referring a healthy patient for follow-up testing).

- **Default Cutoff (0.50):** Recall = 81.82%, Precision = 66.67%
- **Tuned Cutoff (0.42):** **Recall = 95.45%**, Precision = 62.69%, Specificity = 44.44%

Setting the decision threshold to **0.42** ensures that **95.5% of true heart disease cases are identified**, keeping precision above 60%.

---

## 6. Model Explainability (SHAP Analysis)

SHAP (SHapley Additive exPlanations) was applied to the Random Forest model to ensure transparency for medical practitioners.

- **Top Global Drivers:** `max_heart_rate`, `age`, `sex`, `chest_pain_type`, and `st_depression` contributed most significantly to overall model risk scoring.
- **Patient-Level Attribution:** For each individual prediction, the API outputs the top 3 specific clinical features driving that patient's positive or negative risk score.

---

## 7. API & Docker Deployment

### 7.1 FastAPI Architecture
The service (`api/main.py`) exposes endpoints:
- `GET /`: Health check and model metadata
- `GET /health`: Basic operational status check
- `POST /predict`: Accepts patient JSON feature payload and returns prediction label, probability, risk tier, action, and SHAP top 3 factors.

### 7.2 Containerization
Containerized via `Dockerfile` using Python 3.11 slim image, providing isolated, reproducible deployment across cloud environments.

---

## 8. Limitations & Future Scope

1. **Dataset Size:** 400 records is modest for clinical modeling; testing on larger multi-center cohorts (e.g., UCI Heart Disease 1,000+ records) is recommended.
2. **Clinical Validation:** The model serves as a decision-support screening aid and must be validated against prospective clinical trials before direct clinical integration.
3. **Future Enhancements:** Integration of deep learning tabular models (e.g., TabNet) and multi-class risk categorization.
