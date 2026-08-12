// Exact reference data exported from project output files:
// outputs/model_comparison_metrics.csv, outputs/eda_insights.json, outputs/chosen_threshold.json

export interface ModelMetricRow {
  model: string;
  recall: number;
  precision: number;
  f1Score: number;
  rocAuc: number;
  specificity: number;
  accuracy: number;
}

export const MODEL_COMPARISON_METRICS: ModelMetricRow[] = [
  {
    model: 'Decision Tree',
    recall: 0.8636,
    precision: 0.6333,
    f1Score: 0.7308,
    rocAuc: 0.6682,
    specificity: 0.3889,
    accuracy: 0.6500,
  },
  {
    model: 'Random Forest',
    recall: 0.8182,
    precision: 0.6667,
    f1Score: 0.7347,
    rocAuc: 0.7639,
    specificity: 0.5000,
    accuracy: 0.6750,
  },
  {
    model: 'Logistic Regression',
    recall: 0.8182,
    precision: 0.6429,
    f1Score: 0.7200,
    rocAuc: 0.7386,
    specificity: 0.4444,
    accuracy: 0.6500,
  },
  {
    model: 'SVM',
    recall: 0.9773,
    precision: 0.5811,
    f1Score: 0.7288,
    rocAuc: 0.7279,
    specificity: 0.1389,
    accuracy: 0.6000,
  },
];

export const EDA_INSIGHTS = {
  n_records: 400,
  n_features: 13,
  missing_values_total: 0,
  duplicate_rows: 0,
  class_balance_ratio: 1.25,
  target_distribution: [
    { name: 'No Disease (0)', value: 178, percentage: 44.5, fill: '#10B981' },
    { name: 'Heart Disease (1)', value: 222, percentage: 55.5, fill: '#EF4444' },
  ],
  top_correlated_features: [
    { feature: 'Age', correlation: 0.341, direction: 'Positive' },
    { feature: 'Max Heart Rate', correlation: -0.328, direction: 'Negative' },
    { feature: 'Resting Blood Pressure', correlation: 0.218, direction: 'Positive' },
    { feature: 'Sex', correlation: 0.169, direction: 'Positive' },
    { feature: 'Cholesterol', correlation: 0.148, direction: 'Positive' },
  ],
};

export const THRESHOLD_TUNING_DATA = {
  final_model: 'Random Forest',
  chosen_threshold: 0.42,
  metrics_at_threshold: {
    recall: 0.9545,
    precision: 0.6269,
    f1: 0.7568,
    specificity: 0.3056,
  },
  metrics_at_default_0_5: {
    recall: 0.8182,
    precision: 0.6667,
    f1: 0.7347,
    specificity: 0.5000,
  },
};
