"""
04_evaluation.py — Evaluate all 4 tuned models on the held-out test set.
Primary metrics: Recall, Precision, F1, ROC-AUC
Secondary metrics: Specificity, Accuracy
"""
import joblib
import json
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    recall_score, precision_score, f1_score, roc_auc_score,
    accuracy_score, confusion_matrix, roc_curve, classification_report
)

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"
OUT_DIR = BASE_DIR / "outputs"

data = joblib.load(f"{MODEL_DIR}/splits.pkl")
X_test, X_test_scaled = data["X_test"], data["X_test_scaled"]
y_test = data["y_test"]

models = joblib.load(f"{MODEL_DIR}/trained_models.pkl")
tuning_results = json.load(open(f"{MODEL_DIR}/tuning_results.json"))

metrics_table = []
roc_data = {}
cm_data = {}
proba_predictions = {}

for name, model in models.items():
    use_scaled = tuning_results[name]["use_scaled"]
    X_eval = X_test_scaled if use_scaled else X_test

    y_pred = model.predict(X_eval)
    y_proba = model.predict_proba(X_eval)[:, 1]
    proba_predictions[name] = y_proba

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()
    specificity = tn / (tn + fp)

    row = {
        "Model": name,
        "Recall": round(recall_score(y_test, y_pred), 4),
        "Precision": round(precision_score(y_test, y_pred), 4),
        "F1-Score": round(f1_score(y_test, y_pred), 4),
        "ROC-AUC": round(roc_auc_score(y_test, y_proba), 4),
        "Specificity": round(specificity, 4),
        "Accuracy": round(accuracy_score(y_test, y_pred), 4),
    }
    metrics_table.append(row)
    cm_data[name] = confusion_matrix(y_test, y_pred).tolist()
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_data[name] = {"fpr": fpr.tolist(), "tpr": tpr.tolist()}

    print(f"\n{'='*60}\n{name}\n{'='*60}")
    print(classification_report(y_test, y_pred, target_names=["No Disease", "Disease"]))

metrics_df = pd.DataFrame(metrics_table).set_index("Model")
metrics_df.to_csv(f"{OUT_DIR}/model_comparison_metrics.csv")

print("\n" + "=" * 70)
print("FINAL MODEL COMPARISON (Test Set)")
print("=" * 70)
print(metrics_df.to_string())

# ---------- Confusion matrices grid ----------
fig, axes = plt.subplots(1, 4, figsize=(18, 4.2))
for ax, (name, cm) in zip(axes, cm_data.items()):
    sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=ax, cbar=False,
                xticklabels=["No Disease", "Disease"], yticklabels=["No Disease", "Disease"])
    ax.set_title(name, fontsize=11)
    ax.set_ylabel("Actual")
    ax.set_xlabel("Predicted")
plt.suptitle("Confusion Matrices — Test Set", fontweight="bold")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/07_confusion_matrices.png")
plt.close()

# ---------- ROC curves overlay ----------
fig, ax = plt.subplots(figsize=(7, 6))
palette = sns.color_palette("Set1", n_colors=len(roc_data))
for (name, rd), color in zip(roc_data.items(), palette):
    auc_val = metrics_df.loc[name, "ROC-AUC"]
    ax.plot(rd["fpr"], rd["tpr"], label=f"{name} (AUC={auc_val:.3f})", color=color, linewidth=2)
ax.plot([0, 1], [0, 1], linestyle="--", color="gray", label="Random Classifier")
ax.set_xlabel("False Positive Rate")
ax.set_ylabel("True Positive Rate")
ax.set_title("ROC Curves — All Models", fontweight="bold")
ax.legend(loc="lower right", fontsize=9)
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/08_roc_curves.png")
plt.close()

# ---------- Metric comparison bar chart ----------
fig, ax = plt.subplots(figsize=(11, 6))
metrics_df[["Recall", "Precision", "F1-Score", "ROC-AUC", "Accuracy"]].plot(
    kind="bar", ax=ax, colormap="viridis", width=0.75
)
ax.set_title("Model Comparison Across Key Metrics", fontweight="bold")
ax.set_ylabel("Score")
ax.set_ylim(0, 1.05)
ax.legend(loc="lower right", ncol=5, fontsize=8)
plt.xticks(rotation=15)
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/09_metric_comparison_bars.png")
plt.close()

joblib.dump(proba_predictions, f"{MODEL_DIR}/test_probabilities.pkl")
print("\nEvaluation complete. Comparison CSV + 3 plots saved to outputs/")

# Best model by Recall (primary business metric)
best_model_name = metrics_df["Recall"].idxmax()
print(f"\nBest model by Recall: {best_model_name}")
with open(f"{OUT_DIR}/best_model_name.txt", "w") as f:
    f.write(best_model_name)
