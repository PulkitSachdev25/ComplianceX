"""
Government of India - FSSAI & Legal Metrology Regulatory Portal Backend
FastAPI server implementing Citizen Nutrition Deception Engine and Inspector Statutory Audit.
"""

import os
import io
import json
import logging
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

from config import config
from engines.deception_engine import DeceptionEngine
from engines.legal_metrology import LegalMetrologyEngine
from engines.chain_of_custody import ChainOfCustody
from engines.gemini_service import GeminiVisionService, PRESET_CITIZEN_PRODUCTS, PRESET_INSPECTOR_CASES
from engines.pdf_generator import LegalDocketPDFGenerator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("regulatory-portal")

app = FastAPI(
    title="Government of India - National Regulatory Portal API",
    description="Statutory enforcement backend for FSSAI nutrition deception detection and Legal Metrology Section 36(1) compliance audits.",
    version="2.0.0"
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Request & Response Schemas
# -------------------------------------------------------------
class CitizenProductInput(BaseModel):
    product_id: Optional[str] = "prod_1"
    preset_key: Optional[str] = None
    front_image_b64: Optional[str] = None
    back_image_b64: Optional[str] = None
    manual_data: Optional[Dict[str, Any]] = None

class CitizenAnalyzeRequest(BaseModel):
    products: List[CitizenProductInput]

class InspectorAuditRequest(BaseModel):
    preset_key: Optional[str] = None
    panels: Optional[Dict[str, Any]] = None # {"front": b64, "back": b64, "top": b64, "bottom": b64}
    panel_hashes: Optional[Dict[str, str]] = None
    geolocation: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, Any]] = None
    inspector_id: Optional[str] = "LM-INSP-DEL-4091"
    manual_data: Optional[Dict[str, Any]] = None

class OfflineSyncBatch(BaseModel):
    queue: List[Dict[str, Any]]

class TargetedRescanRequest(BaseModel):
    rule_id: str
    image_base64: str
    current_context: Optional[Dict[str, Any]] = None

# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@app.get("/api/health")
def health_check():
    return {
        "status": "OPERATIONAL",
        "jurisdiction": "Government of India - Ministry of Consumer Affairs & FSSAI",
        "timestamp": datetime.utcnow().isoformat(),
        "gemini_api_configured": bool(config.GEMINI_API_KEY)
    }

@app.get("/api/presets/citizen")
def get_citizen_presets():
    return {
        "presets": [
            {
                "key": "zero_sugar_juice",
                "name": "Zero Sugar Pomegranate Beverage",
                "tag": "Deceptive Sweeteners & Maltodextrin",
                "claims": ["Zero Sugar Added", "100% Real Fruit"],
                "preview": PRESET_CITIZEN_PRODUCTS["zero_sugar_juice"]
            },
            {
                "key": "atta_cookies",
                "name": "100% Whole Wheat Atta Biscuits",
                "tag": "Maida Substitution & Trans Fat Loophole",
                "claims": ["100% Whole Wheat Atta", "Zero Trans Fat"],
                "preview": PRESET_CITIZEN_PRODUCTS["atta_cookies"]
            },
            {
                "key": "protein_bar",
                "name": "High Protein Energy Bar",
                "tag": "Sub-threshold Protein Density",
                "claims": ["High Protein Powerhouse", "100% Natural"],
                "preview": PRESET_CITIZEN_PRODUCTS["protein_bar"]
            },
            {
                "key": "organic_green_tea",
                "name": "Himalayan Organic Green Tea",
                "tag": "Compliant Clean Nutrition",
                "claims": ["100% Organic", "Zero Calories"],
                "preview": PRESET_CITIZEN_PRODUCTS["organic_green_tea"]
            }
        ]
    }

@app.get("/api/presets/inspector")
def get_inspector_presets():
    return {
        "presets": [
            {
                "key": "fraudulent_pricing_chips",
                "name": "Potato Wafers 65g - USP Math Fraud",
                "violation": "Declared USP ₹0.38/g vs Actual ₹0.54/g",
                "data": PRESET_INSPECTOR_CASES["fraudulent_pricing_chips"]
            },
            {
                "key": "missing_pin_and_usp_biscuit",
                "name": "Malted Biscuits 200g - Missing Mandatory Declarations",
                "violation": "Omitted Postal PIN, Omitted USP, Missing Care Email",
                "data": PRESET_INSPECTOR_CASES["missing_pin_and_usp_biscuit"]
            },
            {
                "key": "fully_compliant_edible_oil",
                "name": "Refined Mustard Oil 1L - Fully Compliant",
                "violation": "None (All 6 declarations and USP match)",
                "data": PRESET_INSPECTOR_CASES["fully_compliant_edible_oil"]
            }
        ]
    }

@app.post("/api/citizen/analyze")
def analyze_citizen_products(payload: CitizenAnalyzeRequest):
    """
    Analyzes 1 to 3 products, runs Gemini extraction + Deception Engine,
    and constructs a side-by-side comparison.
    """
    if not payload.products or len(payload.products) > 3:
        raise HTTPException(status_code=400, detail="Must provide between 1 and 3 products.")

    results = []
    for idx, prod_req in enumerate(payload.products):
        # Strict isolation: if custom image exists, do not permit preset override
        has_images = bool(prod_req.front_image_b64 or prod_req.back_image_b64)
        preset_key = None if has_images else prod_req.preset_key
        manual_override = None if has_images else prod_req.manual_data

        # Extract via Gemini or Preset
        extracted_data = GeminiVisionService.extract_citizen_nutrition(
            front_image_b64=prod_req.front_image_b64,
            back_image_b64=prod_req.back_image_b64,
            preset_key=preset_key,
            manual_override=manual_override
        )

        # Run Deception Engine
        analysis = DeceptionEngine.analyze_product(extracted_data)
        analysis["slot_index"] = idx + 1
        analysis["product_id"] = prod_req.product_id or f"prod_{idx+1}"
        results.append(analysis)

    # Build comparison summary if > 1 product
    comparison = None
    if len(results) > 1:
        comparison = {
            "total_products": len(results),
            "best_nutri_grade_product": min(results, key=lambda x: x["nutri_grade"])["product_name"],
            "least_deceptive_product": min(results, key=lambda x: x["critical_flags_count"])["product_name"],
            "side_by_side": [
                {
                    "product_id": r["product_id"],
                    "product_name": r["product_name"],
                    "brand": r["brand"],
                    "nutri_grade": r["nutri_grade"],
                    "calories": r["nutrition_summary"]["calories_kcal"],
                    "added_sugars": r["nutrition_summary"]["added_sugars_g"],
                    "protein": r["nutrition_summary"]["protein_g"],
                    "sat_fat": r["nutrition_summary"]["saturated_fat_g"],
                    "sodium": r["nutrition_summary"]["sodium_mg"],
                    "critical_deceptions": r["critical_flags_count"]
                }
                for r in results
            ]
        }

    return {
        "analyzed_count": len(results),
        "products": results,
        "comparison": comparison
    }

def generate_rule_checklist(validation_res: Dict[str, Any], audit_data: Dict[str, Any]) -> Dict[str, Any]:
    violations_map = {v.get("rule_number"): v for v in validation_res.get("violations", [])}
    usp_audit = validation_res.get("usp_math_audit", {})
    
    return {
        "rule_6_1_a": {
            "status": "VIOLATED" if any("6(1)(a)" in str(k) for k in violations_map) else "COMPLIANT",
            "desc": violations_map.get("Rule 6(1)(a)", {}).get("details", "Manufacturer name, address & PIN")
        },
        "rule_6_1_b": {
            "status": "VIOLATED" if any("6(1)(b)" in str(k) for k in violations_map) else "COMPLIANT",
            "desc": violations_map.get("Rule 6(1)(b)", {}).get("details", "Generic commodity name declared")
        },
        "rule_6_1_c": {
            "status": "VIOLATED" if any("6(1)(c)" in str(k) for k in violations_map) else "COMPLIANT",
            "desc": violations_map.get("Rule 6(1)(c)", {}).get("details", f"Standard SI unit declared ({audit_data.get('net_quantity', 'N/A')})")
        },
        "rule_6_1_d": {
            "status": "VIOLATED" if any("6(1)(d)" in str(k) for k in violations_map) else "COMPLIANT",
            "desc": violations_map.get("Rule 6(1)(d)", {}).get("details", "Month & Year of packing declared")
        },
        "rule_6_1_e": {
            "status": "VIOLATED" if any("6(1)(e)" in str(k) for k in violations_map) else "COMPLIANT",
            "desc": violations_map.get("Rule 6(1)(e)", {}).get("details", "MRP format compliant")
        },
        "rule_5_usp": {
            "status": "COMPLIANT" if usp_audit.get("status") == "COMPLIANT" else "VIOLATED",
            "desc": f"Calculated statutory USP ({usp_audit.get('display_str') or usp_audit.get('calculated_usp')}) vs printed USP ({usp_audit.get('declared_usp')})"
        },
        "rule_6_1_n": {
            "status": "VIOLATED" if any("6(1)(n)" in str(k) for k in violations_map) else "COMPLIANT",
            "desc": violations_map.get("Rule 6(1)(n)", {}).get("details", "Consumer Care contact complete")
        }
    }

@app.post("/api/inspector/audit")
def audit_legal_metrology(payload: InspectorAuditRequest):
    """
    Runs Legal Metrology 6-Declaration check, USP math validation, and Chain of Custody hash ledger.
    """
    panels = payload.panels or {}
    
    # 1. Extract package data via Gemini / Preset
    audit_data = GeminiVisionService.extract_inspector_declarations(
        panels=panels,
        preset_key=payload.preset_key,
        manual_override=payload.manual_data
    )

    # 2. Run Rules Engine & USP Math validation
    validation_res = LegalMetrologyEngine.validate_audit(audit_data)

    # 3. Compute SHA-256 panel hashes if not already provided
    panel_hashes = payload.panel_hashes or {}
    for panel_name in ["front", "back", "top", "bottom"]:
        if panel_name not in panel_hashes or not panel_hashes[panel_name]:
            img_b64 = panels.get(panel_name, "")
            if img_b64:
                panel_hashes[panel_name] = ChainOfCustody.hash_string(img_b64)
            else:
                # Deterministic synthetic evidence hash
                panel_hashes[panel_name] = ChainOfCustody.hash_string(f"PANEL_RAW_FRAME_{panel_name.upper()}_{payload.preset_key or 'CUSTOM'}")

    # 4. Generate Master Chain of Custody ledger
    geo_input = payload.location or payload.geolocation or {
        "latitude": 28.7095,
        "longitude": 77.1565,
        "display_name": "Okhla Industrial Area, Phase III, New Delhi, Delhi 110020"
    }

    lat = geo_input.get("lat") or geo_input.get("latitude") or 28.7095
    lng = geo_input.get("lng") or geo_input.get("longitude") or 77.1565
    formatted_addr = geo_input.get("formatted_address") or geo_input.get("display_name") or "Okhla Industrial Area, Phase III, New Delhi, Delhi 110020"

    geo = {
        "latitude": lat,
        "longitude": lng,
        "display_name": formatted_addr,
        "formatted_address": formatted_addr
    }

    coc = ChainOfCustody.generate_chain_of_custody(
        panel_hashes=panel_hashes,
        gps_coords=geo,
        inspector_id=payload.inspector_id or "LM-INSP-DEL-4091"
    )

    checklist = generate_rule_checklist(validation_res, audit_data)
    usp_audit = validation_res.get("usp_math_audit", {})

    # Merge into complete audit docket object
    docket = {
        **validation_res,
        **audit_data,
        **coc,
        "product_name": audit_data.get("commodity_name"),
        "mfg_expiry_dates": audit_data.get("mfg_date"),
        "statutory_calculated_usp": usp_audit.get("display_str") or (f"Rs. {usp_audit.get('calculated_usp')} {usp_audit.get('statutory_unit', '')}" if usp_audit.get('calculated_usp') else "N/A"),
        "usp_disparity_status": usp_audit.get("status"),
        "missing_mandatory_fields": [v["rule_number"] for v in validation_res.get("violations", []) if v.get("category") == "OMISSION_ERROR"],
        "rule_checklist": checklist,
        "formatted_address": formatted_addr,
        "location_name": formatted_addr
    }

    return docket

@app.post("/api/inspector/re-evaluate-field")
def re_evaluate_single_field(payload: TargetedRescanRequest):
    """
    Evaluates a single close-up image specifically for one missing or violated field.
    Executes lightweight single-field extraction and re-runs LegalMetrology validation on updated context.
    """
    rule_id = payload.rule_id
    image_b64 = payload.image_base64
    ctx = dict(payload.current_context or {})

    # 1. Extract single targeted field
    res = GeminiVisionService.extract_single_field(
        rule_id=rule_id,
        image_b64=image_b64,
        current_context=ctx
    )

    clean_rule = rule_id.lower().replace("-", "_")
    field_found = res.get("found", False)
    extracted_val = res.get("value")

    if not field_found or extracted_val is None:
        return {
            "status": "OMITTED",
            "is_compliant": False,
            "rule_id": rule_id,
            "message": "Still not detected in close-up frame. Please ensure proper focus and illumination.",
            "updated_audit": ctx
        }

    # 2. Patch current context with newly extracted value
    if "usp" in clean_rule:
        try:
            ctx["declared_usp"] = float(extracted_val)
        except (ValueError, TypeError):
            ctx["declared_usp"] = extracted_val
    elif "6_1_a" in clean_rule or "manufacturer" in clean_rule or "pin" in clean_rule:
        if isinstance(extracted_val, dict):
            ctx["manufacturer_details"] = extracted_val
        else:
            ctx.setdefault("manufacturer_details", {})["name"] = str(extracted_val)
    elif "6_1_b" in clean_rule or "commodity" in clean_rule:
        ctx["commodity_name"] = str(extracted_val)
    elif "6_1_c" in clean_rule or "quantity" in clean_rule:
        ctx["net_quantity"] = str(extracted_val)
    elif "6_1_d" in clean_rule or "mfg_date" in clean_rule or "date" in clean_rule:
        ctx["mfg_date"] = str(extracted_val)
    elif "6_1_e" in clean_rule or "mrp" in clean_rule or "price" in clean_rule:
        try:
            ctx["mrp"] = float(extracted_val)
        except (ValueError, TypeError):
            ctx["mrp"] = extracted_val
    elif "6_1_f" in clean_rule or "consumer_care" in clean_rule or "care" in clean_rule:
        if isinstance(extracted_val, dict):
            ctx["consumer_care"] = extracted_val
        else:
            ctx.setdefault("consumer_care", {})["phone"] = str(extracted_val)

    # 3. Re-run LegalMetrologyEngine validation on patched context
    validation_res = LegalMetrologyEngine.validate_audit(ctx)

    # 4. Check if target rule is now compliant
    is_rule_compliant = True
    if "usp" in clean_rule:
        is_rule_compliant = validation_res.get("usp_math_audit", {}).get("status") == "COMPLIANT"
    else:
        for viol in validation_res.get("violations", []):
            r_num = viol.get("rule_number", "").lower().replace("(", "_").replace(")", "_")
            if clean_rule in r_num or r_num in clean_rule:
                is_rule_compliant = False
                break

    # Build updated complete docket object preserving CoC and Geolocation
    updated_docket = {
        **ctx,
        **validation_res
    }

    return {
        "status": "COMPLIANT" if is_rule_compliant else "FOUND",
        "is_compliant": is_rule_compliant,
        "rule_id": rule_id,
        "extracted_value": extracted_val,
        "message": f"Successfully re-evaluated {rule_id}.",
        "updated_audit": updated_docket
    }

@app.post("/api/inspector/generate-docket-pdf")
def generate_docket_pdf(docket_data: Dict[str, Any]):
    """
    Generates downloadable Section 36(1) Statutory Inspection Report & Compounding Docket PDF.
    """
    try:
        # Ingest location_name, formatted_address, premises_address, or geo structure
        geo = docket_data.get("geolocation") or docket_data.get("geo") or {}
        if isinstance(geo, dict):
            if not docket_data.get("formatted_address"):
                docket_data["formatted_address"] = geo.get("display_name") or geo.get("formatted_address") or geo.get("address")
            if not docket_data.get("latitude"):
                docket_data["latitude"] = geo.get("latitude") or geo.get("lat")
            if not docket_data.get("longitude"):
                docket_data["longitude"] = geo.get("longitude") or geo.get("lng") or geo.get("lon")

        pdf_bytes = LegalDocketPDFGenerator.generate_docket_pdf(docket_data)
        docket_id = docket_data.get("docket_id", "GOI-LM-2026-REPORT")
        filename = f"Statutory_Docket_{docket_id}.pdf"
        
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    except Exception as e:
        logger.error(f"PDF generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate legal PDF: {str(e)}")

@app.post("/api/inspector/sync-offline-queue")
def sync_offline_queue(payload: OfflineSyncBatch):
    """
    Reconciles batched offline inspection dockets collected in remote warehouses.
    """
    synced = []
    for item in payload.queue:
        docket_id = item.get("docket_id") or f"GOI-SYNC-{len(synced)+1}"
        item["sync_status"] = "RECONCILED"
        item["server_synced_at"] = datetime.utcnow().isoformat()
        synced.append(item)

    return {
        "message": f"Successfully synchronized {len(synced)} offline statutory audit records.",
        "synced_count": len(synced),
        "records": synced
    }

@app.get("/api/reverse-geocode")
def reverse_geocode(lat: float, lon: float):
    """
    Nominatim OpenStreetMap proxy for civic geolocation to avoid CORS restrictions.
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {"User-Agent": "NationalRegulatoryPortal-India-Gov/2.0 (regulatory.portal@gov.in)"}
        resp = requests.get(url, headers=headers, timeout=4)
        if resp.status_code == 200:
            data = resp.json()
            return {
                "display_name": data.get("display_name", f"Lat: {lat:.4f}, Lon: {lon:.4f}"),
                "address": data.get("address", {})
            }
    except Exception as e:
        logger.warning(f"Nominatim lookup failed: {e}")
    
    return {
        "display_name": f"Coordinates: {lat:.4f}° N, {lon:.4f}° E (Civil Inspection Sector)",
        "address": {}
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
