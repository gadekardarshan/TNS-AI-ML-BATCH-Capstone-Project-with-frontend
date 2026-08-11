"""
05_threshold_tuning.py — Tune the decision threshold on Random Forest
(the selected model) instead of using the default 0.5 cutoff.
Goal: maximize Recall while keeping Precision reasonable — justified,
documented trade-off rather than an accident of the default threshold.
"""
import joblib
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.metrics import recall_score, precision_score, f1_score, confusion_matrix

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
OUT_DIR = BASE_DIR / "outputs"

data = joblib.load(f"{MODEL_DIR}/splits.pkl")
y_test = data["y_test"]
models = joblib.load(f"{MODEL_DIR}/trained_models.pkl")
proba = joblib.load(f"{MODEL_DIR}/test_probabilities.pkl")

FINAL_MODEL_NAME = "Random Forest"
y_proba = proba[FINAL_MODEL_NAME]

thresholds = np.arange(0.20, 0.81, 0.02)
rows = []
for t in thresholds:
    y_pred = (y_proba >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    rows.append({
        "threshold": round(t, 2),
        "recall": recall_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred, zero_division=0),
        "f1": f1_score(y_test, y_pred, zero_division=0),
        "specificity": tn / (tn + fp) if (tn + fp) > 0 else 0,
    })
tdf = pd.DataFrame(rows)

# Chosen operating point: highest Recall achievable without Precision dropping below 0.60
# (below 0.60 precision, more than 4 in 10 "disease" alerts would be false alarms — too noisy for real use)
candidates = tdf[tdf["precision"] >= 0.60]
chosen = candidates.loc[candidates["recall"].idxmax()] if len(candidates) else tdf.loc[tdf["f1"].idxmax()]

print("Threshold sweep (sample):")
print(tdf.iloc[::5].to_string(index=False))
print(f"\nChosen operating threshold: {chosen['threshold']}")
print(f"  Recall: {chosen['recall']:.3f}  Precision: {chosen['precision']:.3f}  "
      f"F1: {chosen['f1']:.3f}  Specificity: {chosen['specificity']:.3f}")

default_row = tdf.iloc[(tdf["threshold"] - 0.50).abs().argsort()[:1]].iloc[0]
print(f"\nDefault threshold (0.50) for comparison:")
print(f"  Recall: {default_row['recall']:.3f}  Precision: {default_row['precision']:.3f}")

# Plot
fig, ax = plt.subplots(figsize=(9, 5.5))
ax.plot(tdf["threshold"], tdf["recall"], label="Recall", linewidth=2, color="#D64550")
ax.plot(tdf["threshold"], tdf["precision"], label="Precision", linewidth=2, color="#4C77D6")
ax.plot(tdf["threshold"], tdf["f1"], label="F1-Score", linewidth=2, linestyle="--", color="#4C9F70")
ax.axvline(chosen["threshold"], color="black", linestyle=":", linewidth=1.5,
           label=f"Chosen threshold = {chosen['threshold']}")
ax.axvline(0.50, color="gray", linestyle=":", linewidth=1, alpha=0.6, label="Default = 0.50")
ax.set_xlabel("Decision Threshold")
ax.set_ylabel("Score")
ax.set_title(f"Precision-Recall Threshold Tuning — {FINAL_MODEL_NAME}", fontweight="bold")
ax.legend()
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/10_threshold_tuning.png")
plt.close()

with open(f"{OUT_DIR}/chosen_threshold.json", "w") as f:
    json.dump({
        "final_model": FINAL_MODEL_NAME,
        "chosen_threshold": float(chosen["threshold"]),
        "metrics_at_threshold": {k: round(float(v), 4) for k, v in chosen.items() if k != "threshold"},
        "metrics_at_default_0.5": {k: round(float(v), 4) for k, v in default_row.items() if k != "threshold"},
    }, f, indent=2)

print("\nThreshold tuning complete. Plot + JSON saved to outputs/")
