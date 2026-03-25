#!/usr/bin/env python3
"""Quick test of the three-agent pattern with higher token limits."""

import os, json, requests
from pathlib import Path

for line in Path("/home/stephen/clawd/.env").read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k, _, v = line.partition("=")
        os.environ.setdefault(k.strip(), v.strip())

KEY = os.environ["OPENAI_API_KEY"]

def llm(msgs, model="gpt-5.4", tokens=8000, temp=0.3):
    r = requests.post("https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {KEY}"},
        json={"model": model, "messages": msgs, "temperature": temp, "max_completion_tokens": tokens},
        timeout=90)
    if r.status_code != 200:
        print(f"LLM error: {r.status_code} {r.text[:200]}")
        return None
    return r.json()["choices"][0]["message"]["content"]

# Context
pocs = Path("frontend/src/pages/PoCs.jsx").read_text()[:2000]

# === PLANNER ===
print("=" * 50)
print("PLANNER")
print("=" * 50)
plan_result = llm([
    {"role": "system", "content": "Return a JSON array of 2 chunks. Each: {id, title, acceptance_criteria: []}. JSON only, no markdown."},
    {"role": "user", "content": "Feature: Customer 360 page — table of top customers by LTV, segment pie chart, loyalty tier badges. Fetch from /api/customers/ltv."}
], tokens=1000)
print(f"Plan: {plan_result[:300]}")

# === GENERATOR ===
print("\n" + "=" * 50)
print("GENERATOR")
print("=" * 50)
code = llm([
    {"role": "system", "content": f"""Write a COMPLETE React component file: Customer360.jsx.

Reference style:
{pocs}

RULES:
- const BLUE = '#003366', GOLD = '#C9A96E'
- const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'
- Use recharts PieChart (already in package.json)
- Fetch /api/customers/ltv on mount
- Show: top 10 table, segment pie chart, loyalty badges
- Mobile responsive
- Loading + error states

Return ONLY the complete file. No markdown. No explanation. Just code."""},
    {"role": "user", "content": "Build Customer360.jsx — complete, working, no truncation."}
], model="gpt-5.4", tokens=8000, temp=0.3)

if not code:
    print("Generation failed")
    exit(1)

# Clean
if code.startswith("```"):
    code = code.split("\n", 1)[1] if "\n" in code else code[3:]
if code.endswith("```"):
    code = code[:-3]
code = code.strip()

print(f"Generated: {len(code)} chars, {code.count(chr(10))} lines")
print(f"Starts with: {code[:80]}")
print(f"Ends with: {code[-80:]}")

# Check completeness
if "export default" not in code:
    print("WARNING: No export default found!")
if code.count("{") != code.count("}"):
    print(f"WARNING: Brace mismatch! {{ = {code.count('{')}, }} = {code.count('}')}")

Path("frontend/src/pages/Customer360.jsx").write_text(code)
print(f"Wrote to frontend/src/pages/Customer360.jsx")

# === EVALUATOR ===
print("\n" + "=" * 50)
print("EVALUATOR")
print("=" * 50)
eval_result = llm([
    {"role": "system", "content": """STRICT reviewer. Score 1-10: Correctness, Design Quality, Data Integration, Code Quality.
Return JSON: {"scores": {"correctness": N, "design": N, "data": N, "code": N}, "weighted_average": N, "pass": true/false, "feedback": "...", "issues": ["..."]}
Threshold: 7.0. Be critical. JSON only."""},
    {"role": "user", "content": f"Evaluate:\n{code[:6000]}"}
], model="gpt-5.4", tokens=2000, temp=0.1)

if eval_result:
    if eval_result.startswith("```"):
        eval_result = eval_result.split("\n", 1)[1]
    if eval_result.endswith("```"):
        eval_result = eval_result[:-3]
    try:
        ev = json.loads(eval_result.strip())
        scores = ev.get("scores", {})
        wa = ev.get("weighted_average", 0)
        icon = "PASS" if wa >= 7 else "FAIL"
        print(f"\n{icon}: {wa}/10")
        for k, v in scores.items():
            print(f"  {k}: {v}/10")
        if ev.get("feedback"):
            print(f"\nFeedback: {ev['feedback'][:300]}")
        if ev.get("issues"):
            for iss in ev["issues"][:5]:
                print(f"  - {iss}")
    except json.JSONDecodeError:
        print(f"Eval parse error: {eval_result[:200]}")
else:
    print("Evaluation failed")
