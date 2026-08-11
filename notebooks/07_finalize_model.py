"""
07_finalize_model.py — Package the final model + scaler + threshold + risk
tiers into a single artifact the API will load.
"""
import joblib
import json

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
OUT_DIR = BASE_DIR / "outputs"

models = joblib.load(f"{MODEL_DIR}/trained_models.pkl")
data = joblib.load(f"{MODEL_DIR}/splits.pkl")
chosen = json.load(open(f"{OUT_DIR}/chosen_threshold.json"))

FINAL_MODEL_NAME = "Random Forest"
final_model = models[FINAL_MODEL_NAME]
threshold = chosen["chosen_threshold"]
feature_names = data["feature_names"]


# Risk tier boundaries stored as plain data (not a function) so the artifact
# pickles cleanly and can be loaded from any script, including the API process.
risk_tier_boundaries = {
    "low_max": 0.35,
    "moderate_max": threshold,
    "high_max": 0.75,
}

artifact = {
    "model": final_model,
    "model_name": FINAL_MODEL_NAME,
    "threshold": threshold,
    "feature_names": feature_names,
    "uses_scaled_input": False,  # Random Forest doesn't need scaling
    "risk_tier_boundaries": risk_tier_boundaries,
}

joblib.dump(artifact, f"{MODEL_DIR}/final_model_artifact.pkl")

print(f"Final model: {FINAL_MODEL_NAME}")
print(f"Decision threshold: {threshold}")
print(f"Features expected (in order): {feature_names}")
print("\nRisk tier boundaries:")
print("  < 0.35        -> Low Risk")
print(f"  0.35 - {threshold} -> Moderate Risk")
print(f"  {threshold} - 0.75   -> High Risk")
print("  >= 0.75       -> Very High Risk")
print("\nFinal artifact saved to models/final_model_artifact.pkl")
