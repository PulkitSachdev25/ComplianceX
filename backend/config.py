import os
from pydantic import BaseModel

class AppConfig:
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    # Civic Color Tokens (Strict Official Regulatory Palette)
    PRIMARY_COLOR: str = "#1A365D"  # Navy Blue
    BACKGROUND_COLOR: str = "#F7FAFC"  # Slate
    SUCCESS_COLOR: str = "#2F855A"  # Emerald
    ERROR_COLOR: str = "#C53030"  # Crimson
    WARNING_COLOR: str = "#DD6B20"  # Amber
    MUTED_TEXT: str = "#4A5568"
    BORDER_COLOR: str = "#E2E8F0"

    # FSSAI Statutory Thresholds (per 100g/100ml)
    FSSAI_THRESHOLDS = {
        "sugar_high_g": 10.0,
        "sat_fat_high_g": 4.0,
        "sodium_high_mg": 400.0,
        "protein_high_claim_min_g": 6.0,  # FSSAI min for 'Source of Protein' / 12g for 'High Protein'
        "fiber_high_claim_min_g": 3.0,
        "trans_fat_max_limit_g": 0.2, # Threshold to claim zero trans fat (must not have hydrogenated fats)
    }

    # Legal Metrology Section 36(1) Penalty Structure (INR)
    PENALTIES = {
        "first_offence_max": 25000,
        "second_offence_max": 50000,
        "subsequent_offence_imprisonment_months": 12,
        "compounding_fee_base": 10000
    }

config = AppConfig()
