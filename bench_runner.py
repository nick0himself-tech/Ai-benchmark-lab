#!/usr/bin/env python3
"""
AI Benchmark Lab - API runner
Sends every test in tests.json to an AI model through its API and writes a
results file that you load into the AI Benchmark Lab page ("Load results file").

No extra packages needed (Python 3.8+ standard library only).

Examples
  python bench_runner.py --provider openrouter --list-models gpt
  python bench_runner.py --provider openrouter --model <model-id> --tier G
  python bench_runner.py --provider openai --model <model-id> --name "ChatGPT - Nov update"
"""
import argparse, json, os, sys, time, threading, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date

PROVIDERS = {
    # name: (base URL of an OpenAI-compatible API, environment variable holding the key)
    "openrouter": ("https://openrouter.ai/api/v1", "OPENROUTER_API_KEY"),
    "openai":     ("https://api.openai.com/v1", "OPENAI_API_KEY"),
    "xai":        ("https://api.x.ai/v1", "XAI_API_KEY"),
    "google":     ("https://generativelanguage.googleapis.com/v1beta/openai", "GEMINI_API_KEY"),
    "anthropic":  ("https://api.anthropic.com/v1", "ANTHROPIC_API_KEY"),
    "deepseek":   ("https://api.deepseek.com/v1", "DEEPSEEK_API_KEY"),
    "mistral":    ("https://api.mistral.ai/v1", "MISTRAL_API_KEY"),
    "groq":       ("https://api.groq.com/openai/v1", "GROQ_API_KEY"),        # free tier available
    "ollama":     ("http://localhost:11434/v1", "OLLAMA_API_KEY"),          # local models, no key needed
}
ACCESS = {"free": "API (free tier)", "paid": "API (pay per use)", "local": "Local / open model"}

def http(method, url, key, body=None, timeout=900):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://claude.ai",   # OpenRouter attribution (optional)
        "X-Title": "AI Benchmark Lab",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def chat(base, key, model, messages, extra):
    body = {"model": model, "messages": messages}
    body.update(extra)
    delay = 5
    for attempt in range(6):
        try:
            out = http("POST", f"{base}/chat/completions", key, body)
            msg = out["choices"][0]["message"]
            content = msg.get("content")
            if isinstance(content, list):  # some APIs return content parts
                content = "".join(p.get("text", "") for p in content if isinstance(p, dict))
            u = out.get("usage") or {}
            return content or "", {"tin": u.get("prompt_tokens") or 0, "tout": u.get("completion_tokens") or 0, "cost": u.get("cost") or 0}
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            if e.code in (429, 500, 502, 503, 504, 529) and attempt < 5:
                time.sleep(delay); delay = min(delay * 2, 120); continue
            raise RuntimeError(f"HTTP {e.code}: {detail}")
        except (urllib.error.URLError, TimeoutError) as e:
            if attempt < 5:
                time.sleep(delay); delay = min(delay * 2, 120); continue
            raise RuntimeError(f"Network error: {e}")

def run_test(t, base, key, model, extra):
    messages, transcript = [], []
    use = {"tin": 0, "tout": 0, "cost": 0.0, "sec": 0.0}
    for turn in t["turns"]:
        messages.append({"role": "user", "content": turn})
        t0 = time.time()
        reply, u = chat(base, key, model, messages, extra)
        use["sec"] += time.time() - t0
        for k in ("tin", "tout", "cost"): use[k] += u[k] or 0
        messages.append({"role": "assistant", "content": reply})
        transcript.append((turn, reply))
    if len(t["turns"]) == 1:
        return transcript[0][1], use
    return "\n\n".join(f"USER: {u}\n\nASSISTANT: {a}" for u, a in transcript), use

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description="Run AI Benchmark Lab tests through an API.")
    ap.add_argument("--provider", default="openrouter", choices=sorted(PROVIDERS) + ["custom"])
    ap.add_argument("--base-url", help="API base URL (for --provider custom)")
    ap.add_argument("--key-env", help="Environment variable with the API key (overrides the provider default)")
    ap.add_argument("--model", help="Model ID exactly as the provider names it")
    ap.add_argument("--list-models", nargs="?", const="", metavar="FILTER", help="List the provider's model IDs (optionally filtered) and exit")
    ap.add_argument("--tier", default="", help="S, F, G, A (Arena challenges) or a combination like FGA (default: all)")
    ap.add_argument("--category", default="", help="Only this category id (e.g. halluc, code, eng)")
    ap.add_argument("--ids", default="", help="Comma-separated test IDs to run, e.g. G01,G02")
    ap.add_argument("--name", help="Run name shown in the page (default: model + date)")
    ap.add_argument("--label", help="AI and version label for History (default: the model ID)")
    ap.add_argument("--notes", default="", help="Notes saved with the run")
    ap.add_argument("--access", choices=["free", "paid", "local"], help="Label the run as free-tier, paid or local model (shown in the page)")
    ap.add_argument("--restrict", default="", help="Restrictions to record, e.g. 'free tier rate limit, max 4k output tokens'")
    ap.add_argument("--reasoning", choices=["low", "medium", "high"], help="Ask for a reasoning effort (models that support it)")
    ap.add_argument("--concurrency", type=int, default=4)
    ap.add_argument("--tests", default=os.path.join(here, "tests.json"))
    ap.add_argument("--out", help="Output file (default: results-<model>-<date>.json). Re-running resumes it.")
    a = ap.parse_args()

    if a.provider == "custom":
        if not a.base_url: sys.exit("--provider custom needs --base-url")
        base, env = a.base_url.rstrip("/"), a.key_env or "API_KEY"
    else:
        base, env = PROVIDERS[a.provider]
        if a.base_url: base = a.base_url.rstrip("/")
        env = a.key_env or env
    key = os.environ.get(env) or ("ollama" if a.provider == "ollama" else None)
    if not key:
        sys.exit(f"Set your API key first, e.g.  export {env}=...   (Windows: set {env}=...)")

    if a.list_models is not None:
        data = http("GET", f"{base}/models", key)
        ids = sorted(m.get("id", "") for m in data.get("data", []))
        for i in ids:
            if a.list_models.lower() in i.lower(): print(i)
        return
    if not a.model:
        sys.exit("Choose a model with --model (use --list-models to see the IDs)")

    bank = json.load(open(a.tests, encoding="utf-8"))["tests"]
    sel = [t for t in bank
           if (not a.tier or t["tier"] in a.tier.upper())
           and (not a.category or t["category"] == a.category)
           and (not a.ids or t["id"] in {x.strip() for x in a.ids.split(",")})]
    if not sel: sys.exit("No tests match those filters.")

    today = date.today().isoformat()
    safe = "".join(c if c.isalnum() or c in "-._" else "_" for c in a.model)
    out_path = a.out or f"results-{safe}-{today}.json"
    result = {"format": "ai-bench-answers/v1",
              "run": {"name": a.name or f"{a.label or a.model} - {today}",
                      "model": a.label or a.model, "date": today,
                      "access": ACCESS.get(a.access or ("local" if a.provider == "ollama" else ""), "Unknown"),
                      "think": {"low": "On", "medium": "On", "high": "On (high effort)"}.get(a.reasoning, "Off" if not a.reasoning else "On"),
                      "restrict": a.restrict,
                      "notes": (a.notes + " " if a.notes else "") + f"API runner: provider={a.provider}, model={a.model}"
                               + (f", reasoning={a.reasoning}" if a.reasoning else "") + "; no tools."},
              "answers": {}, "errors": {}}
    if os.path.exists(out_path):
        old = json.load(open(out_path, encoding="utf-8"))
        result["answers"] = old.get("answers", {})
        print(f"Resuming {out_path}: {len(result['answers'])} answers already saved.")
    todo = [t for t in sel if t["id"] not in result["answers"]]

    extra = {"usage": {"include": True}} if a.provider == "openrouter" else {}
    if a.reasoning:
        extra.update({"reasoning": {"effort": a.reasoning}} if a.provider == "openrouter" else {"reasoning_effort": a.reasoning})

    lock = threading.Lock()
    def save():
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=1)

    print(f"Running {len(todo)} of {len(sel)} tests on {a.model} via {a.provider} ...")
    done = 0
    t0 = time.time()
    with ThreadPoolExecutor(max_workers=max(1, a.concurrency)) as ex:
        futs = {ex.submit(run_test, t, base, key, a.model, extra): t for t in todo}
        for f in as_completed(futs):
            t = futs[f]
            with lock:
                done += 1
                try:
                    ans, use = f.result()
                    result["answers"][t["id"]] = ans
                    result.setdefault("usage", {})[t["id"]] = use
                    result["errors"].pop(t["id"], None)
                    status = "ok"
                except Exception as e:
                    result["errors"][t["id"]] = str(e)[:300]
                    status = f"FAILED ({str(e)[:80]})"
                save()
                print(f"[{done}/{len(todo)}] {t['id']} {t['name']}: {status}")
    us = result.get("usage", {}).values()
    result["usage_total"] = {"n": len(result.get("usage", {})), "tin": sum(u["tin"] for u in us), "tout": sum(u["tout"] for u in us),
                             "cost": round(sum(u["cost"] for u in us), 6), "sec": round(sum(u["sec"] for u in us), 1)}
    save()
    n_err = len(result["errors"])
    ut = result["usage_total"]
    print(f"Usage: {ut['tin']} input + {ut['tout']} output tokens" + (f", cost ${ut['cost']:.4f}" if ut['cost'] else "") + f", {ut['sec']:.0f} s of model time.")
    print(f"\nDone in {time.time() - t0:.0f} s. {len(result['answers'])} answers saved to {out_path}"
          + (f"; {n_err} failed (run the same command again to retry them)." if n_err else "."))
    print("Load that file in the AI Benchmark Lab page: Auto-run section -> Load results file.")

if __name__ == "__main__":
    main()
