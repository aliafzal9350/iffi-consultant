"""
Display label for money on the IFFI site: every amount is in Chinese yuan and is written "RMB" (client decision,
2026-10-14). Field names and currency-code values keep the ISO code CNY (e.g. tuitionMinCNYPerYear, "base": "CNY");
only text that mentions the currency is relabelled, so "5000 CNY/Year" becomes "5000 RMB/Year".

Usage: data = rmb(data) just before json.dump. Re-running it on already relabelled data changes nothing.
"""
import re

_CNY = re.compile(r"\bCNY\b")


def rmb(obj):
    if isinstance(obj, dict):
        return {k: rmb(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [rmb(v) for v in obj]
    if isinstance(obj, str) and obj != "CNY":
        return _CNY.sub("RMB", obj)
    return obj
