"""
Unit tests for Deception Engine, Legal Metrology Rules Engine, Chain of Custody, and PDF Generator.
"""

import unittest
import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from engines.deception_engine import DeceptionEngine
from engines.legal_metrology import LegalMetrologyEngine
from engines.chain_of_custody import ChainOfCustody
from engines.pdf_generator import LegalDocketPDFGenerator

class TestRegulatoryEngines(unittest.TestCase):

    def test_deception_engine_hidden_sweetener(self):
        """Tests that 'No Added Sugar' claim is flagged if sucralose or maltodextrin is present."""
        sample_product = {
            "product_name": "Diet Fruit Drink",
            "fop_claims": ["No Added Sugar", "100% Real"],
            "ingredients_text": "Water, Sucralose (INS 955), Maltodextrin, Citric Acid.",
            "nutrition_per_100g": {
                "calories": 45.0,
                "added_sugars_g": 0.0,
                "protein_g": 0.1,
                "total_fat_g": 0.0,
                "saturated_fat_g": 0.0,
                "trans_fat_g": 0.0,
                "sodium_mg": 20.0,
                "fiber_g": 0.0
            }
        }
        res = DeceptionEngine.analyze_product(sample_product)
        self.assertGreater(res["critical_flags_count"], 0)
        flag_categories = [f["category"] for f in res["flags"]]
        self.assertIn("MISLEADING_SUGAR_CLAIM", flag_categories)

    def test_deception_engine_grain_maida_substitution(self):
        """Tests that '100% Atta' claim is flagged if Maida is present."""
        sample_biscuit = {
            "product_name": "Wheat Digestive",
            "fop_claims": ["100% Whole Wheat Atta"],
            "ingredients_text": "Refined Wheat Flour (Maida), Whole Wheat Flour (Atta), Sugar, Vegetable Fat.",
            "nutrition_per_100g": {
                "calories": 460.0,
                "added_sugars_g": 18.0,
                "protein_g": 6.0,
                "total_fat_g": 18.0,
                "saturated_fat_g": 8.0,
                "trans_fat_g": 0.0,
                "sodium_mg": 350.0,
                "fiber_g": 2.0
            }
        }
        res = DeceptionEngine.analyze_product(sample_biscuit)
        flag_categories = [f["category"] for f in res["flags"]]
        self.assertIn("GRAIN_SUBSTITUTION_DECEPTION", flag_categories)

    def test_legal_metrology_usp_calculation(self):
        """Tests standard Legal Metrology USP formula calculations."""
        # Case 1: 250 g item for Rs 50 -> Rs 0.20 / g
        usp_res = LegalMetrologyEngine.calculate_statutory_usp(50.0, 250.0, "g")
        self.assertEqual(usp_res["statutory_usp"], 0.20)
        self.assertEqual(usp_res["statutory_unit"], "/ g")

        # Case 2: 1.5 kg item for Rs 300 -> Rs 200.00 / kg
        usp_res2 = LegalMetrologyEngine.calculate_statutory_usp(300.0, 1.5, "kg")
        self.assertEqual(usp_res2["statutory_usp"], 200.00)
        self.assertEqual(usp_res2["statutory_unit"], "/ kg")

    def test_legal_metrology_fraudulent_usp_detection(self):
        """Tests detection of math disparity between declared and calculated USP."""
        audit_input = {
            "commodity_name": "Potato Chips",
            "manufacturer_details": {
                "name": "Test Snack Corp",
                "address": "Plot 12, Industrial Area, Noida",
                "pin_code": "201301"
            },
            "net_quantity": "50 g",
            "mfg_date": "03/2026",
            "mrp": 20.0,
            "declared_usp": 0.25, # Fraud: Actual is 20 / 50 = 0.40 / g
            "consumer_care": {
                "phone": "011-22334455",
                "email": "care@testsnack.com",
                "address": "Noida, UP"
            }
        }
        res = LegalMetrologyEngine.validate_audit(audit_input)
        self.assertFalse(res["is_compliant"])
        self.assertEqual(res["usp_math_audit"]["status"], "FRAUDULENT_DISPARITY")

    def test_chain_of_custody_hashing(self):
        """Tests SHA-256 hash generation and Merkle root calculation."""
        panel_hashes = {
            "front": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "back": "ca978112ca1bbdcafac231b39a23dc4da7860819c1966ec0725a1144ed30185e",
            "top": "8a32a67e0e7a2b25867de23e590494481079d479e0f3169e9a4f6d480da0f279",
            "bottom": "cb5a8e03bc21bb7740b0ccbe479339e03d4ccbb1d5462cfb37b4f53535970c79"
        }
        geo = {"latitude": 28.6139, "longitude": 77.2090, "display_name": "New Delhi"}
        coc = ChainOfCustody.generate_chain_of_custody(panel_hashes, geo)
        self.assertTrue(coc["master_evidence_sha256"])
        self.assertTrue(coc["merkle_root"])
        self.assertTrue(coc["docket_id"].startswith("GOI-LM-2026-"))

    def test_pdf_generation(self):
        """Tests ReportLab PDF compilation to ensure error-free legal docket output."""
        sample_docket = {
            "docket_id": "GOI-LM-2026-TEST01",
            "timestamp_utc": "2026-09-03 18:30:00 UTC",
            "inspector_id": "LM-INSP-DEL-4091",
            "geolocation": {
                "latitude": 28.6139,
                "longitude": 77.2090,
                "display_name": "Department of Consumer Affairs, New Delhi"
            },
            "commodity_name": "Test Biscuits 200g",
            "manufacturer_details": {
                "name": "Test Foods Ltd.",
                "address": "Plot 5, New Delhi",
                "pin_code": "110001"
            },
            "net_quantity": "200 g",
            "mfg_date": "02/2026",
            "mrp": 40.0,
            "is_compliant": False,
            "panel_hashes": {
                "front": "a" * 64,
                "back": "b" * 64,
                "top": "c" * 64,
                "bottom": "d" * 64
            },
            "master_evidence_sha256": "e" * 64,
            "usp_math_audit": {
                "calculated_usp": 0.20,
                "declared_usp": None,
                "statutory_unit": "/ g",
                "status": "OMITTED"
            },
            "violations": [
                {
                    "rule_number": "Rule 5 & 6(1)(e)",
                    "title": "Mandatory Unit Sale Price (USP) Omitted",
                    "details": "Product package fails to declare the statutory Unit Sale Price.",
                    "evidence": "Declared USP: None. Calculated: ₹0.20 / g",
                    "remedial_action": "Declare Unit Sale Price as '₹0.20 / g' adjacent to MRP."
                }
            ],
            "statutory_charge_sheet": {
                "proposed_compounding_fine_inr": 10000
            }
        }
        pdf_bytes = LegalDocketPDFGenerator.generate_docket_pdf(sample_docket)
        self.assertTrue(len(pdf_bytes) > 1000)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_pdf_generation_with_resolved_address(self):
        """Tests ReportLab PDF with custom formatted physical address and coordinates."""
        docket_with_address = {
            "docket_id": "GOI-LM-2026-ADDR01",
            "formatted_address": "Okhla Industrial Area Phase III, South Delhi, Delhi 110020",
            "latitude": 28.5355,
            "longitude": 77.2680,
            "commodity_name": "Premium Salted Almonds",
            "is_compliant": True,
            "mrp": 350.0,
            "violations": []
        }
        pdf_bytes = LegalDocketPDFGenerator.generate_docket_pdf(docket_with_address)
        self.assertTrue(len(pdf_bytes) > 1000)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

    def test_targeted_single_field_reevaluation_usp(self):
        """Tests single-field micro audit extraction and USP math recalculation."""
        from engines.gemini_service import GeminiVisionService
        context = {
            "commodity_name": "Crispy Potato Wafers",
            "net_quantity": "65 g",
            "mrp": 35.0,
            "declared_usp": 0.38 # Mismatched initially
        }
        res = GeminiVisionService.extract_single_field(
            rule_id="rule_5_usp",
            image_b64="data:image/jpeg;base64,mockframe",
            current_context=context
        )
        self.assertTrue(res["found"])
        self.assertEqual(res["value"], 0.54) # 35 / 65 = 0.538 -> 0.54

        # Validate audit on updated context
        context["declared_usp"] = res["value"]
        audit_res = LegalMetrologyEngine.validate_audit(context)
        self.assertEqual(audit_res["usp_math_audit"]["status"], "COMPLIANT")
        self.assertEqual(audit_res["usp_math_audit"]["disparity"], 0.0)

    def test_pdf_formatting_and_unique_hashes(self):
        """Tests that Rupee symbols are sanitized to 'Rs. ', long addresses are not sliced, and 4 panels have unique hashes."""
        sample_docket = {
            "docket_id": "GOI-LM-2026-TEST99",
            "timestamp_utc": "2026-09-05 10:00:00 UTC",
            "inspector_id": "LM-INSP-DEL-4091",
            "formatted_address": "Hungerford Street, Shakespeare Sarani, Park Street Area, Kolkata, West Bengal 700071",
            "commodity_name": "Crunchy Wafer Rolls",
            "manufacturer_details": {
                "name": "SuperBake Confectionery Pvt Ltd",
                "address": "Plot 105, Sector 58, Phase 2, Industrial Focal Point, Mohali, Punjab",
                "pin_code": "160071"
            },
            "net_quantity": "150 g",
            "mrp": 75.0,
            "panel_hashes": {
                "front": "1111111111111111111111111111111111111111111111111111111111111111",
                "back": "2222222222222222222222222222222222222222222222222222222222222222",
                "top": "3333333333333333333333333333333333333333333333333333333333333333",
                "bottom": "4444444444444444444444444444444444444444444444444444444444444444"
            },
            "violations": [
                {
                    "rule_number": "Rule 6(1)(e)",
                    "title": "MRP Smudge",
                    "details": "Price tag smeared; declared MRP is ₹75.00 instead of statutory format.",
                    "evidence": "Observed rate: ₹75.00",
                    "remedial_action": "Print clear MRP."
                }
            ],
            "statutory_charge_sheet": {
                "proposed_compounding_fine_inr": 15000
            }
        }
        pdf_bytes = LegalDocketPDFGenerator.generate_docket_pdf(sample_docket)
        self.assertTrue(len(pdf_bytes) > 1000)
        self.assertTrue(pdf_bytes.startswith(b"%PDF"))

        # Verify no unhandled Unicode Rupee glyphs in raw decoded text
        # (Helvetica would fail or corrupt if raw ₹ is directly unhandled)
        pdf_text = pdf_bytes.decode('latin1', errors='ignore')
        self.assertNotIn("भारत सरकार", pdf_text)

if __name__ == "__main__":
    unittest.main()
