# Three-Agent Harness for DERTOUR Portal

Inspired by Anthropic's [harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps).

## Architecture

```
PLANNER → GENERATOR → EVALUATOR → (loop if score < threshold)
```

- **Planner**: Decomposes a feature request into implementation chunks with acceptance criteria
- **Generator**: Builds each chunk (writes code, tests, commits)  
- **Evaluator**: Grades quality on 4 criteria, sends back for revision if below threshold

## Usage

```bash
python3 harness/run.py "Add a customer 360 page showing lifetime value, booking history, and segment breakdown"
```

## Grading Criteria

1. **Correctness** (30%) — Does the code work? No errors, handles edge cases
2. **Design Quality** (25%) — Clean UI, consistent with DERTOUR branding, not generic
3. **Data Integration** (25%) — Properly connects to Snowflake APIs, handles loading/error states
4. **Code Quality** (20%) — Clean, readable, no duplication, follows existing patterns
