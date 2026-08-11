"""
logger.py — Structured Audit Logging Module.
Logs execution metrics, model consensus outcomes, and non-PHI patient input hashes.
"""
import logging
import json
import hashlib
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audit_logger")


def log_prediction_audit(
    input_data: dict,
    models_executed: list,
    consensus_result: dict,
    execution_time_ms: float,
    client_ip: str = "unknown",
):
    """
    Logs structured JSON audit record without raw PHI.
    Computes an MD5 hash of feature inputs for audit traceability.
    """
    input_str = json.dumps(input_data, sort_keys=True)
    input_hash = hashlib.md5(input_str.encode("utf-8")).hexdigest()[:12]

    audit_entry = {
        "event_type": "MODEL_ENSEMBLE_PREDICTION",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "client_ip": client_ip,
        "anonymized_input_hash": f"HASH-{input_hash}",
        "models_executed_count": len(models_executed),
        "consensus_prediction": consensus_result.get("final_prediction"),
        "consensus_risk_tier": consensus_result.get("risk_tier"),
        "agreement_ratio": consensus_result.get("agreement_ratio"),
        "validator_flag": consensus_result.get("validator_flag"),
        "execution_time_ms": round(execution_time_ms, 2),
    }

    logger.info(f"[AUDIT] {json.dumps(audit_entry)}")
