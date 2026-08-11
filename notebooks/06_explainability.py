"""
06_explainability.py — SHAP explainability for the final Random Forest model.
Produces: global feature importance (summary plot) + one example per-patient
force-plot style explanation, matching the Grad-CAM explainability pattern
used in the Sentinel AI project.
"""
import joblib
import json
import numpy as np
import matplotlib.pyplot as plt
import shap

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
OUT_DIR = BASE_DIR / "outputs"

data = joblib.load(f"{MODEL_DIR}/splits.pkl")
X_train, X_test = data["X_train"], data["X_test"]
y_test = data["y_test"]
models = joblib.load(f"{MODEL_DIR}/trained_models.pkl")

FINAL_MODEL_NAME = "Random Forest"
model = models[FINAL_MODEL_NAME]

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)

# shap_values shape handling (binary classification -> take positive class)
if isinstance(shap_values, list):
    sv_positive = shap_values[1]
elif shap_values.ndim == 3:
    sv_positive = shap_values[:, :, 1]
else:
    sv_positive = shap_values

# ---------- Global summary plot (beeswarm) ----------
plt.figure(figsize=(9, 7))
shap.summary_plot(sv_positive, X_test, show=False)
plt.title("SHAP Global Feature Importance — Random Forest", fontweight="bold")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/11_shap_global_summary.png", bbox_inches="tight")
plt.close()

# ---------- Mean absolute SHAP bar chart ----------
mean_abs_shap = np.abs(sv_positive).mean(axis=0)
feature_importance = dict(zip(X_test.columns, mean_abs_shap.round(4)))
sorted_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

fig, ax = plt.subplots(figsize=(8, 6))
names = list(sorted_importance.keys())
vals = list(sorted_importance.values())
ax.barh(names[::-1], vals[::-1], color="#4C77D6")
ax.set_title("Mean |SHAP Value| per Feature (Global Importance)", fontweight="bold")
ax.set_xlabel("Mean |SHAP value|")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/12_shap_importance_bar.png")
plt.close()

with open(f"{OUT_DIR}/shap_global_importance.json", "w") as f:
    json.dump(sorted_importance, f, indent=2)

# ---------- Example per-patient explanation (waterfall) ----------
sample_idx = 0
plt.figure(figsize=(9, 6))
expl = shap.Explanation(
    values=sv_positive[sample_idx],
    base_values=explainer.expected_value[1] if isinstance(explainer.expected_value, (list, np.ndarray)) else explainer.expected_value,
    data=X_test.iloc[sample_idx].values,
    feature_names=list(X_test.columns),
)
shap.plots.waterfall(expl, show=False)
plt.title(f"Example: Per-Patient Explanation (Test Row #{sample_idx})", fontweight="bold")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/13_shap_patient_example.png", bbox_inches="tight")
plt.close()

sample_patient = X_test.iloc[sample_idx].to_dict()
sample_actual = int(y_test.iloc[sample_idx])
sample_pred_proba = float(model.predict_proba(X_test.iloc[[sample_idx]])[0, 1])

top_factors = sorted(
    zip(X_test.columns, sv_positive[sample_idx]),
    key=lambda x: abs(x[1]), reverse=True
)[:3]

print("Top global SHAP features:")
for k, v in list(sorted_importance.items())[:5]:
    print(f"  {k}: {v}")

print(f"\nExample patient (test row {sample_idx}):")
print(f"  Actual label: {sample_actual} | Predicted probability: {sample_pred_proba:.3f}")
print(f"  Top 3 contributing factors: {[f[0] for f in top_factors]}")

with open(f"{OUT_DIR}/shap_example_patient.json", "w") as f:
    json.dump({
        "patient_features": sample_patient,
        "actual_label": sample_actual,
        "predicted_probability": round(sample_pred_proba, 4),
        "top_3_factors": [{"feature": f[0], "shap_value": round(float(f[1]), 4)} for f in top_factors],
    }, f, indent=2, default=str)

print("\nSHAP explainability complete. Plots + JSON saved to outputs/")
