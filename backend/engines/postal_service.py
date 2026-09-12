import os
import csv
import logging
import re
from typing import Dict, Any, Optional, Set

logger = logging.getLogger("postal-service")


class PostalReconciliationService:
    _initialized = False
    _valid_pins: Set[str] = set()
    _pin_to_geo: Dict[str, Dict[str, str]] = {}
    _district_to_pins: Dict[str, Set[str]] = {}
    _state_to_pins: Dict[str, Set[str]] = {}

    @classmethod
    def initialize(cls) -> bool:
        """Loads pincode.csv / pincodes.csv into in-memory hash sets on startup."""
        if cls._initialized:
            return True

        possible_paths = [
            os.path.join(os.path.dirname(__file__), "..", "pincode.csv"),
            os.path.join(os.path.dirname(__file__), "..", "pincodes.csv"),
            "pincode.csv",
            "pincodes.csv"
        ]

        csv_path = next((p for p in possible_paths if os.path.exists(p)), None)
        if not csv_path:
            logger.warning("[PostalService] pincode.csv not found; fallback regex mode active.")
            return False

        try:
            with open(csv_path, mode="r", encoding="utf-8-sig", errors="ignore") as f:
                reader = csv.DictReader(f)
                headers = {h.lower().strip(): h for h in (reader.fieldnames or [])}

                # Resolve dynamic column names
                pin_col = headers.get("pincode") or headers.get("pin") or headers.get("postal_code")
                dist_col = headers.get("district") or headers.get("districtname") or headers.get("city") or headers.get("taluk")
                state_col = headers.get("statename") or headers.get("state")

                if not pin_col:
                    logger.error("[PostalService] Could not identify PIN code column in CSV header.")
                    return False

                for row in reader:
                    raw_pin = str(row.get(pin_col, "")).strip()
                    if len(raw_pin) == 6 and raw_pin.isdigit() and not raw_pin.startswith("0"):
                        cls._valid_pins.add(raw_pin)

                        dist = str(row.get(dist_col, "")).strip().lower() if dist_col else ""
                        state = str(row.get(state_col, "")).strip().lower() if state_col else ""

                        cls._pin_to_geo[raw_pin] = {"district": dist, "state": state}

                        if dist:
                            cls._district_to_pins.setdefault(dist, set()).add(raw_pin)
                        if state:
                            cls._state_to_pins.setdefault(state, set()).add(raw_pin)

            cls._initialized = True
            logger.info(f"[PostalService] Initialized with {len(cls._valid_pins)} valid Indian postal PINs.")
            return True
        except Exception as e:
            logger.error(f"[PostalService] Initialization failed: {e}")
            return False

    @classmethod
    def get_valid_pins(cls) -> Set[str]:
        return cls._valid_pins

    @classmethod
    def verify_declaration_pin(
        cls,
        extracted_pin: Optional[str],
        extracted_address: Optional[str]
    ) -> Dict[str, Any]:
        """
        Cross-checks extracted PIN against the declared address text.
        NEVER overwrites text; flags RESCAN_REQUIRED if optical mismatch or truncation occurs.
        """
        if not extracted_pin:
            return {
                "status": "OMITTED",
                "is_compliant": False,
                "note": "Postal PIN omitted under Rule 6(1)(a)."
            }

        clean_pin = re.sub(r"\D", "", str(extracted_pin)).strip()

        # Rule 6(1)(a) syntax constraint: must be a 6-digit non-zero leading PIN
        if len(clean_pin) != 6 or clean_pin.startswith("0"):
            return {
                "status": "RESCAN_REQUIRED",
                "is_compliant": False,
                "note": f"PIN code '{extracted_pin}' is truncated or syntactically invalid. Close-up re-scan required."
            }

        # If CSV directory failed to load, fallback safely to standard syntax check
        if not cls._initialized or not cls._valid_pins:
            return {
                "status": "COMPLIANT",
                "is_compliant": True,
                "note": f"PIN {clean_pin} verified against statutory format."
            }

        # Check existence in national directory
        if clean_pin not in cls._valid_pins:
            return {
                "status": "RESCAN_REQUIRED",
                "is_compliant": False,
                "note": f"PIN {clean_pin} not found in National Postal Directory. Possible optical misread; re-scan address block."
            }

        # Cross-reference with address text if available
        norm_address = (extracted_address or "").lower()
        geo_info = cls._pin_to_geo.get(clean_pin, {})
        target_dist = geo_info.get("district", "")
        target_state = geo_info.get("state", "")

        # If location names exist, check whether the declared text aligns with the PIN jurisdiction
        if norm_address and (target_dist or target_state):
            # Check if any matching district or state tokens appear in the address string
            dist_matched = bool(target_dist and target_dist in norm_address)
            state_matched = bool(target_state and target_state in norm_address)

            # Check if address clearly declares another known district from our dataset
            conflicting_dists = [d for d in cls._district_to_pins.keys() if len(d) > 4 and d in norm_address]
            
            if conflicting_dists and not dist_matched and not state_matched:
                # Extracted PIN maps to an entirely different state/district than declared on packaging
                return {
                    "status": "RESCAN_REQUIRED",
                    "is_compliant": False,
                    "note": f"PIN {clean_pin} ({target_state.title()}) conflicts with address jurisdiction ({conflicting_dists[0].title()}). Re-scan to verify optical accuracy."
                }

        return {
            "status": "COMPLIANT",
            "is_compliant": True,
            "note": f"PIN {clean_pin} verified against National Postal Directory ({target_dist.title()}, {target_state.title()})."
        }
