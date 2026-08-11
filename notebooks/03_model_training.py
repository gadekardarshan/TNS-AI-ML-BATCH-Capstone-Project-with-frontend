"""
03_model_training.py — Train & tune Decision Tree, Random Forest, Logistic Regression, SVM
Uses GridSearchCV with 5-fold stratified CV to find best hyperparameters per model,
so the comparison is fair (each model gets its best shot) and results are not a fluke
of one particular train/test split.
"""
import joblib
import json
import warnings
warnings.filterwarnings("ignore")

from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.model_selection import GridSearchCV, StratifiedKFold

from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "models"

data = joblib.load(f"{MODEL_DIR}/splits.pkl")
X_train, X_test = data["X_train"], data["X_test"]
X_train_scaled, X_test_scaled = data["X_train_scaled"], data["X_test_scaled"]
y_train, y_test = data["y_train"], data["y_test"]

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

# Recall is the primary business metric (missing a sick patient is costly) —
# we tune hyperparameters to maximize Recall, not Accuracy.
SCORING = "recall"

model_configs = {
    "Decision Tree": {
        "estimator": DecisionTreeClassifier(random_state=42),
        "params": {
            "max_depth": [3, 4, 5, 6, 8, None],
            "min_samples_split": [2, 5, 10],
            "min_samples_leaf": [1, 2, 4],
            "criterion": ["gini", "entropy"],
        },
        "use_scaled": False,
    },
    "Random Forest": {
        "estimator": RandomForestClassifier(random_state=42),
        "params": {
            "n_estimators": [100, 200, 300],
            "max_depth": [4, 6, 8, None],
            "min_samples_split": [2, 5],
            "min_samples_leaf": [1, 2],
            "max_features": ["sqrt", "log2"],
        },
        "use_scaled": False,
    },
    "Logistic Regression": {
        "estimator": LogisticRegression(max_iter=2000, random_state=42),
        "params": {
            "C": [0.01, 0.1, 0.5, 1, 5, 10],
            "penalty": ["l2"],
            "solver": ["lbfgs", "liblinear"],
        },
        "use_scaled": True,
    },
    "SVM": {
        "estimator": SVC(probability=True, random_state=42),
        "params": {
            "C": [0.1, 1, 5, 10],
            "kernel": ["rbf", "linear"],
            "gamma": ["scale", "auto"],
        },
        "use_scaled": True,
    },
}

results = {}
best_estimators = {}

print("=" * 70)
print("TRAINING & TUNING MODELS (5-fold CV, optimizing Recall)")
print("=" * 70)

for name, cfg in model_configs.items():
    Xtr = X_train_scaled if cfg["use_scaled"] else X_train
    grid = GridSearchCV(
        cfg["estimator"], cfg["params"], scoring=SCORING,
        cv=cv, n_jobs=-1, refit=True,
    )
    grid.fit(Xtr, y_train)
    best_estimators[name] = grid.best_estimator_
    results[name] = {
        "best_params": grid.best_params_,
        "best_cv_recall": round(grid.best_score_, 4),
        "use_scaled": cfg["use_scaled"],
    }
    print(f"\n{name}")
    print(f"  Best CV Recall: {grid.best_score_:.4f}")
    print(f"  Best Params: {grid.best_params_}")

joblib.dump(best_estimators, f"{MODEL_DIR}/trained_models.pkl")
with open(f"{MODEL_DIR}/tuning_results.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n" + "=" * 70)
print("All 4 models trained and saved to models/trained_models.pkl")
print("=" * 70)
