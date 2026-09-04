"""
ReportLab PDF Generation Engine for Legal Metrology Section 36(1) Dockets.
Produces an official, evidentiary statutory inspection report & compounding notice.
"""

import io
import base64
from datetime import datetime
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, KeepTogether, HRFlowable, Image
)
from reportlab.lib.units import inch, cm

# Government Civic Colors
NAVY_BLUE = colors.HexColor("#1A365D")
SLATE_BG = colors.HexColor("#F7FAFC")
CRIMSON = colors.HexColor("#C53030")
EMERALD = colors.HexColor("#2F855A")
DARK_GRAY = colors.HexColor("#2D3748")
LIGHT_GRAY = colors.HexColor("#E2E8F0")
MID_GRAY = colors.HexColor("#718096")

class LegalDocketPDFGenerator:
    """Generates official Section 36(1) Legal Metrology Statutory Dockets."""

    @staticmethod
    def generate_docket_pdf(docket_data: Dict[str, Any]) -> bytes:
        """
        Creates a PDF binary buffer for the statutory inspection report.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Custom Typography Styles
        title_style = ParagraphStyle(
            'GovTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=13,
            leading=16,
            textColor=NAVY_BLUE,
            alignment=1 # Center
        )
        subtitle_style = ParagraphStyle(
            'GovSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=MID_GRAY,
            alignment=1
        )
        header_badge_style = ParagraphStyle(
            'HeaderBadge',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=colors.white,
            alignment=1
        )
        section_heading = ParagraphStyle(
            'SectionHeading',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            leading=13,
            textColor=NAVY_BLUE
        )
        body_text = ParagraphStyle(
            'GovBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8.5,
            leading=11,
            textColor=DARK_GRAY
        )
        body_bold = ParagraphStyle(
            'GovBodyBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8.5,
            leading=11,
            textColor=DARK_GRAY
        )
        code_style = ParagraphStyle(
            'GovCode',
            parent=styles['Normal'],
            fontName='Courier',
            fontSize=7,
            leading=9,
            textColor=NAVY_BLUE
        )
        viol_text = ParagraphStyle(
            'ViolText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=CRIMSON
        )
        comp_text = ParagraphStyle(
            'CompText',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            leading=10,
            textColor=EMERALD
        )

        elements = []

        # -------------------------------------------------------------
        # 1. Government Header & Insignia
        # -------------------------------------------------------------
        elements.append(Paragraph("भारत सरकार | GOVERNMENT OF INDIA", title_style))
        elements.append(Paragraph("MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION", title_style))
        elements.append(Paragraph("DEPARTMENT OF CONSUMER AFFAIRS • LEGAL METROLOGY DIVISION", subtitle_style))
        elements.append(Spacer(1, 4))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=NAVY_BLUE, spaceAfter=8, spaceBefore=4))

        # Title Banner
        docket_id = docket_data.get("docket_id", "GOI-LM-2026-UNKNOWN")
        is_compliant = docket_data.get("is_compliant", False)
        status_text = "STATUTORY COMPLIANT DOCKET" if is_compliant else "NOTICE OF VIOLATION & COMPOUNDING PROCEEDINGS"
        banner_bg = EMERALD if is_compliant else CRIMSON

        banner_table = Table(
            [[Paragraph(f"<b>{status_text} • SECTION 36(1) LEGAL METROLOGY ACT, 2009</b>", header_badge_style)]],
            colWidths=[523]
        )
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), banner_bg),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        elements.append(banner_table)
        elements.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 2. Metadata & Geolocation Block
        # -------------------------------------------------------------
        timestamp_str = docket_data.get("timestamp_utc", datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"))
        inspector_id = docket_data.get("inspector_id", "LM-INSP-DEL-4091")
        geo = docket_data.get("geolocation", {})
        lat_lon = f"{geo.get('latitude', '28.6139'):.6f}° N, {geo.get('longitude', '77.2090'):.6f}° E" if isinstance(geo.get('latitude'), (int, float)) else "N/A"
        loc_name = geo.get("display_name", "Central District, New Delhi, India")

        meta_data = [
            [
                Paragraph("<b>Docket Reference ID:</b>", body_bold),
                Paragraph(docket_id, code_style),
                Paragraph("<b>Inspection Date/Time:</b>", body_bold),
                Paragraph(timestamp_str, body_text)
            ],
            [
                Paragraph("<b>Inspecting Officer:</b>", body_bold),
                Paragraph(f"{inspector_id} (Authorised LM Officer)", body_text),
                Paragraph("<b>GPS Coordinates:</b>", body_bold),
                Paragraph(lat_lon, body_text)
            ],
            [
                Paragraph("<b>Location / Premises:</b>", body_bold),
                Paragraph(loc_name[:65] + ("..." if len(loc_name) > 65 else ""), body_text),
                Paragraph("<b>Evidentiary Standard:</b>", body_bold),
                Paragraph("Sec 65B BSA Cryptographic Audit", body_text)
            ]
        ]

        meta_table = Table(meta_data, colWidths=[110, 150, 110, 153])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SLATE_BG),
            ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 3. Product & Pricing / USP Audit
        # -------------------------------------------------------------
        elements.append(Paragraph("I. PRODUCT IDENTITY & UNIT SALE PRICE (USP) AUDIT", section_heading))
        elements.append(Spacer(1, 3))

        commodity = docket_data.get("commodity_name", "N/A")
        mfg = docket_data.get("manufacturer_details", {})
        mfg_str = f"{mfg.get('name', 'N/A')}, {mfg.get('address', 'N/A')} (PIN: {mfg.get('pin_code', 'N/A')})"
        net_qty = docket_data.get("net_quantity", "N/A")
        mfg_date = docket_data.get("mfg_date", "N/A")
        mrp = docket_data.get("mrp", 0.0)
        
        usp_audit = docket_data.get("usp_math_audit", {})
        calc_usp = usp_audit.get("calculated_usp", "N/A")
        stat_unit = usp_audit.get("statutory_unit", "")
        dec_usp = usp_audit.get("declared_usp", "NOT DECLARED")
        usp_status = usp_audit.get("status", "N/A")

        prod_data = [
            [
                Paragraph("<b>Commodity Name:</b>", body_bold),
                Paragraph(commodity, body_text),
                Paragraph("<b>Net Quantity:</b>", body_bold),
                Paragraph(str(net_qty), body_text)
            ],
            [
                Paragraph("<b>Manufacturer / Packer:</b>", body_bold),
                Paragraph(mfg_str[:55] + ("..." if len(mfg_str) > 55 else ""), body_text),
                Paragraph("<b>Date of Packing:</b>", body_bold),
                Paragraph(str(mfg_date), body_text)
            ],
            [
                Paragraph("<b>Maximum Retail Price:</b>", body_bold),
                Paragraph(f"₹{mrp:.2f} (incl. of all taxes)", body_bold),
                Paragraph("<b>Declared USP:</b>", body_bold),
                Paragraph(f"₹{dec_usp} {stat_unit}" if dec_usp is not None else "<font color='#C53030'><b>OMITTED (Violation)</b></font>", body_text)
            ],
            [
                Paragraph("<b>Statutory USP (Calculated):</b>", body_bold),
                Paragraph(f"₹{calc_usp} {stat_unit} (Rule 5 Formula)", body_bold),
                Paragraph("<b>USP Math Audit:</b>", body_bold),
                Paragraph(f"<font color='{'#2F855A' if usp_status == 'COMPLIANT' else '#C53030'}'><b>{usp_status}</b></font>", body_text)
            ]
        ]

        prod_table = Table(prod_data, colWidths=[125, 145, 115, 138])
        prod_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(prod_table)
        elements.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 4. Chain of Custody & Forensic SHA-256 Evidence
        # -------------------------------------------------------------
        elements.append(Paragraph("II. FORENSIC CHAIN OF CUSTODY (SHA-256 DIGITAL HASHES)", section_heading))
        elements.append(Spacer(1, 3))

        panel_hashes = docket_data.get("panel_hashes", {})
        master_hash = docket_data.get("master_evidence_sha256", "N/A")

        hash_data = [
            [Paragraph("<b>Evidence Panel</b>", body_bold), Paragraph("<b>SHA-256 Cryptographic Fingerprint (Section 65B BSA Admissible)</b>", body_bold)],
            [Paragraph("Panel 1: FRONT", body_text), Paragraph(panel_hashes.get("front", "N/A"), code_style)],
            [Paragraph("Panel 2: BACK", body_text), Paragraph(panel_hashes.get("back", "N/A"), code_style)],
            [Paragraph("Panel 3: TOP", body_text), Paragraph(panel_hashes.get("top", "N/A"), code_style)],
            [Paragraph("Panel 4: BOTTOM", body_text), Paragraph(panel_hashes.get("bottom", "N/A"), code_style)],
            [
                Paragraph("<b>MASTER MERKLE ROOT:</b>", body_bold),
                Paragraph(f"<b>{master_hash}</b>", code_style)
            ]
        ]

        hash_table = Table(hash_data, colWidths=[110, 413])
        hash_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), SLATE_BG),
            ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor("#EDF2F7")),
        ]))
        elements.append(hash_table)
        elements.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 5. Statutory Violations & Charge Sheet
        # -------------------------------------------------------------
        elements.append(Paragraph("III. STATUTORY DECLARATION AUDIT & VIOLATIONS", section_heading))
        elements.append(Spacer(1, 3))

        violations = docket_data.get("violations", [])
        if violations:
            v_rows = [
                [
                    Paragraph("<b>Rule Invoked</b>", body_bold),
                    Paragraph("<b>Violation Category</b>", body_bold),
                    Paragraph("<b>Evidentiary Deficiency & Statutory Details</b>", body_bold),
                    Paragraph("<b>Remedial Directive</b>", body_bold)
                ]
            ]
            for v in violations:
                v_rows.append([
                    Paragraph(f"<b>{v.get('rule_number', 'Rule 6')}</b>", viol_text),
                    Paragraph(v.get("title", ""), body_bold),
                    Paragraph(f"{v.get('details', '')}<br/><b>Evidence:</b> {v.get('evidence', '')}", body_text),
                    Paragraph(v.get("remedial_action", ""), body_text)
                ])

            v_table = Table(v_rows, colWidths=[70, 110, 213, 130])
            v_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#FFF5F5")),
                ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
                ('TOPPADDING', (0, 0), (-1, -1), 3),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            elements.append(v_table)
        else:
            comp_table = Table(
                [[Paragraph("<b>NO STATUTORY VIOLATIONS DETECTED. ALL 6 MANDATORY DECLARATIONS & USP VERIFIED COMPLIANT.</b>", comp_text)]],
                colWidths=[523]
            )
            comp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F0FFF4")),
                ('GRID', (0, 0), (-1, -1), 0.5, EMERALD),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            elements.append(comp_table)

        elements.append(Spacer(1, 8))

        # -------------------------------------------------------------
        # 6. Compounding Assessment & Officer Sign-off
        # -------------------------------------------------------------
        charge_sheet = docket_data.get("statutory_charge_sheet", {})
        fine_inr = charge_sheet.get("proposed_compounding_fine_inr", 0)

        pen_data = [
            [
                Paragraph("<b>Statutory Action Proposed:</b>", body_bold),
                Paragraph(f"Prosecution under Section 36(1) Legal Metrology Act, 2009" if violations else "Certified Compliant - Clean Docket Entry", body_text),
                Paragraph("<b>Compounding Fine Assessed:</b>", body_bold),
                Paragraph(f"<b>₹{fine_inr:,} INR</b>" if fine_inr > 0 else "NIL (Clean Record)", body_bold)
            ]
        ]
        pen_table = Table(pen_data, colWidths=[130, 150, 130, 113])
        pen_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), SLATE_BG),
            ('GRID', (0, 0), (-1, -1), 0.5, LIGHT_GRAY),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        elements.append(pen_table)
        elements.append(Spacer(1, 14))

        # Signatures
        sig_data = [
            [
                Paragraph("<b>Digital Verification Seal:</b><br/><font size='7' color='#718096'>CRYPTOGRAPHICALLY VERIFIED<br/>GOVERNMENT OF INDIA REGULATORY NODE</font>", body_text),
                Paragraph("<b>Inspecting Legal Metrology Officer:</b><br/><br/>____________________________________<br/>(Seal & Signature of Authorized Officer)", body_text)
            ]
        ]
        sig_table = Table(sig_data, colWidths=[260, 263])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ]))
        elements.append(KeepTogether(sig_table))

        # Build PDF
        doc.build(elements)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
