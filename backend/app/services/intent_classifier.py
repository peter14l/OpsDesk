import re
from typing import Dict, List, Tuple


INTENT_RULES = {
    "OVERBOOKING": {
        "label": "Hotel Overbooking / Relocation",
        "keywords": [
            "overbooked", "walked", "walk", "no room", "hotel full", "not in crs",
            "not found in system", "stranded", "in the lobby", "no reservation",
            "room unavailable", "maintenance closure"
        ],
        "default_priority": "URGENT",
        "theme_tag": "overbooking-walk-relocation",
        "base_weight": 1.2,
    },
    "REFUND": {
        "label": "Refund Delay",
        "keywords": [
            "refund", "refund delay", "hasn't arrived", "delayed refund", "double charge", "charged twice",
            "pre-authorization", "credit note", "bank deduction", "invoice mismatch",
            "overcharge", "card charged", "payout", "refund status", "10 days", "not received"
        ],
        "default_priority": "HIGH",
        "theme_tag": "voucher-rate-mismatch",
        "base_weight": 1.25,
    },
    "CANCELLATION": {
        "label": "Cancellation / Penalty Waiver",
        "keywords": [
            "cancel", "cancellation", "waiver", "medical", "hospitalized", "hospital",
            "illness", "bereavement", "death in family", "force majeure", "penalty waiver",
            "non-refundable"
        ],
        "default_priority": "HIGH",
        "theme_tag": "non-refundable-waiver-request",
        "base_weight": 1.1,
    },
    "AMENDMENT": {
        "label": "Name / Date Amendment",
        "keywords": [
            "amend", "amendment", "name change", "misspelled", "spelling error",
            "surname", "passport mismatch", "date change", "extend stay", "shorten stay",
            "flight delay"
        ],
        "default_priority": "MEDIUM",
        "theme_tag": "amendment-refusal",
        "base_weight": 0.95,
    },
    "VOUCHER_ISSUE": {
        "label": "Voucher Rate Discrepancy",
        "keywords": [
            "voucher", "city tax", "resort fee", "tax dispute", "rate code",
            "bedbank rate", "net rate", "double taxation", "counter charge"
        ],
        "default_priority": "HIGH",
        "theme_tag": "voucher-rate-mismatch",
        "base_weight": 1.0,
    },
    "SPECIAL_REQUEST": {
        "label": "Special Request / Meal Plan",
        "keywords": [
            "breakfast", "buffet", "meal plan", "early check-in", "late checkout",
            "twin bed", "smoking room", "king bed", "halal", "gluten free", "anniversary",
            "wheelchair", "adjoining room"
        ],
        "default_priority": "LOW",
        "theme_tag": "breakfast-inclusion-dispute",
        "base_weight": 0.9,
    },
}


def classify_travel_intent(text: str) -> Dict:
    """
    Lightweight, deterministic B2B travel operations intent classification engine.
    Analyzes keywords, operational patterns, and proximity markers to output
    intent category, confidence score, and suggested priority.
    """
    if not text or not text.strip():
        return {
            "predicted_category": "SPECIAL_REQUEST",
            "label": "General Operations Inquiry",
            "confidence": 0.3,
            "suggested_priority": "MEDIUM",
            "matched_keywords": [],
            "suggested_tag": "voucher-rate-mismatch",
        }

    cleaned = text.lower()
    scores: Dict[str, float] = {}
    matched: Dict[str, List[str]] = {}

    for cat, data in INTENT_RULES.items():
        score = 0.0
        matches = []
        for kw in data["keywords"]:
            if kw in cleaned:
                # Exact word boundary or phrase match
                matches.append(kw)
                score += 1.0 * len(kw.split())

        if matches:
            # Apply category importance weight
            score *= data["base_weight"]
            scores[cat] = score
            matched[cat] = matches

    if not scores:
        return {
            "predicted_category": "SPECIAL_REQUEST",
            "label": "General Operations Inquiry",
            "confidence": 0.45,
            "suggested_priority": "MEDIUM",
            "matched_keywords": [],
            "suggested_tag": "supplier-crs-outage",
        }

    # Rank categories
    best_cat = max(scores.keys(), key=lambda k: scores[k])
    best_score = scores[best_cat]
    total_score = sum(scores.values())

    # Normalized confidence score between 0.65 and 0.98
    confidence = min(0.98, max(0.68, round(0.65 + (best_score / (total_score + 1.0)) * 0.33, 2)))

    rule = INTENT_RULES[best_cat]

    return {
        "predicted_category": best_cat,
        "label": rule["label"],
        "confidence": confidence,
        "suggested_priority": rule["default_priority"],
        "matched_keywords": matched[best_cat],
        "suggested_tag": rule["theme_tag"],
    }
