"""
02_preprocessing.py — Train/Test Split + Scaling
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "heart_disease_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(DATA_PATH)
target = "heart_disease"
X = df.drop(columns=[target])
y = df[target]

# Stratified 80/20 split (stratify preserves class ratio in both sets — important given mild imbalance)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)

# Scale features — needed for SVM & Logistic Regression, harmless for tree models
scaler = StandardScaler()
X_train_scaled = pd.DataFrame(scaler.fit_transform(X_train), columns=X.columns, index=X_train.index)
X_test_scaled = pd.DataFrame(scaler.transform(X_test), columns=X.columns, index=X_test.index)

# Persist splits + scaler for reuse across modeling scripts
joblib.dump(
    {
        "X_train": X_train, "X_test": X_test,
        "X_train_scaled": X_train_scaled, "X_test_scaled": X_test_scaled,
        "y_train": y_train, "y_test": y_test,
        "feature_names": list(X.columns),
    },
    f"{MODEL_DIR}/splits.pkl",
)
joblib.dump(scaler, f"{MODEL_DIR}/scaler.pkl")

print(f"Train set: {X_train.shape[0]} rows | Test set: {X_test.shape[0]} rows")
print(f"Train target balance:\n{y_train.value_counts(normalize=True).round(3)}")
print(f"Test target balance:\n{y_test.value_counts(normalize=True).round(3)}")
print("\nSplits + scaler saved to models/")
