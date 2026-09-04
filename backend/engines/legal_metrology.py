"""
Legal Metrology Statutory Compliance & USP Math Validation Engine
Implements Rule 6 (Mandatory Declarations) and Rule 5 (Unit Sale Price) 
of the Legal Metrology (Packaged Commodities) Rules, 2011, under Section 36(1) of the Legal Metrology Act, 2009.
"""

import re
from typing import Dict, Any, List, Optional, Tuple

class LegalMetrologyEngine:
    """Rules and math validation engine for Legal Metrology Packaged Commodities."""

    @staticmethod
    def parse_net_quantity(qty_str: str) -> Tuple[Optional[float], Optional[str], Optional[float], Optional[str]]:
        """
        Parses declared quantity string (e.g. '250 g', '1.5 kg', '500 ml', '1 L', '10 N')
        Returns: (raw_value, raw_unit, normalized_value, standard_unit)
        """
        if not qty_str:
            return None, None, None, None
        
        match = re.search(r'([\d.]+)\s*([a-zA-Z]+)', str(qty_str).strip())
        if not match:
            return None, None, None, None
        
        try:
            val = float(match.group(1))
            unit = match.group(2).lower()
        except ValueError:
            return None, None, None, None

        if unit in ['g', 'gm', 'gms', 'gram', 'grams']:
            return val, 'g', val / 1000.0, 'kg'
        elif unit in ['kg', 'kgs', 'kilogram', 'kilograms']:
            return val, 'kg', val, 'kg'
        elif unit in ['ml', 'mls', 'millilitre', 'milliliter']:
            return val, 'ml', val / 1000.0, 'l'
        elif unit in ['l', 'ltr', 'litre', 'liter', 'litres']:
            return val, 'l', val, 'l'
        elif unit in ['n', 'nos', 'no', 'unit', 'units', 'piece', 'pcs']:
            return val, 'N', val, 'N'
        
        return val, unit, val, unit

    @classmethod
    def calculate_statutory_usp(cls, mrp: float, qty_val: float, qty_unit: str) -> Dict[str, Any]:
        """
        Calculates statutory Unit Sale Price according to Legal Metrology Rule 5.
        - Packages < 1 kg or < 1 L: declared in Rs. per g or Rs. per ml.
        - Packages >= 1 kg or >= 1 L: declared in Rs. per kg or Rs. per L.
        - Items by number: declared in Rs. per N / item.
        """
        if mrp <= 0 or qty_val <= 0:
            return {
                "statutory_usp": 0.0,
                "statutory_unit": "N/A",
                "display_str": "Invalid MRP/Qty"
            }

        unit_clean = qty_unit.lower()

        if unit_clean == 'g':
            if qty_val < 1000:
                usp = mrp / qty_val
                return {
                    "statutory_usp": round(usp, 2),
                    "statutory_unit": "/ g",
                    "display_str": f"₹{round(usp, 2):.2f} / g (₹{round(usp * 100, 2):.2f} / 100g)"
                }
            else:
                usp = mrp / (qty_val / 1000.0)
                return {
                    "statutory_usp": round(usp, 2),
                    "statutory_unit": "/ kg",
                    "display_str": f"₹{round(usp, 2):.2f} / kg"
                }
        elif unit_clean == 'kg':
            usp = mrp / qty_val
            return {
                "statutory_usp": round(usp, 2),
                "statutory_unit": "/ kg",
                "display_str": f"₹{round(usp, 2):.2f} / kg"
            }
        elif unit_clean == 'ml':
            if qty_val < 1000:
                usp = mrp / qty_val
                return {
                    "statutory_usp": round(usp, 2),
                    "statutory_unit": "/ ml",
                    "display_str": f"₹{round(usp, 2):.2f} / ml (₹{round(usp * 100, 2):.2f} / 100ml)"
                }
            else:
                usp = mrp / (qty_val / 1000.0)
                return {
                    "statutory_usp": round(usp, 2),
                    "statutory_unit": "/ L",
                    "display_str": f"₹{round(usp, 2):.2f} / L"
                }
        elif unit_clean in ['l', 'ltr', 'litre']:
            usp = mrp / qty_val
            return {
                "statutory_usp": round(usp, 2),
                "statutory_unit": "/ L",
                "display_str": f"₹{round(usp, 2):.2f} / L"
            }
        elif unit_clean in ['n', 'nos', 'unit', 'piece']:
            usp = mrp / qty_val
            return {
                "statutory_usp": round(usp, 2),
                "statutory_unit": "/ N",
                "display_str": f"₹{round(usp, 2):.2f} / N"
            }
        else:
            usp = mrp / qty_val
            return {
                "statutory_usp": round(usp, 2),
                "statutory_unit": f"/ {qty_unit}",
                "display_str": f"₹{round(usp, 2):.2f} / {qty_unit}"
            }

    @classmethod
    def validate_audit(cls, audit_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates 6 mandatory declarations and USP math integrity.
        """
        violations: List[Dict[str, Any]] = []
        compliant_rules: List[Dict[str, Any]] = []

        mfg_details = audit_input.get("manufacturer_details", {}) or {}
        commodity = audit_input.get("commodity_name", "") or ""
        net_qty_raw = audit_input.get("net_quantity", "") or ""
        mfg_date = audit_input.get("mfg_date", "") or ""
        mrp_raw = audit_input.get("mrp", 0.0)
        declared_usp_raw = audit_input.get("declared_usp", None)
        consumer_care = audit_input.get("consumer_care", {}) or {}
        fop_declaration_present = audit_input.get("fop_declaration_present", True)

        try:
            mrp = float(mrp_raw or 0.0)
        except (ValueError, TypeError):
            mrp = 0.0

        # -------------------------------------------------------------
        # Rule 6(1)(a): Manufacturer / Packer / Importer Name & Address + PIN
        # -------------------------------------------------------------
        mfg_name = mfg_details.get("name", "").strip()
        mfg_address = mfg_details.get("address", "").strip()
        mfg_pin = str(mfg_details.get("pin_code", "")).strip()

        has_valid_pin = bool(re.match(r'^[1-9][0-9]{5}$', mfg_pin))
        if not mfg_name or not mfg_address or not has_valid_pin:
            reasons = []
            if not mfg_name: reasons.append("Missing Manufacturer/Packer Name")
            if not mfg_address: reasons.append("Incomplete Postal Address")
            if not has_valid_pin: reasons.append("Missing or Invalid 6-digit Indian Postal PIN Code")
            
            violations.append({
                "rule_number": "Rule 6(1)(a)",
                "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                "category": "MANUFACTURER_DECLARATION_VIOLATION",
                "severity": "CRITICAL",
                "title": "Non-Compliant Manufacturer/Packer Address Declaration",
                "details": f"Incomplete details: {', '.join(reasons)}.",
                "evidence": f"Declared Name: '{mfg_name or 'N/A'}', Address: '{mfg_address or 'N/A'}', PIN: '{mfg_pin or 'N/A'}'.",
                "remedial_action": "Affix complete name, registered premise address and 6-digit postal PIN code.",
                "penalty_applicable": True
            })
        else:
            compliant_rules.append({
                "rule_number": "Rule 6(1)(a)",
                "title": "Manufacturer/Packer Declaration",
                "status": "COMPLIANT",
                "evidence": f"{mfg_name}, {mfg_address} - PIN {mfg_pin}"
            })

        # -------------------------------------------------------------
        # Rule 6(1)(b): Generic / Common Name of Commodity
        # -------------------------------------------------------------
        if not commodity or len(commodity.strip()) < 2:
            violations.append({
                "rule_number": "Rule 6(1)(b)",
                "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                "category": "COMMODITY_NAME_MISSING",
                "severity": "CRITICAL",
                "title": "Generic Name of Commodity Not Declared",
                "details": "The generic or common identity of the packaged commodity is omitted.",
                "evidence": "Generic name field is blank or obscured.",
                "remedial_action": "Clearly declare generic/common commodity name on principal display panel.",
                "penalty_applicable": True
            })
        else:
            compliant_rules.append({
                "rule_number": "Rule 6(1)(b)",
                "title": "Generic Commodity Identity",
                "status": "COMPLIANT",
                "evidence": commodity
            })

        # -------------------------------------------------------------
        # Rule 6(1)(c): Net Quantity in Standard Units
        # -------------------------------------------------------------
        qty_val, qty_unit, norm_val, norm_unit = cls.parse_net_quantity(str(net_qty_raw))
        if qty_val is None or qty_val <= 0 or not qty_unit:
            violations.append({
                "rule_number": "Rule 6(1)(c)",
                "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                "category": "NET_QUANTITY_NON_COMPLIANT",
                "severity": "CRITICAL",
                "title": "Invalid or Missing Net Quantity Declaration",
                "details": f"Declared net quantity '{net_qty_raw}' violates standard SI units (g, kg, ml, l, N).",
                "evidence": f"Declared Quantity: '{net_qty_raw}'",
                "remedial_action": "Declare net weight or measure in standard metric units.",
                "penalty_applicable": True
            })
        else:
            compliant_rules.append({
                "rule_number": "Rule 6(1)(c)",
                "title": "Net Quantity Declaration",
                "status": "COMPLIANT",
                "evidence": f"{qty_val} {qty_unit} (Standardized: {norm_val} {norm_unit})"
            })

        # -------------------------------------------------------------
        # Rule 6(1)(d): Month & Year of Manufacture / Packing / Import
        # -------------------------------------------------------------
        has_valid_date = bool(re.search(r'(0[1-9]|1[0-2]|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[/\s.-]?(20\d{2}|\d{2})', str(mfg_date), re.IGNORECASE))
        if not has_valid_date:
            violations.append({
                "rule_number": "Rule 6(1)(d)",
                "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                "category": "MFG_DATE_NON_COMPLIANT",
                "severity": "CRITICAL",
                "title": "Missing or Indecipherable Manufacturing Date",
                "details": f"Manufacturing/Packing date '{mfg_date or 'N/A'}' does not conform to MM/YYYY format.",
                "evidence": f"Declared Date: '{mfg_date or 'Missing'}'",
                "remedial_action": "Stamp legible Month and Year of manufacture/packing.",
                "penalty_applicable": True
            })
        else:
            compliant_rules.append({
                "rule_number": "Rule 6(1)(d)",
                "title": "Date of Manufacture/Packing",
                "status": "COMPLIANT",
                "evidence": mfg_date
            })

        # -------------------------------------------------------------
        # Rule 6(1)(e): Maximum Retail Price (MRP)
        # -------------------------------------------------------------
        if mrp <= 0:
            violations.append({
                "rule_number": "Rule 6(1)(e)",
                "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                "category": "MRP_DECLARATION_MISSING",
                "severity": "CRITICAL",
                "title": "MRP Omitted or Illegible",
                "details": "Maximum Retail Price inclusive of all taxes is not legibly printed.",
                "evidence": f"Declared MRP: ₹{mrp}",
                "remedial_action": "Print MRP in prominent bold typography with 'incl. of all taxes'.",
                "penalty_applicable": True
            })
        else:
            compliant_rules.append({
                "rule_number": "Rule 6(1)(e)",
                "title": "Maximum Retail Price Declaration",
                "status": "COMPLIANT",
                "evidence": f"₹{mrp:.2f} (Inclusive of all taxes)"
            })

        # -------------------------------------------------------------
        # Rule 6(1)(f): Consumer Care & Grievance Details
        # -------------------------------------------------------------
        care_contact = consumer_care.get("phone", "") or consumer_care.get("tel", "")
        care_email = consumer_care.get("email", "")
        care_address = consumer_care.get("address", "")
        
        has_care_email = bool(re.search(r'[\w\.-]+@[\w\.-]+\.\w+', str(care_email)))
        has_care_phone = bool(re.search(r'[\d\s-]{8,15}', str(care_contact)))

        if not (has_care_email or has_care_phone) or not care_address:
            violations.append({
                "rule_number": "Rule 6(1)(f)",
                "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                "category": "CONSUMER_CARE_OMISSION",
                "severity": "CRITICAL",
                "title": "Consumer Care & Grievance Redressal Incomplete",
                "details": "Mandatory Consumer Care Cell name, address, telephone/mobile number, or email address missing.",
                "evidence": f"Tel: '{care_contact or 'N/A'}', Email: '{care_email or 'N/A'}', Address: '{care_address or 'N/A'}'.",
                "remedial_action": "Provide complete contact information of designated Consumer Care officer.",
                "penalty_applicable": True
            })
        else:
            compliant_rules.append({
                "rule_number": "Rule 6(1)(f)",
                "title": "Consumer Care Redressal Cell",
                "status": "COMPLIANT",
                "evidence": f"Tel: {care_contact}, Email: {care_email}"
            })

        # -------------------------------------------------------------
        # Rule 5: Unit Sale Price (USP) Math & Pricing Fraud Validation
        # -------------------------------------------------------------
        usp_math_audit = {}
        if mrp > 0 and qty_val is not None and qty_val > 0:
            usp_calc = cls.calculate_statutory_usp(mrp, qty_val, qty_unit)
            calc_usp_val = usp_calc["statutory_usp"]
            calc_usp_unit = usp_calc["statutory_unit"]

            if declared_usp_raw is None or declared_usp_raw == "":
                violations.append({
                    "rule_number": "Rule 5 & Rule 6(1)(e)",
                    "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                    "category": "USP_MANDATORY_DECLARATION_MISSING",
                    "severity": "CRITICAL",
                    "title": "Mandatory Unit Sale Price (USP) Omitted",
                    "details": f"Product package fails to declare the statutory Unit Sale Price. Calculated USP for MRP ₹{mrp:.2f} and Net Qty {qty_val}{qty_unit} is ₹{calc_usp_val:.2f}{calc_usp_unit}.",
                    "evidence": f"Printed USP: None. Statutory Expected USP: ₹{calc_usp_val:.2f}{calc_usp_unit}.",
                    "remedial_action": f"Declare Unit Sale Price as '₹{calc_usp_val:.2f}{calc_usp_unit}' adjacent to MRP.",
                    "penalty_applicable": True
                })
                usp_math_audit = {
                    "declared_usp": None,
                    "calculated_usp": calc_usp_val,
                    "statutory_unit": calc_usp_unit,
                    "disparity": None,
                    "status": "OMITTED"
                }
            else:
                try:
                    dec_usp_num = float(declared_usp_raw)
                    disparity = round(abs(dec_usp_num - calc_usp_val), 2)
                    
                    if disparity > 0.01:
                        violations.append({
                            "rule_number": "Rule 5 - Pricing Integrity",
                            "statute": "Legal Metrology Act, 2009 Section 36(1)",
                            "category": "PRICING_FRAUD_MATH_DISPARITY",
                            "severity": "CRITICAL",
                            "title": "Unit Sale Price (USP) Mathematical Disparity / Pricing Fraud",
                            "details": f"Declared USP (₹{dec_usp_num:.2f}) deviates from statutory calculated USP (₹{calc_usp_val:.2f}) by ₹{disparity:.2f}.",
                            "evidence": f"Declared USP: ₹{dec_usp_num:.2f}{calc_usp_unit}, Calculated USP: ₹{calc_usp_val:.2f}{calc_usp_unit} (MRP ₹{mrp:.2f} ÷ {qty_val}{qty_unit}).",
                            "remedial_action": "Rectify USP printing to match exact mathematical unit quotient.",
                            "penalty_applicable": True
                        })
                        usp_math_audit = {
                            "declared_usp": dec_usp_num,
                            "calculated_usp": calc_usp_val,
                            "statutory_unit": calc_usp_unit,
                            "disparity": disparity,
                            "status": "FRAUDULENT_DISPARITY"
                        }
                    else:
                        compliant_rules.append({
                            "rule_number": "Rule 5",
                            "title": "Unit Sale Price (USP) Mathematical Verification",
                            "status": "COMPLIANT",
                            "evidence": f"Declared ₹{dec_usp_num:.2f}{calc_usp_unit} matches Calculated ₹{calc_usp_val:.2f}{calc_usp_unit}"
                        })
                        usp_math_audit = {
                            "declared_usp": dec_usp_num,
                            "calculated_usp": calc_usp_val,
                            "statutory_unit": calc_usp_unit,
                            "disparity": 0.0,
                            "status": "COMPLIANT"
                        }
                except (ValueError, TypeError):
                    violations.append({
                        "rule_number": "Rule 5",
                        "statute": "Legal Metrology (Packaged Commodities) Rules, 2011",
                        "category": "USP_FORMAT_ERROR",
                        "severity": "CRITICAL",
                        "title": "Invalid USP Value Format",
                        "details": f"Declared USP '{declared_usp_raw}' is not a valid numerical value.",
                        "evidence": f"Declared USP: '{declared_usp_raw}'",
                        "remedial_action": "Declare clean numerical unit sale price in INR.",
                        "penalty_applicable": True
                    })

        # -------------------------------------------------------------
        # Compounding Penalty Determination under Section 36(1)
        # -------------------------------------------------------------
        total_violations_count = len(violations)
        is_compliant = (total_violations_count == 0)

        estimated_statutory_fine = 0
        if not is_compliant:
            # Base compounding fee: ₹10,000 for first violation + ₹5,000 for each subsequent violation up to ₹25,000
            estimated_statutory_fine = min(25000, 10000 + ((total_violations_count - 1) * 5000))

        return {
            "is_compliant": is_compliant,
            "overall_verdict": "STATUTORY COMPLIANT" if is_compliant else "NON-COMPLIANT / SEIZURE ACTIONABLE",
            "violations_count": total_violations_count,
            "violations": violations,
            "compliant_rules": compliant_rules,
            "usp_math_audit": usp_math_audit,
            "statutory_charge_sheet": {
                "section": "Section 36(1), Legal Metrology Act, 2009",
                "rules_invoked": [v["rule_number"] for v in violations],
                "proposed_compounding_fine_inr": estimated_statutory_fine,
                "prosecution_jurisdiction": "Court of Judicial Magistrate First Class (JMFC) / Compounding Authority"
            }
        }
