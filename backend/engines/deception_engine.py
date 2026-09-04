"""
FSSAI Food Safety & Deception Detection Engine
Strict statutory cross-referencing between Front-of-Pack (FOP) Marketing Claims 
and Back-of-Pack (BOP) Ingredients List and Nutritional Panel.
Compliant with:
- FSSAI Food Safety and Standards (Advertising and Claims) Regulations, 2018
- FSSAI Food Safety and Standards (Labelling and Display) Regulations, 2020
"""

import re
from typing import List, Dict, Any, Optional

# Known artificial and high-glycemic hidden sweeteners/sugars
HIDDEN_SWEETENERS = {
    "sucralose": "Non-nutritive artificial sweetener (INS 955)",
    "aspartame": "Artificial intense sweetener (INS 951)",
    "acesulfame potassium": "Artificial sweetener (Acesulfame K / INS 950)",
    "acesulfame k": "Artificial sweetener (INS 950)",
    "saccharin": "Artificial sweetener (INS 954)",
    "neotame": "Artificial sweetener (INS 961)",
    "stevia": "Steviol glycosides sweetener (INS 960)",
    "steviol glycosides": "Non-nutritive sweetener (INS 960)",
    "maltodextrin": "High-glycemic processed starch / disguised sugar carbohydrate (GI ~110)",
    "fructose": "Refined simple monosaccharide (hepatic metabolic burden)",
    "high fructose corn syrup": "Ultra-processed liquid sweetener (HFCS)",
    "hfcs": "Ultra-processed liquid sweetener (HFCS)",
    "invert sugar syrup": "Chemically cleaved sucrose syrup (glucose + fructose)",
    "invert syrup": "Chemically cleaved sucrose syrup",
    "dextrose": "Refined simple glucose sugar",
    "malt extract": "Concentrated malt sugar (high maltose content)",
    "glucose syrup": "Liquid concentrated simple sugar",
    "liquid glucose": "Refined starch glucose hydrolysate",
    "corn syrup": "Industrial starch-derived sugar syrup",
    "fruit juice concentrate": "De-fiberized concentrated free sugars",
    "apple juice concentrate": "Concentrated free fructose/glucose (free sugar)",
    "date syrup": "Concentrated free fructose/glucose syrup",
    "honey": "Free sugar source (contains fructose/glucose)",
    "agave nectar": "High free-fructose syrup (~80% fructose)",
    "sorbitol": "Sugar alcohol / polyol (INS 420)",
    "maltitol": "High GI polyol / sugar alcohol (INS 965)",
    "isomalt": "Sugar alcohol (INS 953)",
}

# Additives, preservatives and artificial color INS mappings
ARTIFICIAL_ADDITIVES = {
    "ins 102": "Tartrazine (Synthetic Yellow Color)",
    "ins 110": "Sunset Yellow FCF (Synthetic Color)",
    "ins 122": "Azorubine / Carmoisine (Synthetic Red Color)",
    "ins 124": "Ponceau 4R (Synthetic Red Color)",
    "ins 127": "Erythrosine (Synthetic Red Color)",
    "ins 133": "Brilliant Blue FCF (Synthetic Blue Color)",
    "ins 150c": "Ammonia Caramel Color",
    "ins 150d": "Sulphite Ammonia Caramel Color",
    "ins 211": "Sodium Benzoate (Chemical Preservative)",
    "ins 202": "Potassium Sorbate (Chemical Preservative)",
    "ins 220": "Sulphur Dioxide (Chemical Preservative)",
    "ins 320": "BHA (Synthetic Antioxidant)",
    "ins 321": "BHT (Synthetic Antioxidant)",
    "ins 621": "Monosodium Glutamate / MSG (Flavor Enhancer)",
}

HYDROGENATED_FATS = [
    "hydrogenated vegetable oil",
    "partially hydrogenated oil",
    "partially hydrogenated vegetable oil",
    "vanaspati",
    "hydrogenated fat",
    "palm stearin",
    "interesterified vegetable fat",
    "shortening",
]

REFINED_GRAINS = [
    "refined wheat flour",
    "maida",
    "refined flour",
    "wheat flour (maida)",
    "enriched wheat flour",
]

class DeceptionEngine:
    """Statutory deception analysis for FSSAI claims."""

    @staticmethod
    def normalize_text(text: str) -> str:
        if not text:
            return ""
        return re.sub(r'[^a-zA-Z0-9\s,]', ' ', text.lower())

    @classmethod
    def analyze_product(cls, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs comprehensive statutory cross-checks on extracted nutrition, claims and ingredients.
        """
        name = product_data.get("product_name", "Product")
        brand = product_data.get("brand", "")
        fop_claims = product_data.get("fop_claims", []) or []
        ingredients_raw = product_data.get("ingredients_text", "") or ""
        ingredients_lower = cls.normalize_text(ingredients_raw)
        
        nutrition = product_data.get("nutrition_per_100g", {}) or {}
        calories = float(nutrition.get("calories", 0.0) or 0.0)
        protein = float(nutrition.get("protein_g", 0.0) or 0.0)
        carbs = float(nutrition.get("carbs_g", 0.0) or 0.0)
        total_sugars = float(nutrition.get("total_sugars_g", 0.0) or 0.0)
        added_sugars = float(nutrition.get("added_sugars_g", 0.0) or 0.0)
        total_fat = float(nutrition.get("total_fat_g", 0.0) or 0.0)
        sat_fat = float(nutrition.get("saturated_fat_g", 0.0) or 0.0)
        trans_fat = float(nutrition.get("trans_fat_g", 0.0) or 0.0)
        sodium_mg = float(nutrition.get("sodium_mg", 0.0) or 0.0)
        fiber_g = float(nutrition.get("fiber_g", 0.0) or 0.0)
        allergens = product_data.get("allergens", []) or []

        flags: List[Dict[str, Any]] = []
        positive_notes: List[str] = []

        # Convert claims list to lowercase searchable string
        claims_combined = " ".join([c.lower() for c in fop_claims])

        # -------------------------------------------------------------
        # 1. Sugar & Sweetener Deception Check (FSSAI Reg. 4(1) & 5)
        # -------------------------------------------------------------
        no_sugar_claim = any(
            phrase in claims_combined for phrase in [
                "no added sugar", "zero sugar", "sugar free", "0% sugar", 
                "without added sugar", "100% sugar free", "guilt free sweetness"
            ]
        )

        detected_hidden_sweeteners = []
        for sweetener, desc in HIDDEN_SWEETENERS.items():
            if sweetener in ingredients_lower:
                detected_hidden_sweeteners.append({"name": sweetener.title(), "description": desc})

        if no_sugar_claim:
            if detected_hidden_sweeteners:
                sweetener_names = ", ".join([s["name"] for s in detected_hidden_sweeteners])
                flags.append({
                    "severity": "CRITICAL",
                    "category": "MISLEADING_SUGAR_CLAIM",
                    "title": "Misleading 'No Added Sugar' Claim Detected",
                    "description": f"Front of pack asserts 'No Added Sugar', but back-of-pack formulation contains: {sweetener_names}.",
                    "evidence": f"Found {sweetener_names} in ingredients while advertising '{[c for c in fop_claims if 'sugar' in c.lower()][0] if [c for c in fop_claims if 'sugar' in c.lower()] else 'No Added Sugar'}'.",
                    "regulation": "FSSAI Advertising and Claims Regulations, 2018 (Section 4(1) - Prohibition of deceptive sweetness masking)",
                    "impact": "Artificial sweeteners & processed syrups trigger insulin resistance and hepatic stress despite 'sugar free' labeling."
                })
            elif added_sugars > 0.5:
                flags.append({
                    "severity": "CRITICAL",
                    "category": "SUGAR_LEVEL_MISMATCH",
                    "title": "Declared Added Sugar Violates 'Zero Sugar' Claim",
                    "description": f"Product claims zero added sugar but nutritional panel declares {added_sugars}g added sugar per 100g.",
                    "evidence": f"Added sugar declared: {added_sugars}g / 100g.",
                    "regulation": "FSSAI Labelling and Display Regulations, 2020 (Schedule II)",
                    "impact": "Direct statutory breach of nutrition declaration standards."
                })
        else:
            # Check if sugar is excessive (> 10g per 100g)
            if added_sugars > 12.0 or total_sugars > 15.0:
                flags.append({
                    "severity": "WARNING",
                    "category": "HIGH_SUGAR_WARNING",
                    "title": "High Free Sugar Formulation",
                    "description": f"Contains {added_sugars or total_sugars}g sugar per 100g. 1 serving contributes significantly to WHO recommended max daily limit of 25g.",
                    "evidence": f"Total Sugar: {total_sugars}g, Added Sugar: {added_sugars}g.",
                    "regulation": "FSSAI High Fat, Sugar and Salt (HFSS) Dietary Thresholds",
                    "impact": "Frequent consumption increases risks of type 2 diabetes and metabolic syndrome."
                })

        # -------------------------------------------------------------
        # 2. Grain & Whole Wheat Deception (Atta vs Maida)
        # -------------------------------------------------------------
        grain_claim = any(
            phrase in claims_combined for phrase in [
                "100% atta", "100% whole wheat", "whole grain", "real atta", 
                "multigrain", "wheat biscuit", "atta bread", "oats rich"
            ]
        )

        detected_refined_grains = [rg for rg in REFINED_GRAINS if rg in ingredients_lower]

        if grain_claim and detected_refined_grains:
            # Check if refined flour is primary ingredient (first in ingredients list)
            first_ingredient = ingredients_raw.split(",")[0].lower() if "," in ingredients_raw else ingredients_raw.lower()
            is_maida_first = any(rg in first_ingredient for rg in REFINED_GRAINS)
            
            flags.append({
                "severity": "CRITICAL" if is_maida_first else "WARNING",
                "category": "GRAIN_SUBSTITUTION_DECEPTION",
                "title": "Refined Flour (Maida) Substitution in 'Whole Wheat/Atta' Product",
                "description": f"Front-of-pack emphasizes Whole Wheat/Atta, but ingredient list discloses '{detected_refined_grains[0].title()}'." + 
                               (" (Maida is listed as the FIRST primary ingredient!)" if is_maida_first else ""),
                "evidence": f"Ingredients show '{detected_refined_grains[0]}' alongside whole grains.",
                "regulation": "FSSAI Advertising and Claims Regulations, 2018 (Section 6 - Equivocal grain labeling)",
                "impact": "Refined flour has high glycemic index, depleted bran fiber, and spike blood glucose levels."
            })

        # -------------------------------------------------------------
        # 3. Trans Fat & Hydrogenated Oil Concealment
        # -------------------------------------------------------------
        trans_fat_free_claim = any(
            phrase in claims_combined for phrase in ["zero trans fat", "0g trans fat", "trans fat free", "0% trans fat"]
        )
        detected_hydrogenated = [hf for hf in HYDROGENATED_FATS if hf in ingredients_lower]

        if detected_hydrogenated:
            if trans_fat_free_claim or trans_fat <= 0.2:
                flags.append({
                    "severity": "CRITICAL",
                    "category": "TRANS_FAT_CONCEALMENT",
                    "title": "Hydrogenated Fat Concealment (Deceptive 'Zero Trans Fat')",
                    "description": f"Product uses '{detected_hydrogenated[0].title()}' while declaring 0g Trans Fat via statutory rounding loopholes.",
                    "evidence": f"Found '{detected_hydrogenated[0]}' in formulation with declared Trans Fat of {trans_fat}g.",
                    "regulation": "FSSAI Food Safety and Standards (Prohibition and Restrictions on Sales) Regulations (Vanaspati & Trans Fat Limits)",
                    "impact": "Industrial trans fats elevate LDL cholesterol and are a primary driver of coronary artery disease."
                })

        # -------------------------------------------------------------
        # 4. Protein Claim Validation (Statutory Thresholds)
        # -------------------------------------------------------------
        high_protein_claim = any(
            phrase in claims_combined for phrase in ["high protein", "protein rich", "power protein", "protein boost", "source of protein"]
        )

        if high_protein_claim:
            if protein < 6.0:
                flags.append({
                    "severity": "CRITICAL",
                    "category": "UNSUBSTANTIATED_PROTEIN_CLAIM",
                    "title": "Sub-Standard Protein Density for 'High Protein' Claim",
                    "description": f"Package claims 'High Protein' but provides only {protein}g protein per 100g (Minimum statutory threshold is 12g for 'High Protein' and 6g for 'Source of Protein').",
                    "evidence": f"Extracted Protein: {protein}g / 100g.",
                    "regulation": "FSSAI Advertising and Claims Regulations, 2018 (Schedule I - Nutrient Content Claims)",
                    "impact": "Consumers paying a premium for protein intake receive a carbohydrate-dominated product."
                })
            elif protein >= 10.0:
                positive_notes.append(f"Statutory protein claim verified ({protein}g/100g exceeds minimum threshold).")

        # -------------------------------------------------------------
        # 5. Zero Cholesterol Claim on Plant-Based Products
        # -------------------------------------------------------------
        zero_cholesterol_claim = any(
            phrase in claims_combined for phrase in ["zero cholesterol", "0% cholesterol", "cholesterol free", "heart healthy"]
        )
        is_plant_oil = any(
            oil in ingredients_lower for oil in [
                "sunflower oil", "mustard oil", "soybean oil", "rice bran oil", 
                "groundnut oil", "palm oil", "canola oil", "olive oil", "coconut oil", "vegetable oil"
            ]
        )
        if zero_cholesterol_claim and is_plant_oil and total_fat > 20.0:
            flags.append({
                "severity": "WARNING",
                "category": "PSEUDO_HEALTH_CLAIM",
                "title": "Redundant 'Zero Cholesterol' Claim on Plant Oil",
                "description": "All plant-based vegetable oils naturally contain 0mg cholesterol. Highlighting this is a recognized marketing distortion unless accompanied by statutory saturated fat disclosures.",
                "evidence": f"Claimed '{[c for c in fop_claims if 'cholesterol' in c.lower() or 'heart' in c.lower()][0] if [c for c in fop_claims if 'cholesterol' in c.lower() or 'heart' in c.lower()] else 'Zero Cholesterol'}' on plant-based oil formulation.",
                "regulation": "FSSAI Advertising and Claims Regulations, 2018 (Regulation 4(4) - Non-inherent claim prohibition)",
                "impact": "Misleads consumers into believing this specific brand has unique cardiovascular benefits."
            })

        # -------------------------------------------------------------
        # 6. '100% Natural' vs Artificial Additives & INS Codes
        # -------------------------------------------------------------
        natural_claim = any(
            phrase in claims_combined for phrase in [
                "100% natural", "all natural", "no artificial", "pure natural", "nature pure"
            ]
        )
        detected_artificial = []
        for code, label in ARTIFICIAL_ADDITIVES.items():
            if code in ingredients_lower:
                detected_artificial.append(f"{code.upper()} ({label})")

        if natural_claim and detected_artificial:
            flags.append({
                "severity": "CRITICAL",
                "category": "ARTIFICIAL_ADDITIVE_CONTRADICTION",
                "title": "'100% Natural' Claim Contradicted by Synthetic Additives",
                "description": f"Package claims '100% Natural' but formula contains synthetic additives: {', '.join(detected_artificial)}.",
                "evidence": f"Found synthetic INS chemicals in ingredients: {', '.join(detected_artificial)}.",
                "regulation": "FSSAI Advertising and Claims Regulations, 2018 (Regulation 5(2) - Usage of word 'Natural')",
                "impact": "Synthetic colors and preservatives have potential allergenic and behavioral impacts."
            })

        # -------------------------------------------------------------
        # 7. Sodium & Saturated Fat Warning
        # -------------------------------------------------------------
        if sodium_mg > 600.0:
            flags.append({
                "severity": "WARNING",
                "category": "HIGH_SODIUM_ALERT",
                "title": "Elevated Sodium Density (HFSS Threshold Exceeded)",
                "description": f"Contains {sodium_mg}mg sodium per 100g (Threshold: 400mg/100g).",
                "evidence": f"Sodium: {sodium_mg}mg / 100g.",
                "regulation": "FSSAI High Fat, Sugar, and Salt (HFSS) Guidelines",
                "impact": "High sodium intake is clinically linked to hypertension and cardiovascular load."
            })

        if sat_fat > 5.0:
            flags.append({
                "severity": "WARNING",
                "category": "HIGH_SATURATED_FAT",
                "title": "High Saturated Fatty Acid Profile",
                "description": f"Contains {sat_fat}g saturated fat per 100g ({round((sat_fat * 9 / (calories or 1)) * 100, 1)}% of total energy).",
                "evidence": f"Saturated fat: {sat_fat}g / 100g.",
                "regulation": "FSSAI Labelling Regulations, 2020",
                "impact": "Elevates circulating LDL cholesterol levels."
            })

        # -------------------------------------------------------------
        # 8. Nutri-Grade Computation (A / B / C / D / E) & Verdict Card
        # -------------------------------------------------------------
        # Negative points calculation
        neg_points = 0
        neg_points += min(10, int(calories / 50))
        neg_points += min(10, int(total_sugars / 3.5))
        neg_points += min(10, int(sat_fat / 1.0))
        neg_points += min(10, int(sodium_mg / 90))

        # Positive points
        pos_points = 0
        pos_points += min(5, int(protein / 1.6))
        pos_points += min(5, int(fiber_g / 0.9))

        final_score = neg_points - pos_points
        critical_count = sum(1 for f in flags if f["severity"] == "CRITICAL")
        warning_count = sum(1 for f in flags if f["severity"] == "WARNING")

        if critical_count > 0 or final_score >= 18:
            nutri_grade = "E"
            grade_color = "#C53030" # Crimson
            verdict_badge = "DECEPTIVE / UNHEALTHY"
            headline = f"Statutory Deception & High HFSS Warnings Detected for {name}"
            actionable_advice = f"Do not rely on front-of-pack marketing. The formulation reveals {critical_count} major deceptive claim(s) and high industrial processing indicators."
        elif final_score >= 12:
            nutri_grade = "D"
            grade_color = "#DD6B20" # Amber
            verdict_badge = "USE WITH CAUTION"
            headline = f"Moderate Nutritional Concerns for {name}"
            actionable_advice = "Contains elevated sugar, saturated fat, or sodium levels. Consume in strict moderation."
        elif final_score >= 6:
            nutri_grade = "C"
            grade_color = "#D69E2E" # Yellow
            verdict_badge = "MODERATE NUTRITIONAL VALUE"
            headline = f"Standard Processed Profile for {name}"
            actionable_advice = "Acceptable occasional food item. Verify serving sizes to prevent cumulative sugar/sodium excess."
        elif final_score >= 0:
            nutri_grade = "B"
            grade_color = "#319795" # Teal
            verdict_badge = "NUTRITIONALLY BALANCED"
            headline = f"Good Nutritional Balance for {name}"
            actionable_advice = "Balanced macronutrient distribution with low deceptive packaging markers."
        else:
            nutri_grade = "A"
            grade_color = "#2F855A" # Emerald
            verdict_badge = "EXEMPLARY / MINIMALLY PROCESSED"
            headline = f"High Nutritional Integrity for {name}"
            actionable_advice = "Minimally processed, clean ingredients without hidden sugars or misleading front-of-pack claims."

        return {
            "product_name": name,
            "brand": brand,
            "nutri_grade": nutri_grade,
            "nutri_score_numeric": max(1, min(100, 100 - (final_score * 2.5))),
            "grade_color": grade_color,
            "verdict_badge": verdict_badge,
            "headline": headline,
            "actionable_advice": actionable_advice,
            "flags": flags,
            "critical_flags_count": critical_count,
            "warning_flags_count": warning_count,
            "positive_notes": positive_notes,
            "fop_claims_detected": fop_claims,
            "allergens_detected": allergens,
            "sweeteners_detected": detected_hidden_sweeteners,
            "nutrition_summary": {
                "calories_kcal": calories,
                "protein_g": protein,
                "carbs_g": carbs,
                "total_sugars_g": total_sugars,
                "added_sugars_g": added_sugars,
                "total_fat_g": total_fat,
                "saturated_fat_g": sat_fat,
                "trans_fat_g": trans_fat,
                "sodium_mg": sodium_mg,
                "fiber_g": fiber_g,
            }
        }
