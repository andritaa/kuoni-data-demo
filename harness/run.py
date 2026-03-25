#!/usr/bin/env python3
"""
Three-Agent Harness — Planner → Generator → Evaluator
=====================================================
Inspired by Anthropic's harness design for long-running application development.
Uses GPT-5.4 as the LLM backbone (configurable).

Usage:
    python3 harness/run.py "Feature description here"
    python3 harness/run.py --feature "Add customer 360 page" --max-iterations 3
"""

import os, sys, json, argparse, time, subprocess
from pathlib import Path
from datetime import datetime

import requests

# Config
PROJECT_DIR = Path(__file__).parent.parent
FRONTEND_DIR = PROJECT_DIR / "frontend" / "src"
BACKEND_DIR = PROJECT_DIR / "backend"
HARNESS_DIR = PROJECT_DIR / "harness"
ARTIFACTS_DIR = HARNESS_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True)

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
MODEL = os.environ.get("HARNESS_MODEL", "gpt-5.4-mini")
EVAL_MODEL = os.environ.get("HARNESS_EVAL_MODEL", "gpt-5.4")
QUALITY_THRESHOLD = 7.0  # out of 10 — below this triggers revision
MAX_ITERATIONS = 3

# Load env
env_file = Path("/home/stephen/clawd/.env")
if env_file.exists():
    for line in env_file.read_text().splitlines():
        if line.strip() and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())
    OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")


def llm(messages, model=MODEL, max_tokens=4000, temperature=0.3):
    """Call OpenAI chat completion."""
    resp = requests.post("https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {OPENAI_KEY}"},
        json={"model": model, "messages": messages, "temperature": temperature,
              "max_completion_tokens": max_tokens},
        timeout=60)
    if resp.status_code != 200:
        print(f"[LLM ERROR] {resp.status_code}: {resp.text[:200]}")
        return None
    return resp.json()["choices"][0]["message"]["content"]


def get_project_context():
    """Read existing project structure for context."""
    context = "DERTOUR Portal — existing React + FastAPI project.\n\n"
    
    # App.jsx structure
    app_file = FRONTEND_DIR / "App.jsx"
    if app_file.exists():
        context += f"=== App.jsx (navigation) ===\n{app_file.read_text()[:2000]}\n\n"
    
    # List existing pages
    pages_dir = FRONTEND_DIR / "pages"
    if pages_dir.exists():
        context += "=== Existing pages ===\n"
        for f in sorted(pages_dir.glob("*.jsx")):
            context += f"  {f.name} ({f.stat().st_size} bytes)\n"
    
    # Backend endpoints
    main_file = BACKEND_DIR / "main.py"
    if main_file.exists():
        endpoints = [l.strip() for l in main_file.read_text().splitlines() 
                     if l.strip().startswith("@app.")]
        context += f"\n=== Backend endpoints ({len(endpoints)}) ===\n"
        for e in endpoints:
            context += f"  {e}\n"
    
    # Sample existing page for style reference
    sample = FRONTEND_DIR / "pages" / "PoCs.jsx"
    if sample.exists():
        context += f"\n=== Style reference: PoCs.jsx (first 100 lines) ===\n"
        context += "\n".join(sample.read_text().splitlines()[:100])
    
    return context


# ═══════════════════════════════════════════════════════════════
# AGENT 1: PLANNER
# ═══════════════════════════════════════════════════════════════

def plan(feature_description: str) -> dict:
    """Decompose feature into implementation chunks with acceptance criteria."""
    print("\n🗺️  PLANNER: Decomposing feature...")
    
    context = get_project_context()
    
    result = llm([
        {"role": "system", "content": """You are a senior frontend/fullstack architect for a React + FastAPI travel data platform (DERTOUR Group).

Given a feature description, produce a JSON implementation plan with:
1. Chunks — ordered list of implementation steps
2. Each chunk has: id, title, description, files_to_create, files_to_modify, acceptance_criteria
3. Keep chunks small and testable (1 chunk = 1 PR-sized change)
4. Consider the existing project structure

IMPORTANT: 
- Frontend uses React with Tailwind-like inline styles
- Brand colors: BLUE=#003366, GOLD=#C9A96E
- Backend is FastAPI with Snowflake connection
- API base URL from VITE_API_URL env var

Return ONLY valid JSON. No markdown wrapping."""},
        {"role": "user", "content": f"Feature: {feature_description}\n\nProject context:\n{context}"}
    ], temperature=0.2, max_tokens=3000)
    
    if not result:
        return None
    
    try:
        # Clean markdown if present
        if result.startswith("```"):
            result = result.split("\n", 1)[1] if "\n" in result else result[3:]
        if result.endswith("```"):
            result = result[:-3]
        plan = json.loads(result.strip())
        
        # Save artifact
        artifact_path = ARTIFACTS_DIR / f"plan_{datetime.now().strftime('%H%M%S')}.json"
        artifact_path.write_text(json.dumps(plan, indent=2))
        
        chunks = plan.get("chunks", plan.get("steps", []))
        print(f"   ✅ {len(chunks)} chunks planned")
        for c in chunks:
            print(f"      {c.get('id', '?')}: {c.get('title', c.get('name', '?'))}")
        
        return plan
    except json.JSONDecodeError as e:
        print(f"   ❌ Failed to parse plan: {e}")
        print(f"   Raw: {result[:200]}")
        return None


# ═══════════════════════════════════════════════════════════════
# AGENT 2: GENERATOR
# ═══════════════════════════════════════════════════════════════

def generate(chunk: dict, plan: dict, iteration: int = 1, feedback: str = "") -> dict:
    """Generate code for a single chunk."""
    chunk_id = chunk.get("id", "?")
    chunk_title = chunk.get("title", chunk.get("name", "?"))
    print(f"\n⚙️  GENERATOR: Building chunk {chunk_id} — {chunk_title} (iteration {iteration})")
    
    context = get_project_context()
    
    feedback_section = ""
    if feedback:
        feedback_section = f"\n\nEVALUATOR FEEDBACK FROM PREVIOUS ITERATION:\n{feedback}\n\nFix the issues identified above."
    
    result = llm([
        {"role": "system", "content": """You are a senior React + Python developer for the DERTOUR Group data portal.

Generate complete, working code for the requested feature chunk.

RULES:
- React components use inline styles or className with Tailwind-like utility classes
- Brand colors: const BLUE = '#003366', const GOLD = '#C9A96E'
- API calls use: const API = import.meta.env.VITE_API_URL || 'http://localhost:8010'
- Use useState, useEffect hooks (functional components only)
- Mobile responsive (grid-cols-1 md:grid-cols-2 etc.)
- Handle loading and error states
- Match existing code style (see reference)

Return a JSON object with:
{
  "files": [
    {"path": "relative/path/to/file.jsx", "content": "full file content here"},
    ...
  ],
  "summary": "What was built and why"
}

Return ONLY valid JSON. No markdown."""},
        {"role": "user", "content": f"""Plan overview: {json.dumps(plan, indent=2)[:1500]}

Current chunk to implement:
{json.dumps(chunk, indent=2)}

Project context:
{context[:3000]}
{feedback_section}"""}
    ], temperature=0.4, max_tokens=6000)
    
    if not result:
        return None
    
    try:
        if result.startswith("```"):
            result = result.split("\n", 1)[1]
        if result.endswith("```"):
            result = result[:-3]
        output = json.loads(result.strip())
        
        files = output.get("files", [])
        print(f"   ✅ Generated {len(files)} files")
        for f in files:
            print(f"      📄 {f.get('path', '?')}")
        
        return output
    except json.JSONDecodeError:
        print(f"   ❌ Failed to parse generator output")
        return None


# ═══════════════════════════════════════════════════════════════
# AGENT 3: EVALUATOR
# ═══════════════════════════════════════════════════════════════

def evaluate(chunk: dict, generated: dict) -> dict:
    """Grade generated code on 4 criteria."""
    print(f"\n🔍  EVALUATOR: Grading output...")
    
    files_summary = ""
    for f in generated.get("files", []):
        content = f.get("content", "")
        files_summary += f"\n--- {f.get('path', '?')} ({len(content)} chars) ---\n{content[:2000]}\n"
    
    result = llm([
        {"role": "system", "content": """You are a STRICT code reviewer for a DERTOUR Group data platform.
You evaluate generated code on 4 criteria. Be CRITICAL — do not praise mediocre work.

Score each 1-10:
1. CORRECTNESS (30%) — Does it work? Proper imports, no undefined vars, handles edge cases?
2. DESIGN QUALITY (25%) — Clean UI? Consistent DERTOUR branding (#003366 blue, #C9A96E gold)? Not generic AI slop?
3. DATA INTEGRATION (25%) — Proper API calls? Loading/error states? Handles empty data?
4. CODE QUALITY (20%) — Clean, readable, no duplication, follows React patterns?

PENALIZE:
- Generic "AI slop" designs (purple gradients, generic cards)
- Missing loading states
- Hardcoded data when API should be used
- Missing mobile responsiveness
- Inconsistent styling with existing codebase

Return JSON:
{
  "scores": {"correctness": N, "design": N, "data_integration": N, "code_quality": N},
  "weighted_average": N,
  "pass": true/false,
  "feedback": "Specific, actionable feedback for the generator to fix",
  "strengths": ["..."],
  "issues": ["..."]
}

ONLY return JSON."""},
        {"role": "user", "content": f"""Chunk being evaluated:
{json.dumps(chunk, indent=2)}

Generated code:
{files_summary[:5000]}

Acceptance criteria:
{json.dumps(chunk.get('acceptance_criteria', []), indent=2)}"""}
    ], model=EVAL_MODEL, temperature=0.1, max_tokens=1500)
    
    if not result:
        return {"weighted_average": 0, "pass": False, "feedback": "Evaluator failed"}
    
    try:
        if result.startswith("```"):
            result = result.split("\n", 1)[1]
        if result.endswith("```"):
            result = result[:-3]
        evaluation = json.loads(result.strip())
        
        scores = evaluation.get("scores", {})
        wa = evaluation.get("weighted_average", 0)
        passed = wa >= QUALITY_THRESHOLD
        evaluation["pass"] = passed
        
        icon = "✅" if passed else "❌"
        print(f"   {icon} Score: {wa}/10 (threshold: {QUALITY_THRESHOLD})")
        print(f"      Correctness: {scores.get('correctness', '?')}/10")
        print(f"      Design:      {scores.get('design', '?')}/10")
        print(f"      Data:        {scores.get('data_integration', '?')}/10")
        print(f"      Code:        {scores.get('code_quality', '?')}/10")
        
        if not passed:
            print(f"   📝 Feedback: {evaluation.get('feedback', '')[:200]}")
        
        return evaluation
    except json.JSONDecodeError:
        print(f"   ❌ Failed to parse evaluation")
        return {"weighted_average": 5, "pass": False, "feedback": result[:500]}


# ═══════════════════════════════════════════════════════════════
# ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════

def write_files(generated: dict):
    """Write generated files to disk."""
    for f in generated.get("files", []):
        path = PROJECT_DIR / f["path"]
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(f["content"])
        print(f"   💾 Wrote: {f['path']}")


def run_harness(feature: str, max_iterations: int = MAX_ITERATIONS):
    """Run the full three-agent pipeline."""
    print("=" * 60)
    print(f"🚀 THREE-AGENT HARNESS")
    print(f"   Feature: {feature}")
    print(f"   Model: {MODEL} (eval: {EVAL_MODEL})")
    print(f"   Threshold: {QUALITY_THRESHOLD}/10")
    print(f"   Max iterations: {max_iterations}")
    print("=" * 60)
    
    # Phase 1: Plan
    plan = plan_feature(feature)
    if not plan:
        print("\n💀 Planning failed. Aborting.")
        return False
    
    chunks = plan.get("chunks", plan.get("steps", []))
    results = []
    
    # Phase 2-3: Generate + Evaluate per chunk
    for chunk in chunks:
        chunk_id = chunk.get("id", "?")
        feedback = ""
        success = False
        
        for iteration in range(1, max_iterations + 1):
            # Generate
            generated = generate(chunk, plan, iteration, feedback)
            if not generated:
                print(f"   💀 Generation failed for chunk {chunk_id}")
                break
            
            # Evaluate
            evaluation = evaluate(chunk, generated)
            
            if evaluation.get("pass"):
                # Write to disk
                write_files(generated)
                results.append({
                    "chunk": chunk_id,
                    "iterations": iteration,
                    "score": evaluation.get("weighted_average"),
                    "status": "passed"
                })
                success = True
                break
            else:
                feedback = evaluation.get("feedback", "Improve quality.")
                print(f"   🔄 Revision needed — iteration {iteration}/{max_iterations}")
        
        if not success:
            print(f"\n   ⚠️  Chunk {chunk_id} did not pass after {max_iterations} iterations")
            # Write anyway with a warning
            if generated:
                write_files(generated)
            results.append({
                "chunk": chunk_id,
                "iterations": max_iterations,
                "score": evaluation.get("weighted_average", 0) if evaluation else 0,
                "status": "below_threshold"
            })
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 HARNESS RESULTS")
    print("=" * 60)
    for r in results:
        icon = "✅" if r["status"] == "passed" else "⚠️"
        print(f"   {icon} Chunk {r['chunk']}: score={r['score']}/10, iterations={r['iterations']}")
    
    passed = sum(1 for r in results if r["status"] == "passed")
    print(f"\n   {passed}/{len(results)} chunks passed quality gate")
    
    # Save results
    results_path = ARTIFACTS_DIR / f"results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    results_path.write_text(json.dumps({"feature": feature, "results": results}, indent=2))
    print(f"   📄 Results: {results_path}")
    
    return passed == len(results)


# Alias for the plan function (avoid name collision)
plan_feature = plan


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Three-Agent Harness")
    parser.add_argument("feature", nargs="?", help="Feature to build")
    parser.add_argument("--max-iterations", type=int, default=MAX_ITERATIONS)
    parser.add_argument("--threshold", type=float, default=QUALITY_THRESHOLD)
    args = parser.parse_args()
    
    if not args.feature:
        args.feature = "Add a Customer 360 page showing top customers by lifetime value, with segment breakdown, booking history chart, and individual customer detail view. Connect to the /api/customers/segments and Snowflake RPT_CUSTOMER_LTV endpoints."
    
    QUALITY_THRESHOLD = args.threshold
    MAX_ITERATIONS = args.max_iterations
    
    success = run_harness(args.feature, args.max_iterations)
    sys.exit(0 if success else 1)
