FROM python:3.11-slim

WORKDIR /app

# System dependencies for scikit-learn/shap compilation & reportlab
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy codebase
COPY api/ ./api/
COPY models/ ./models/

ENV PYTHONPATH=/app
ENV ARTIFACT_PATH=/app/models/final_model_artifact.pkl

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
