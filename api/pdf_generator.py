"""
pdf_generator.py — Server-Side PDF Report Generation using ReportLab.
Produces a pixel-consistent clinical report card matching the on-screen UI layout.
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)


def generate_patient_pdf_report(
    assessment_data: dict,
    patient_ref: str = "PATIENT-REF-UNKNOWN",
    doctor_notes: str = "",
) -> bytes:
    """
    Renders a clinical PDF document matching the hospital report card layout.
    Returns PDF bytes.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    story = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        textColor=colors.HexColor("#1E293B"),
    )

    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0F172A"),
        spaceBefore=10,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )

    # Risk Color Mapping
    consensus = assessment_data.get("consensus", {})
    risk_tier = consensus.get("risk_tier", "Unknown")
    
    tier_colors = {
        "Low Risk": colors.HexColor("#10B981"),       # Green
        "Moderate Risk": colors.HexColor("#F59E0B"),  # Yellow
        "High Risk": colors.HexColor("#F97316"),      # Orange
        "Very High Risk": colors.HexColor("#EF4444"), # Red
    }
    badge_color = tier_colors.get(risk_tier, colors.HexColor("#6B7280"))

    # 1. Header Block
    header_data = [
        [
            Paragraph("<b>ST. JUDE CARDIOVASCULAR CENTER</b><br/>Clinical AI Diagnostic Decision-Support Report", title_style),
            Paragraph(f"<b>Ref ID:</b> {patient_ref}<br/><b>Date:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}<br/><b>Facility:</b> Cardiology Unit A", subtitle_style),
        ]
    ]
    header_table = Table(header_data, colWidths=[340, 200])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#CBD5E1"), spaceAfter=12))

    # 2. Final Verdict & Risk Tier Banner
    final_label = consensus.get("final_label", "N/A")
    confidence = consensus.get("confidence_score", 0.0)
    agreement_note = consensus.get("agreement_note", "")

    verdict_text = f"<b>FINAL CONSENSUS VERDICT: {final_label.upper()}</b>"
    verdict_sub = f"Weighted Confidence: <b>{confidence * 100:.1f}%</b> | Agreement: <b>{agreement_note}</b>"

    banner_data = [
        [
            Paragraph(f"<font color='white' size=13><b>{verdict_text}</b></font><br/><font color='#F1F5F9' size=9>{verdict_sub}</font>", body_style),
            Paragraph(f"<font color='white' size=14><b>{risk_tier.upper()}</b></font>", ParagraphStyle("Badge", parent=body_style, alignment=1)),
        ]
    ]
    banner_table = Table(banner_data, colWidths=[380, 160])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#1E293B")),
        ('BACKGROUND', (1, 0), (1, 0), badge_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('ALIGN', (1, 0), (1, 0), 'CENTER'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 10))

    # 3. Disagreement / Validator Warning Banner (if present)
    if consensus.get("validator_flag") == "review_recommended":
        warning_msg = consensus.get("validator_warning", "Models disagree significantly. Clinical judgment advised.")
        warn_data = [[Paragraph(f"<b>⚠️ CLINICAL WARNING:</b> {warning_msg}", ParagraphStyle("Warn", parent=body_style, textColor=colors.HexColor("#991B1B")))]]
        warn_table = Table(warn_data, colWidths=[540])
        warn_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEE2E2")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#F87171")),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(warn_table)
        story.append(Spacer(1, 10))

    # 4. Multi-Model Breakdown Table
    story.append(Paragraph("Multi-Model Classifier Breakdown", section_heading))
    model_results = assessment_data.get("model_results", [])
    
    table_headers = ["Model Algorithm", "Prediction", "Probability", "Risk Tier Status", "Weight (ROC-AUC)"]
    table_rows = [[Paragraph(f"<b>{h}</b>", body_style) for h in table_headers]]

    weights = {"Random Forest": "0.764 (Primary)", "Logistic Regression": "0.739", "SVM": "0.728", "Decision Tree": "0.668"}

    for m in model_results:
        m_name = m.get("model_name", "Unknown")
        pred_lbl = "Disease Likely" if m.get("prediction") == 1 else "Disease Unlikely"
        prob_pct = f"{m.get('probability', 0.0) * 100:.1f}%"
        tier = m.get("risk_tier", "N/A")
        w_str = weights.get(m_name, "0.700")

        # Highlight disagreement
        is_disagree = (m.get("prediction") != consensus.get("final_prediction"))
        disagree_tag = " ⚠️ (Disagrees)" if is_disagree else ""

        table_rows.append([
            Paragraph(f"<b>{m_name}</b>{disagree_tag}", body_style),
            Paragraph(pred_lbl, body_style),
            Paragraph(prob_pct, body_style),
            Paragraph(tier, body_style),
            Paragraph(w_str, body_style),
        ])

    models_table = Table(table_rows, colWidths=[140, 100, 80, 100, 120])
    models_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(models_table)
    story.append(Spacer(1, 10))

    # 5. SHAP Feature Attribution (Primary Model)
    story.append(Paragraph("Primary Explainability Drivers (Random Forest SHAP)", section_heading))
    rf_model = next((m for m in model_results if m.get("model_name") == "Random Forest"), {})
    shap_factors = rf_model.get("top_contributing_factors", [])

    if shap_factors:
        shap_rows = [[Paragraph("<b>Clinical Feature</b>", body_style), Paragraph("<b>SHAP Impact Score</b>", body_style), Paragraph("<b>Effect on Patient Risk</b>", body_style)]]
        for f in shap_factors:
            direction_color = "#DC2626" if "increases" in f.get("direction", "") else "#2563EB"
            shap_rows.append([
                Paragraph(f.get("feature", "N/A"), body_style),
                Paragraph(f"{f.get('impact', 0.0):+.4f}", body_style),
                Paragraph(f"<font color='{direction_color}'><b>{f.get('direction', 'N/A').title()}</b></font>", body_style),
            ])
        shap_table = Table(shap_rows, colWidths=[180, 160, 200])
        shap_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        story.append(shap_table)
    story.append(Spacer(1, 10))

    # 6. Patient Input Summary (2-Column Table)
    story.append(Paragraph("Patient Clinical Input Summary", section_heading))
    inputs = assessment_data.get("input_summary", {})
    
    inp_items = list(inputs.items())
    half = (len(inp_items) + 1) // 2
    col1 = inp_items[:half]
    col2 = inp_items[half:]

    summary_rows = []
    for i in range(half):
        k1, v1 = col1[i] if i < len(col1) else ("", "")
        k2, v2 = col2[i] if i < len(col2) else ("", "")
        summary_rows.append([
            Paragraph(f"<b>{k1}:</b> {v1}", body_style),
            Paragraph(f"<b>{k2}:</b> {v2}" if k2 else "", body_style),
        ])
    
    summary_table = Table(summary_rows, colWidths=[270, 270])
    summary_table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 10))

    # 7. Actionable Clinical Recommendation & Doctor Notes
    action_text = consensus.get("recommended_action", "N/A")
    rec_data = [
        [Paragraph(f"<b>RECOMMENDED CLINICAL ACTION:</b><br/>{action_text}", ParagraphStyle("Rec", parent=body_style, fontSize=10, leading=14, textColor=colors.HexColor("#1E293B")))]
    ]
    rec_table = Table(rec_data, colWidths=[540])
    rec_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#93C5FD")),
        ('PADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(rec_table)
    story.append(Spacer(1, 8))

    if doctor_notes:
        notes_data = [[Paragraph(f"<b>Attending Physician Notes:</b><br/>{doctor_notes}", body_style)]]
        notes_table = Table(notes_data, colWidths=[540])
        notes_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(notes_table)
        story.append(Spacer(1, 8))

    # 8. Regulatory & Clinical Disclaimer
    disclaimer = (
        "<b>CLINICAL DECISION-SUPPORT DISCLAIMER:</b> This report is generated by an automated machine learning ensemble "
        "decision-support system. It is NOT an FDA/CE-cleared primary diagnostic device. Final diagnostic decisions "
        "and patient management remain the sole responsibility of the attending licensed physician."
    )
    story.append(Paragraph(disclaimer, ParagraphStyle("Disc", parent=body_style, fontSize=7, leading=10, textColor=colors.HexColor("#94A3B8"))))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
