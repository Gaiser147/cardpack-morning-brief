#!/usr/bin/env python3
"""Builds one self-contained HTML page from src/.

    python3 build.py             -> morning-brief.html   (publish this as the Claude artifact)
    python3 build.py --preview   -> morning-brief.html   with a series switcher and flicker diagnostics
    python3 build.py --demo      -> ../docs/demo.html    (GitHub Pages demo: three baked-in packs, no database)

The page reads its packs from the artifact database. Without a database (opened locally,
or on GitHub Pages) it shows the baked-in pack(s) instead: examples/sample-pack.json for the
artifact build, examples/demo-packs.json for the demo build.
"""
import json
import pathlib
import sys

root = pathlib.Path(__file__).parent
src = root / "src"
demo = "--demo" in sys.argv
preview = "--preview" in sys.argv

head = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#121218">
<title>Morning Brief</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Shippori+Mincho+B1:wght@600;800&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
"""

packs_file = root / "examples" / ("demo-packs.json" if demo else "sample-pack.json")
packs = json.loads(packs_file.read_text(encoding="utf-8"))
packs_json = json.dumps(packs, ensure_ascii=False, indent=1).replace("</", "<\\/")

body = (src / "body.html").read_text(encoding="utf-8")
assert "/*PACKS*/" in body, "placeholder /*PACKS*/ missing in src/body.html"
body = body.replace("/*PACKS*/", packs_json)

out = (head + (src / "style.css").read_text(encoding="utf-8") + "</style>\n</head>\n"
       + body
       + "<script>\n" + (src / "app1.js").read_text(encoding="utf-8") + "\n"
       + (src / "app2.js").read_text(encoding="utf-8") + "</script>\n</body>\n</html>\n")
if not preview:
    out = out.replace("const PREVIEW = true;", "const PREVIEW = false;")

target = (root.parent / "docs" / "demo.html") if demo else (root / "morning-brief.html")
target.write_text(out, encoding="utf-8")
print("wrote", target.relative_to(root.parent), "-", len(out), "chars", "(preview)" if preview else "", "(demo)" if demo else "")

if demo:
    # the GitHub Pages site shows the setup prompt with a copy button: keep it in sync with prompts/setup-prompt.md
    md = (root.parent / "prompts" / "setup-prompt.md").read_text(encoding="utf-8")
    prompt = md.split("```text\n", 1)[1].split("\n```", 1)[0]
    (root.parent / "docs" / "setup-prompt.txt").write_text(prompt + "\n", encoding="utf-8")
    print("wrote docs/setup-prompt.txt -", len(prompt), "chars")
