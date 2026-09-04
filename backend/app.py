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
    panels: Optional[Dict[str, str]] = None # {"front": b64, "back": b64, "top": b64, "bottom": b64}
    panel_hashes: Optional[Dict[str, str]] = None
    geolocation: Optional[Dict[str, Any]] = None
    inspector_id: Optional[str] = "LM-INSP-DEL-4091"
    manual_data: Optional[Dict[str, Any]] = None

class OfflineSyncBatch(BaseModel):
    queue: List[Dict[str, Any]]

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
        # Extract via Gemini or Preset
        extracted_data = GeminiVisionService.extract_citizen_nutrition(
            front_image_b64=prod_req.front_image_b64,
            back_image_b64=prod_req.back_image_b64,
            preset_key=prod_req.preset_key,
            manual_override=prod_req.manual_data
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
    geo = payload.geolocation or {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "display_name": "Department of Consumer Affairs, Krishi Bhawan, New Delhi"
    }

    coc = ChainOfCustody.generate_chain_of_custody(
        panel_hashes=panel_hashes,
        gps_coords=geo,
        inspector_id=payload.inspector_id or "LM-INSP-DEL-4091"
    )

    # Merge into complete audit docket object
    docket = {
        **validation_res,
        **audit_data,
        **coc
    }

    return docket

@app.post("/api/inspector/generate-docket-pdf")
def generate_docket_pdf(docket_data: Dict[str, Any]):
    """
    Generates downloadable Section 36(1) Statutory Inspection Report & Compounding Docket PDF.
    """
    try:
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
