#!/usr/bin/env python3
"""Render the generated .docx deliverables as standalone web pages.

Reads word/document.xml straight out of each .docx (docx-js writes real
Heading1/2/3 styles, so the structure survives) and emits semantic HTML
styled with the project's own VISUAL_STYLE_GUIDE palette.
"""
import html
import re
import sys
import zipfile
from pathlib import Path

DOCS_DIR = Path(
    "/Users/benaheto/Library/CloudStorage/GoogleDrive-akaheto@gmail.com"
    "/My Drive/Claude/Code/Exercise Partner"
)

DOCS = [
    ("PROJECT_PLAN", "Project Plan", "Deliverable status, open assumptions and the running changelog."),
    ("TECHNICAL_SPEC", "Technical Spec", "Architecture, data model, key decisions and known risks."),
    ("VISUAL_STYLE_GUIDE", "Visual Style Guide", "Palette, typography, spacing and component patterns."),
    ("USER_GUIDE", "User Guide", "How to use the app, written for everyday use."),
    ("ENHANCEMENTS", "Enhancements", "Ideas implemented, queued and deliberately rejected."),
]

STATUS = {
    "\U0001F532": ("not-started", "Not started"),
    "\U0001F7E1": ("in-progress", "In progress"),
    "✅": ("done", "Done"),
    "⛔": ("blocked", "Blocked"),
}
VERDICT = {
    "Open": "open", "Assumed": "assumed", "Decided": "decided",
    "Resolved": "resolved", "Accepted": "accepted",
}


def runs(p):
    """Inline runs -> HTML, preserving bold and mono-ish emphasis."""
    out = []
    for r in re.findall(r"<w:r[ >].*?</w:r>", p, re.S):
        t = "".join(re.findall(r"<w:t(?:\s[^>]*)?>(.*?)</w:t>", r, re.S))
        if not t:
            continue
        t = html.escape(html.unescape(t))
        if re.search(r'<w:b/>|<w:b w:val="(?:true|1)"', r):
            t = f"<strong>{t}</strong>"
        out.append(t)
    return "".join(out)


def cell_html(text):
    """A table cell: turn status emoji and verdict words into real chips."""
    raw = text.strip()
    if raw in STATUS:
        cls, label = STATUS[raw]
        return f'<span class="chip {cls}">{label}</span>'
    if raw in VERDICT:
        return f'<span class="chip {VERDICT[raw]}">{html.escape(raw)}</span>'
    return html.escape(raw)


def parse(docx):
    with zipfile.ZipFile(docx) as z:
        doc = z.read("word/document.xml").decode("utf-8")
    body = re.search(r"<w:body>(.*)</w:body>", doc, re.S).group(1)
    blocks = re.findall(r"<w:tbl>.*?</w:tbl>|<w:p[ >].*?</w:p>|<w:p/>", body, re.S)

    out, buf = [], []

    def flush():
        if buf:
            out.append(("ul", list(buf)))
            buf.clear()

    for b in blocks:
        if b.startswith("<w:tbl>"):
            flush()
            rows = []
            for tr in re.findall(r"<w:tr[ >].*?</w:tr>", b, re.S):
                cells = []
                for tc in re.findall(r"<w:tc[ >].*?</w:tc>", tr, re.S):
                    txt = "".join(re.findall(r"<w:t(?:\s[^>]*)?>(.*?)</w:t>", tc, re.S))
                    cells.append(html.unescape(txt))
                rows.append(cells)
            if rows:
                out.append(("table", rows))
            continue

        style = re.search(r'w:pStyle w:val="([^"]+)"', b)
        style = style.group(1) if style else None
        is_list = "<w:numPr>" in b
        shade = re.search(r'w:fill="(F8FAFC)"', b)
        inner = runs(b)
        plain = re.sub(r"<[^>]+>", "", inner).strip()

        if not plain:
            continue
        if is_list:
            buf.append(inner)
            continue
        flush()
        if shade:
            out.append(("callout", inner))
        elif style and style.startswith("Heading"):
            out.append((f"h{style[-1]}", inner))
        else:
            out.append(("p", inner))
    flush()
    return out


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", re.sub(r"<[^>]+>", "", text).lower()).strip("-")


def render(blocks, key, title, tagline):
    parts, toc = [], []
    # first two paragraphs are the docx title + subtitle
    body = blocks[:]
    doc_sub = ""
    if body and body[0][0] == "p":
        body.pop(0)
    if body and body[0][0] == "p":
        doc_sub = re.sub(r"<[^>]+>", "", body[0][1]).split("   ·   ")[0]
        body.pop(0)

    for kind, val in body:
        if kind.startswith("h"):
            val = re.sub(r"</?strong>", "", val)
        if kind == "h1":
            s = slug(val)
            toc.append((s, re.sub(r"<[^>]+>", "", val)))
            parts.append(f'<h2 id="{s}">{val}</h2>')
        elif kind in ("h2", "h3"):
            tag = "h3" if kind == "h2" else "h4"
            parts.append(f"<{tag}>{val}</{tag}>")
        elif kind == "p":
            parts.append(f"<p>{val}</p>")
        elif kind == "callout":
            m = re.match(r"<strong>(.*?)</strong>\s*(.*)", val, re.S)
            if m:
                parts.append(
                    f'<aside class="callout"><p class="callout-label">{m.group(1)}</p>'
                    f"<p>{m.group(2)}</p></aside>"
                )
            else:
                parts.append(f'<aside class="callout"><p>{val}</p></aside>')
        elif kind == "ul":
            lis = "".join(f"<li>{i}</li>" for i in val)
            parts.append(f"<ul>{lis}</ul>")
        elif kind == "table":
            head, *rest = val
            th = "".join(f"<th>{html.escape(c)}</th>" for c in head)
            trs = []
            for r in rest:
                tds = "".join(f"<td>{cell_html(c)}</td>" for c in r)
                trs.append(f"<tr>{tds}</tr>")
            parts.append(
                '<div class="scroll"><table><thead><tr>'
                + th
                + "</tr></thead><tbody>"
                + "".join(trs)
                + "</tbody></table></div>"
            )

    # `t` came through runs(), so it is already escaped — escaping again is
    # what turned "Decisions & Tradeoffs" into "Decisions &amp;amp; Tradeoffs".
    nav = "".join(f'<li><a href="#{s}">{t}</a></li>' for s, t in toc)
    others = "".join(
        f'<li><span>{html.escape(t)}</span></li>' if k == key else f"<li><span>{html.escape(t)}</span></li>"
        for k, t, _ in DOCS
    )
    return PAGE.format(
        title=html.escape(title),
        tagline=html.escape(tagline),
        sub=html.escape(doc_sub),
        nav=nav,
        content="\n".join(parts),
    )


PAGE = """<title>{title} — Exercise Partner</title>
<style>
:root {{
  --ground: #ffffff;
  --raised: #f7f9fa;
  --ink: #0f172a;
  --muted: #5f6d82;
  --line: #e2e8f0;
  --line-soft: #eef2f6;
  --accent: #0f766e;
  --accent-soft: #f0fdfa;
  --accent-line: #99f6e4;
  --ok: #15803d;      --ok-bg: #f0fdf4;   --ok-line: #bbf7d0;
  --warn: #b45309;    --warn-bg: #fffbeb; --warn-line: #fde68a;
  --stop: #b91c1c;    --stop-bg: #fef2f2; --stop-line: #fecaca;
  --info: #1d4ed8;    --info-bg: #eff6ff; --info-line: #bfdbfe;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}}
@media (prefers-color-scheme: dark) {{
  :root {{
    --ground: #0b1220; --raised: #121b2c; --ink: #e6edf6; --muted: #94a3b8;
    --line: #223049; --line-soft: #1a2438;
    --accent: #2dd4bf; --accent-soft: #10241f; --accent-line: #1d5c53;
    --ok: #4ade80;   --ok-bg: #0d2318;   --ok-line: #1d5133;
    --warn: #fbbf24; --warn-bg: #291d07; --warn-line: #6b4a10;
    --stop: #f87171; --stop-bg: #2a1113; --stop-line: #6d2225;
    --info: #93c5fd; --info-bg: #0f1d33; --info-line: #26436f;
  }}
}}
:root[data-theme="dark"] {{
  --ground: #0b1220; --raised: #121b2c; --ink: #e6edf6; --muted: #94a3b8;
  --line: #223049; --line-soft: #1a2438;
  --accent: #2dd4bf; --accent-soft: #10241f; --accent-line: #1d5c53;
  --ok: #4ade80;   --ok-bg: #0d2318;   --ok-line: #1d5133;
  --warn: #fbbf24; --warn-bg: #291d07; --warn-line: #6b4a10;
  --stop: #f87171; --stop-bg: #2a1113; --stop-line: #6d2225;
  --info: #93c5fd; --info-bg: #0f1d33; --info-line: #26436f;
}}
:root[data-theme="light"] {{
  --ground: #ffffff; --raised: #f7f9fa; --ink: #0f172a; --muted: #5f6d82;
  --line: #e2e8f0; --line-soft: #eef2f6;
  --accent: #0f766e; --accent-soft: #f0fdfa; --accent-line: #99f6e4;
  --ok: #15803d;   --ok-bg: #f0fdf4;   --ok-line: #bbf7d0;
  --warn: #b45309; --warn-bg: #fffbeb; --warn-line: #fde68a;
  --stop: #b91c1c; --stop-bg: #fef2f2; --stop-line: #fecaca;
  --info: #1d4ed8; --info-bg: #eff6ff; --info-line: #bfdbfe;
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0; background: var(--ground); color: var(--ink);
  font-family: var(--sans); font-size: 16px; line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}}
.wrap {{ display: grid; grid-template-columns: 232px minmax(0, 1fr); gap: 56px;
  max-width: 1120px; margin: 0 auto; padding: 0 32px; }}
aside.rail {{ position: sticky; top: 0; align-self: start; height: 100vh;
  padding: 56px 0 32px; overflow-y: auto; }}
.eyebrow {{ font-family: var(--mono); font-size: 11px; letter-spacing: .13em;
  text-transform: uppercase; color: var(--accent); margin: 0 0 20px; }}
.rail ol {{ list-style: none; margin: 0; padding: 0 0 0 0;
  border-left: 2px solid var(--line); display: flex; flex-direction: column; }}
.rail a {{ display: block; padding: 6px 0 6px 14px; margin-left: -2px;
  border-left: 2px solid transparent; color: var(--muted);
  text-decoration: none; font-size: 13.5px; line-height: 1.4; }}
.rail a:hover {{ color: var(--accent); border-left-color: var(--accent-line); }}
.rail a:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
main {{ padding: 56px 0 120px; min-width: 0; }}
header.doc {{ border-bottom: 1px solid var(--line); padding-bottom: 28px; margin-bottom: 8px; }}
h1 {{ font-size: 40px; line-height: 1.12; letter-spacing: -.021em; margin: 6px 0 12px;
  text-wrap: balance; font-weight: 640; }}
.tagline {{ color: var(--muted); font-size: 17px; margin: 0 0 14px; max-width: 60ch; }}
.stamp {{ font-family: var(--mono); font-size: 12px; color: var(--muted); margin: 0; }}
h2 {{ font-size: 25px; letter-spacing: -.012em; margin: 60px 0 4px; scroll-margin-top: 24px;
  padding-bottom: 10px; border-bottom: 2px solid var(--accent-line); text-wrap: balance; font-weight: 640; }}
h3 {{ font-size: 18px; margin: 34px 0 2px; color: var(--accent); text-wrap: balance; font-weight: 640; }}
h4 {{ font-size: 15.5px; margin: 26px 0 2px; text-wrap: balance; font-weight: 650; }}
p {{ margin: 14px 0; max-width: 68ch; }}
ul {{ margin: 14px 0; padding-left: 20px; max-width: 68ch; display: flex;
  flex-direction: column; gap: 7px; }}
li::marker {{ color: var(--accent); }}
strong {{ font-weight: 650; }}
.callout {{ background: var(--raised); border: 1px solid var(--line);
  border-left: 3px solid var(--accent); border-radius: 0 10px 10px 0;
  padding: 16px 20px; margin: 22px 0; max-width: 68ch; }}
.callout p {{ margin: 0; }}
.callout-label {{ font-family: var(--mono); font-size: 11px; letter-spacing: .1em;
  text-transform: uppercase; color: var(--accent); margin: 0 0 6px !important; }}
.scroll {{ overflow-x: auto; margin: 22px 0; border: 1px solid var(--line);
  border-radius: 10px; }}
table {{ border-collapse: collapse; width: 100%; font-size: 13.5px; line-height: 1.5; }}
th {{ background: var(--raised); text-align: left; font-weight: 650; font-size: 11.5px;
  letter-spacing: .07em; text-transform: uppercase; color: var(--muted);
  padding: 11px 14px; border-bottom: 1px solid var(--line); white-space: nowrap; }}
td {{ padding: 12px 14px; border-bottom: 1px solid var(--line-soft);
  vertical-align: top; font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere; }}
td:has(.chip) {{ white-space: nowrap; }}
tbody tr:last-child td {{ border-bottom: 0; }}
tbody tr:hover {{ background: var(--raised); }}
td:first-child {{ font-family: var(--mono); font-size: 12px; color: var(--muted);
  white-space: nowrap; }}
.chip {{ display: inline-block; white-space: nowrap; font-family: var(--mono);
  font-size: 10.5px; letter-spacing: .05em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 999px; border: 1px solid; font-weight: 600; }}
.done, .resolved {{ color: var(--ok); background: var(--ok-bg); border-color: var(--ok-line); }}
.in-progress {{ color: var(--warn); background: var(--warn-bg); border-color: var(--warn-line); }}
.blocked, .open {{ color: var(--stop); background: var(--stop-bg); border-color: var(--stop-line); }}
.not-started {{ color: var(--muted); background: var(--raised); border-color: var(--line); }}
.assumed, .decided, .accepted {{ color: var(--info); background: var(--info-bg); border-color: var(--info-line); }}
@media (max-width: 900px) {{
  .wrap {{ grid-template-columns: 1fr; gap: 0; padding: 0 20px; }}
  aside.rail {{ position: static; height: auto; padding: 32px 0 0; }}
  .rail ol {{ max-height: 190px; overflow-y: auto; }}
  main {{ padding: 28px 0 80px; }}
  h1 {{ font-size: 31px; }}
  h2 {{ font-size: 21px; margin-top: 44px; }}
}}
</style>
<div class="wrap">
  <aside class="rail">
    <p class="eyebrow">Exercise Partner</p>
    <nav><ol>{nav}</ol></nav>
  </aside>
  <main>
    <header class="doc">
      <h1>{title}</h1>
      <p class="tagline">{tagline}</p>
      <p class="stamp">{sub}</p>
    </header>
    {content}
  </main>
</div>
"""


def main():
    out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    out_dir.mkdir(parents=True, exist_ok=True)
    for key, title, tagline in DOCS:
        src = DOCS_DIR / f"{key}.docx"
        page = render(parse(src), key, title, tagline)
        dest = out_dir / f"{key.lower()}.html"
        page = page.encode("ascii", "xmlcharrefreplace").decode("ascii")
        dest.write_text(page, encoding="utf-8")
        print(f"  {dest.name}  {len(page):>7,} bytes")


if __name__ == "__main__":
    main()
