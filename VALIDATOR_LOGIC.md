# CLINICAL VALIDATOR & CONSENSUS ENGINE SPECIFICATION

**Document Version:** 1.0.0  
**Target Audience:** Clinical Review Board, Hospital System Auditors, Healthcare Technical Evaluators  
**System:** St. Jude Cardiovascular Center AI Decision-Support System  

---

## 1. Overview & Business Rationale

Single-model predictions in medical machine learning can exhibit blind spots or hyper-sensitivity to specific feature ranges (e.g. SVM achieving 97.7% Recall but only 13.9% Specificity). To prevent diagnostic blind spots and provide defensible decision-support, our system implements an explicit, multi-model consensus and validation layer.

The consensus engine executes **4 distinct classification algorithms** simultaneously:
1. **Random Forest** (Selected Primary Model)
2. **Logistic Regression** (Linear Baseline)
3. **Support Vector Machine - RBF Kernel** (Distance/Boundary-based)
4. **Decision Tree** (Rule-based Decision Boundary)

---

## 2. Mathematical Consensus Algorithm

### Step 1: Model Discrimination Weighting (ROC-AUC)
Rather than treating all four base algorithms as equally trustworthy, each model's vote and probability score are weighted by its verified test-set **ROC-AUC score**:

$$\text{Weight}_{\text{Random Forest}} = 0.7639$$
$$\text{Weight}_{\text{Logistic Regression}} = 0.7386$$
$$\text{Weight}_{\text{SVM}} = 0.7279$$
$$\text{Weight}_{\text{Decision Tree}} = 0.6682$$

### Step 2: Majority Voting & Weighted Confidence Calculation
The overall binary direction ($\text{Final Prediction} \in \{0, 1\}$) is determined by majority vote across operational models. In the case of a 2-2 model split, the direction is resolved using the ROC-AUC weighted probability score:

$$\text{Weighted Confidence} = \frac{\sum_{i=1}^{N} w_i \cdot p_i}{\sum_{i=1}^{N} w_i}$$

Where $w_i$ is the model's ROC-AUC weight and $p_i$ is its predicted positive probability.

### Step 3: Agreement Ratio Computation
The agreement ratio measures the degree of unanimity among operational models:

$$\text{Agreement Ratio} = \frac{\text{Count of Models Agreeing with Majority Direction}}{N_{\text{operational}}}$$

- **1.00 (4/4):** Unanimous Agreement
- **0.75 (3/4):** Strong Consensus
- **0.50 (2/4):** High Disagreement / Split Verdict

---

## 3. Disagreement Flagging (`validator_flag`)

If the models exhibit significant disagreement, the system generates an unmissable clinical alert banner (`validator_flag = "review_recommended"`).

A review flag is triggered if **EITHER** condition is met:
1. **Equal Model Split:** $\text{Agreement Ratio} \le 0.50$ (2-2 split).
2. **High Probability Spread:** $\max(p_i) - \min(p_i) > 0.40$ (e.g. one model predicts 85% probability while another predicts 40%).

### Clinical Warning Banner Text
> *"WARNING: Models disagree significantly (high probability variance / split vote). Clinical judgment is strongly advised; do not rely solely on automated score."*

---

## 4. Decision Cutoff & Risk Stratification

Consistent with the project's clinical tuning methodology, the consensus weighted probability is mapped to risk tiers using the **0.42 tuned threshold**:

| Risk Tier | Probability Range | Color Badge | Recommended Clinical Action |
| :--- | :--- | :---: | :--- |
| **Low Risk** | $< 0.35$ | 🟢 Green | Routine annual check-up recommended. |
| **Moderate Risk** | $0.35 - 0.42$ | 🟡 Yellow | Follow-up screening within 3 months advised. |
| **High Risk** | $0.42 - 0.75$ | 🟠 Orange | Referral to cardiologist recommended within 2 weeks. |
| **Very High Risk** | $\ge 0.75$ | 🔴 Red | Urgent cardiology referral recommended. |

---

## 5. Partial-Failure Safety Safeguard

If any base model experiences an execution failure (e.g. memory constraint), the validator:
1. Isolates the failed model and logs `"status": "error"`.
2. Sets `"partial_failure": true`.
3. Computes the consensus verdict over the remaining operational models.
4. Surfaces an explicit partial failure badge in the report card interface.
