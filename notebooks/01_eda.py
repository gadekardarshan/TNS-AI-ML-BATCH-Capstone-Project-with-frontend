"""
01_eda.py — Exploratory Data Analysis
Heart Disease Detection using Classification Algorithms
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import json

sns.set_style("whitegrid")
plt.rcParams['figure.dpi'] = 110

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "heart_disease_dataset.csv"
OUT_DIR = BASE_DIR / "outputs"
OUT_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_PATH)

print("=" * 60)
print("DATASET OVERVIEW")
print("=" * 60)
print(f"Shape: {df.shape}")
print(f"\nMissing values:\n{df.isnull().sum().sum()} total")
print(f"\nDuplicate rows: {df.duplicated().sum()}")

target = "heart_disease"
features = [c for c in df.columns if c != target]

# Feature encoding reference (from domain knowledge of this dataset schema)
categorical_features = ["sex", "chest_pain_type", "fasting_blood_sugar", "resting_ecg",
                         "exercise_induced_angina", "st_slope", "num_major_vessels", "thalassemia"]
numerical_features = ["age", "resting_blood_pressure", "cholesterol", "max_heart_rate", "st_depression"]

# ---------- 1. Target distribution ----------
fig, ax = plt.subplots(figsize=(5, 4))
counts = df[target].value_counts().sort_index()
colors = ["#4C9F70", "#D64550"]
ax.bar(["No Disease (0)", "Disease (1)"], counts.values, color=colors)
for i, v in enumerate(counts.values):
    ax.text(i, v + 3, f"{v} ({v/len(df)*100:.1f}%)", ha="center", fontweight="bold")
ax.set_title("Target Class Distribution")
ax.set_ylabel("Count")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/01_target_distribution.png")
plt.close()

# ---------- 2. Numerical feature distributions by target ----------
fig, axes = plt.subplots(2, 3, figsize=(15, 8))
axes = axes.flatten()
for i, feat in enumerate(numerical_features):
    for cls, color in zip([0, 1], colors):
        sns.kdeplot(df[df[target] == cls][feat], ax=axes[i], color=color,
                    label=f"Disease={cls}", fill=True, alpha=0.3)
    axes[i].set_title(feat)
    axes[i].legend(fontsize=8)
axes[-1].axis("off")
plt.suptitle("Numerical Feature Distributions by Target Class", fontweight="bold")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/02_numerical_distributions.png")
plt.close()

# ---------- 3. Categorical feature counts by target ----------
fig, axes = plt.subplots(2, 4, figsize=(18, 8))
axes = axes.flatten()
for i, feat in enumerate(categorical_features):
    sns.countplot(data=df, x=feat, hue=target, ax=axes[i], palette=colors)
    axes[i].set_title(feat)
    axes[i].legend(title="Disease", fontsize=8)
plt.suptitle("Categorical Feature Counts by Target Class", fontweight="bold")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/03_categorical_distributions.png")
plt.close()

# ---------- 4. Correlation heatmap ----------
fig, ax = plt.subplots(figsize=(11, 9))
corr = df.corr()
sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0, ax=ax,
            annot_kws={"size": 7}, cbar_kws={"shrink": 0.8})
ax.set_title("Feature Correlation Matrix", fontweight="bold")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/04_correlation_heatmap.png")
plt.close()

# ---------- 5. Correlation with target, ranked ----------
target_corr = corr[target].drop(target).sort_values(key=abs, ascending=False)
fig, ax = plt.subplots(figsize=(8, 6))
bar_colors = ["#D64550" if v > 0 else "#4C77D6" for v in target_corr.values]
ax.barh(target_corr.index[::-1], target_corr.values[::-1], color=bar_colors[::-1])
ax.set_title("Feature Correlation with Heart Disease (Target)", fontweight="bold")
ax.set_xlabel("Correlation coefficient")
ax.axvline(0, color="black", linewidth=0.8)
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/05_target_correlation_ranked.png")
plt.close()

# ---------- 6. Boxplots for outlier check on numerical features ----------
fig, axes = plt.subplots(1, 5, figsize=(18, 4))
for i, feat in enumerate(numerical_features):
    sns.boxplot(data=df, y=feat, ax=axes[i], color="#8CA6DB")
    axes[i].set_title(feat)
plt.suptitle("Outlier Check — Numerical Features", fontweight="bold")
plt.tight_layout()
plt.savefig(f"{OUT_DIR}/06_outlier_boxplots.png")
plt.close()

# ---------- Summary stats and insights export ----------
insights = {
    "n_records": int(len(df)),
    "n_features": int(len(features)),
    "missing_values_total": int(df.isnull().sum().sum()),
    "duplicate_rows": int(df.duplicated().sum()),
    "target_distribution": {str(k): int(v) for k, v in counts.items()},
    "class_balance_ratio": round(counts.max() / counts.min(), 2),
    "top_5_correlated_features": target_corr.head(5).round(3).to_dict(),
}

with open(f"{OUT_DIR}/eda_insights.json", "w") as f:
    json.dump(insights, f, indent=2)

print("\n" + "=" * 60)
print("TOP FEATURES CORRELATED WITH HEART DISEASE")
print("=" * 60)
print(target_corr.head(8))

print("\nEDA complete. 6 plots + insights JSON saved to outputs/")
