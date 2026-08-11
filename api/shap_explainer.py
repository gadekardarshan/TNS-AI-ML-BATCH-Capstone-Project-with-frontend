"""
shap_explainer.py — SHAP TreeExplainer integration for Random Forest primary model.
Computes patient-specific feature impacts (direction + magnitude).
"""
import shap
import numpy as np
import pandas as pd


class FeatureExplainer:
    def __init__(self, model):
        self.model = model
        self.explainer = shap.TreeExplainer(model)

    def explain(self, row_df: pd.DataFrame, feature_names: list, top_k: int = 5) -> list:
        """
        Computes SHAP values for a single patient row and returns top_k features.
        """
        try:
            shap_values = self.explainer.shap_values(row_df)

            # Handle shape for binary classification
            if isinstance(shap_values, list):
                sv = shap_values[1][0]
            elif shap_values.ndim == 3:
                sv = shap_values[0, :, 1]
            else:
                sv = shap_values[0]

            top_factors = sorted(
                zip(feature_names, sv), key=lambda x: abs(x[1]), reverse=True
            )[:top_k]

            return [
                {
                    "feature": f,
                    "impact": round(float(v), 4),
                    "direction": "increases risk" if v > 0 else "decreases risk",
                }
                for f, v in top_factors
            ]
        except Exception as e:
            # Fallback if SHAP computation fails
            return [
                {
                    "feature": f,
                    "impact": 0.0,
                    "direction": "neutral",
                }
                for f in feature_names[:top_k]
            ]
