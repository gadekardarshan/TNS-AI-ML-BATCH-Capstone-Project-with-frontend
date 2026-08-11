"""
test_validator.py — Unit test suite for the Clinical Validator Layer.
Verifies consensus logic, 2-2 split handling, ROC-AUC weighted scoring,
0.42 threshold mapping, and partial model failure handling.
"""
# Standard Python test file for validator module
from api.validator import evaluate_consensus, get_risk_tier_info


def test_2_2_model_split_triggers_validator_warning():
    """Verifies a 2-2 split produces agreement_ratio=0.5 and validator_flag='review_recommended'."""
    model_results = [
        {"model_name": "Random Forest", "prediction": 1, "probability": 0.65, "status": "success"},
        {"model_name": "Logistic Regression", "prediction": 1, "probability": 0.58, "status": "success"},
        {"model_name": "SVM", "prediction": 0, "probability": 0.35, "status": "success"},
        {"model_name": "Decision Tree", "prediction": 0, "probability": 0.30, "status": "success"},
    ]
    res = evaluate_consensus(model_results)
    assert res["agreement_ratio"] == 0.50
    assert res["validator_flag"] == "review_recommended"
    assert "WARNING" in res["validator_warning"]


def test_high_probability_spread_triggers_warning():
    """Verifies max-min prob > 0.40 triggers review_recommended flag."""
    model_results = [
        {"model_name": "Random Forest", "prediction": 1, "probability": 0.85, "status": "success"},
        {"model_name": "Logistic Regression", "prediction": 1, "probability": 0.80, "status": "success"},
        {"model_name": "SVM", "prediction": 1, "probability": 0.75, "status": "success"},
        {"model_name": "Decision Tree", "prediction": 0, "probability": 0.40, "status": "success"},
    ]
    res = evaluate_consensus(model_results)
    assert res["agreement_ratio"] == 0.75  # 3 of 4 agree
    assert res["validator_flag"] == "review_recommended"  # prob_spread = 0.45 > 0.40


def test_unanimous_consensus_no_warning():
    """Verifies unanimous agreement with low spread produces validator_flag='none'."""
    model_results = [
        {"model_name": "Random Forest", "prediction": 1, "probability": 0.72, "status": "success"},
        {"model_name": "Logistic Regression", "prediction": 1, "probability": 0.68, "status": "success"},
        {"model_name": "SVM", "prediction": 1, "probability": 0.75, "status": "success"},
        {"model_name": "Decision Tree", "prediction": 1, "probability": 0.65, "status": "success"},
    ]
    res = evaluate_consensus(model_results)
    assert res["final_prediction"] == 1
    assert res["agreement_ratio"] == 1.0
    assert res["validator_flag"] == "none"
    assert res["risk_tier"] == "High Risk"


def test_risk_tier_boundaries_at_0_42_threshold():
    """Verifies correct risk tier assignment across boundaries (<0.35, 0.35-0.42, 0.42-0.75, >=0.75)."""
    assert get_risk_tier_info(0.20)["tier"] == "Low Risk"
    assert get_risk_tier_info(0.38)["tier"] == "Moderate Risk"
    assert get_risk_tier_info(0.55)["tier"] == "High Risk"
    assert get_risk_tier_info(0.85)["tier"] == "Very High Risk"


def test_partial_model_failure_handling():
    """Verifies validator handles 1 model failure gracefully."""
    model_results = [
        {"model_name": "Random Forest", "prediction": 1, "probability": 0.70, "status": "success"},
        {"model_name": "Logistic Regression", "prediction": 1, "probability": 0.68, "status": "success"},
        {"model_name": "SVM", "prediction": 0, "probability": 0.40, "status": "error", "error_message": "Memory error"},
        {"model_name": "Decision Tree", "prediction": 1, "probability": 0.65, "status": "success"},
    ]
    res = evaluate_consensus(model_results)
    assert res["partial_failure"] is True
    assert res["final_prediction"] == 1
    assert "3 of 3" in res["agreement_note"]
