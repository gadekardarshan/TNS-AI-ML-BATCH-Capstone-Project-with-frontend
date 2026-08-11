FROM python:3.11-slim

WORKDIR /app

# System deps for scikit-learn/shap compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/main.py .
COPY models/final_model_artifact.pkl ./models/final_model_artifact.pkl

# main.py loads the artifact from an absolute path built for the dev environment;
# override via env var pattern below when running in the container.
ENV ARTIFACT_PATH=/app/models/final_model_artifact.pkl

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
