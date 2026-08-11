"""
validator.py — Clinical Consensus & Validation Layer
Reconciles predictions from Decision Tree, Random Forest, Logistic Regression, and SVM
using ROC-AUC weighted voting, agreement ratio analysis, threshold mapping (0.42),
and clinical disagreement risk flags.
"""

# Known Test-Set ROC-AUC Scores from Capstone Model Evaluation
MODEL_ROC_AUC_WEIGHTS = {
    "Random Forest": 0.7639,
    "Logistic Regression": 0.7386,
    "SVM": 0.7279,
    "Decision Tree": 0.6682,
}

# Decision Threshold & Risk Tier Boundaries
TUNED_THRESHOLD = 0.42
RISK_BOUNDARIES = {
    "low_max": 0.35,
    "moderate_max": 0.42,
    "high_max": 0.75,
}


def get_risk_tier_info(probability: float) -> dict:
    """Returns risk tier label and recommended action for a given probability."""
    if probability < RISK_BOUNDARIES["low_max"]:
        return {
            "tier": "Low Risk",
            "action": "Routine annual check-up recommended.",
            "color_code": "green",
        }
    elif probability < RISK_BOUNDARIES["moderate_max"]:
        return {
            "tier": "Moderate Risk",
            "action": "Follow-up screening within 3 months advised.",
            "color_code": "yellow",
        }
    elif probability < RISK_BOUNDARIES["high_max"]:
        return {
            "tier": "High Risk",
            "action": "Referral to cardiologist recommended within 2 weeks.",
            "color_code": "orange",
        }
    else:
        return {
            "tier": "Very High Risk",
            "action": "Urgent cardiology referral recommended.",
            "color_code": "red",
        }


def evaluate_consensus(model_results: list) -> dict:
    """
    Reconciles multi-model outputs into a validated consensus verdict.
    Handles partial model failures gracefully.
    """
    # Filter operational models
    valid_models = [m for m in model_results if m.get("status", "success") == "success"]

    if not valid_models:
        return {
            "final_prediction": 0,
            "final_label": "Inconclusive",
            "confidence_score": 0.0,
            "agreement_ratio": 0.0,
            "agreement_note": "All models failed to execute.",
            "validator_flag": "review_recommended",
            "validator_warning": "CRITICAL: All base models failed. Direct clinical review required.",
            "risk_tier": "Unknown",
            "recommended_action": "Unable to calculate risk. Perform standard clinical diagnostic evaluation.",
            "primary_model_reference": "Random Forest (ROC-AUC 0.764, selected model)",
            "partial_failure": True,
        }

    # Extract votes, probabilities, and ROC-AUC weights
    votes = []
    weighted_prob_sum = 0.0
    total_weight = 0.0
    probs = []

    for m in valid_models:
        name = m["model_name"]
        pred = m["prediction"]
        prob = m["probability"]
        weight = MODEL_ROC_AUC_WEIGHTS.get(name, 0.70)

        votes.append(pred)
        probs.append(prob)
        weighted_prob_sum += weight * prob
        total_weight += weight

    weighted_confidence = round(weighted_prob_sum / total_weight, 4)

    # Majority vote
    disease_votes = votes.count(1)
    no_disease_votes = votes.count(0)

    if disease_votes > no_disease_votes:
        final_pred = 1
    elif no_disease_votes > disease_votes:
        final_pred = 0
    else:
        # Tie (e.g. 2-2 split) -> decided by weighted confidence vs threshold (0.42)
        final_pred = 1 if weighted_confidence >= TUNED_THRESHOLD else 0

    # Agreement Ratio
    majority_count = max(disease_votes, no_disease_votes)
    agreement_ratio = round(majority_count / len(valid_models), 2)

    # Validator Flag Determination
    max_p = max(probs)
    min_p = min(probs)
    prob_spread = max_p - min_p

    validator_flag = "none"
    validator_warning = None

    if agreement_ratio <= 0.50 or prob_spread > 0.40:
        validator_flag = "review_recommended"
        reasons = []
        if agreement_ratio <= 0.50:
            reasons.append("equal model split (50/50 disagreement)")
        if prob_spread > 0.40:
            reasons.append(f"high probability variance ({prob_spread:.2f} spread between models)")
        validator_warning = (
            f"WARNING: Models disagree significantly ({' & '.join(reasons)}). "
            "Clinical judgment is strongly advised; do not rely solely on automated score."
        )

    # Risk Tier Assignment
    risk_info = get_risk_tier_info(weighted_confidence)

    final_label = "Disease Likely" if final_pred == 1 else "Disease Unlikely"
    agreement_note = (
        f"{majority_count} of {len(valid_models)} operational models agree on {final_label}."
    )

    partial_failure = len(valid_models) < len(model_results)

    return {
        "final_prediction": final_pred,
        "final_label": final_label,
        "confidence_score": weighted_confidence,
        "agreement_ratio": agreement_ratio,
        "agreement_note": agreement_note,
        "validator_flag": validator_flag,
        "validator_warning": validator_warning,
        "risk_tier": risk_info["tier"],
        "recommended_action": risk_info["action"],
        "color_code": risk_info["color_code"],
        "primary_model_reference": "Random Forest (ROC-AUC 0.764, selected model)",
        "partial_failure": partial_failure,
    }
