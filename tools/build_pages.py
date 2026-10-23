#!/usr/bin/env python3
"""Build the portfolio from tools/content.py.

Outputs
  site.html                          the graphical website
  assets/js/portfolio-data.js        the same content for the terminal (index.html)
  templates/*/*.html                 detail pages re-skinned with the website chrome
  templates/{experience,...}.html    old section URLs, now redirects into site.html

The terminal itself (index.html, terminal.css, terminal.js) is hand-written and
only reads portfolio-data.js.

Run from anywhere:  python3 tools/build_pages.py
"""

import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import content as C  # noqa: E402  (local module next to this script)

REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = REPO_ROOT / "templates"
DATA_FILE = REPO_ROOT / "assets" / "js" / "portfolio-data.js"
SITE_FILE = "site.html"
TERMINAL_FILE = "index.html"

FONT_LINKS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    '  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800'
    '&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">'
)

DEVICON_URL = "https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/{0}/{0}-original.svg"

# Simple 24px line icons (stroke-based), drawn for this site.
ICONS = {
    "home": '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    "folder": '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
    "briefcase": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/><path d="M3 12.5h18"/>',
    "chip": '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
    "cap": '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/>',
    "pen": '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    "terminal": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3"/><path d="M12 15h5"/>',
    "arrow": '<path d="M7 17 17 7"/><path d="M8 7h9v9"/>',
    "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    "wave": '<path d="M2 12h3V6h4v12h4V6h4v6h5"/>',
    "github": '<path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    "linkedin": '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v5M8 8v.01M12 16v-5M16 16v-3a2 2 0 0 0-4 0"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "pin": '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
}

NAV_ITEMS = [
    ("home", "Home", "home"),
    ("projects", "Projects", "folder"),
    ("experience", "Experience", "briefcase"),
    ("toolkit", "Toolkit", "chip"),
    ("education", "Education", "cap"),
    ("contact", "Contact", "pen"),
]


# --------------------------------------------------------------------------
# Small helpers
# --------------------------------------------------------------------------

def esc(text):
    return html.escape(text, quote=True)


def icon(name, extra_class=""):
    class_name = f"icon {extra_class}".strip()
    return (f'<svg class="{class_name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" '
            f'aria-hidden="true">{ICONS[name]}</svg>')


def two_tone(first, second, tag="h2", element_id=None):
    id_attr = f' id="{element_id}-title"' if element_id else ""
    return (f'<{tag} class="display"{id_attr}><span>{esc(first)}</span>'
            f'<span class="display__dim">{esc(second)}</span></{tag}>')


def social_links(prefix=""):
    return (
        f'<a href="{C.GITHUB_URL}" target="_blank" rel="noopener" aria-label="GitHub">{icon("github")}</a>'
        f'<a href="{C.LINKEDIN_URL}" target="_blank" rel="noopener" aria-label="LinkedIn">{icon("linkedin")}</a>'
        f'<a href="mailto:{C.EMAIL}" aria-label="Email">{icon("mail")}</a>'
    )


def head(prefix, title, description=None):
    description = description or C.TAGLINE
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="theme-color" content="#151312">
  {FONT_LINKS}
  <link rel="stylesheet" href="{prefix}styles.css">
</head>"""


def pill_nav(prefix, on_site_page):
    """Floating icon nav. On site.html links are in-page anchors."""
    base = "" if on_site_page else f"{prefix}{SITE_FILE}"
    items = []
    for section_id, label, icon_name in NAV_ITEMS:
        items.append(
            f'<a class="pill-nav__link" href="{base}#{section_id}" data-nav="{section_id}" '
            f'aria-label="{label}" title="{label}">{icon(icon_name)}</a>')
    items.append(
        f'<a class="pill-nav__link pill-nav__link--terminal" href="{prefix}{TERMINAL_FILE}" '
        f'title="Switch to the terminal">{icon("terminal")}<span>Terminal</span></a>')
    return f'<nav class="pill-nav" aria-label="Main">{"".join(items)}</nav>'


def footer(prefix):
    return f"""<footer class="site-footer">
      <span>© <span data-year></span> {esc(C.NAME)} · {esc(C.LOCATION)}</span>
      <a href="{prefix}{TERMINAL_FILE}">{icon("terminal")} Prefer a shell? Open the terminal</a>
    </footer>"""


def chips(tags):
    return '<ul class="chips">' + "".join(f'<li class="chip">{esc(t)}</li>' for t in tags) + "</ul>"


# --------------------------------------------------------------------------
# Website sections
# --------------------------------------------------------------------------

def profile_card(prefix):
    return f"""<aside class="profile" aria-label="Profile">
        <div class="profile__card">
          <svg class="profile__arc profile__arc--top" viewBox="0 0 200 120" aria-hidden="true"><path d="M2 2c30 90 120 120 196 80"/></svg>
          <svg class="profile__arc profile__arc--side" viewBox="0 0 120 200" aria-hidden="true"><path d="M118 2C30 40 0 120 40 198"/></svg>
          <span class="profile__badge" aria-hidden="true">{icon("bolt")}</span>
          <div class="profile__photo"><img src="{prefix}{C.PHOTO}" alt="{esc(C.NAME)}"></div>
          <h1 class="profile__name">{esc(C.NAME)}</h1>
          <p class="profile__tagline">{esc(C.TITLE)} based in {esc(C.LOCATION.split(",")[0])}.</p>
          <div class="profile__social">{social_links(prefix)}</div>
        </div>
      </aside>"""


def section_home():
    stats = "".join(f"""
          <div class="stat"><span class="stat__value">+{esc(value)}</span><span class="stat__label">{esc(label)}</span></div>"""
                    for value, label in C.STATS)
    domains, stack = C.HIGHLIGHT_CARDS
    return f"""
      <section class="block block--hero" id="home" aria-labelledby="home-title">
        {two_tone("Embedded", "Engineer", "h2", "home")}
        <p class="lede">{esc(C.BIO)}</p>
        <div class="stats">{stats}
        </div>
        <div class="highlight-cards">
          <a class="highlight highlight--orange" href="#projects">
            <svg class="highlight__pattern" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><path d="M-10 160 C 60 40, 120 220, 200 90 S 330 10, 410 120"/><path d="M-10 190 C 70 80, 140 250, 220 120 S 340 50, 410 150"/></svg>
            {icon("bolt", "highlight__icon")}
            <span class="highlight__text">{esc(domains["text"])}</span>
            <span class="highlight__arrow">{icon("arrow")}</span>
          </a>
          <a class="highlight highlight--lime" href="#toolkit">
            <svg class="highlight__pattern" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><path d="M-5 150h40V60h50v90h40V60h60v90h30V60h50v90h40V60h60v90"/></svg>
            {icon("wave", "highlight__icon")}
            <span class="highlight__text">{esc(stack["text"])}</span>
            <span class="highlight__arrow">{icon("arrow")}</span>
          </a>
        </div>
      </section>"""


def section_projects(prefix):
    rows = "".join(f"""
          <li><a class="row" href="{prefix}{p["page"]}">
            <img class="row__thumb" src="{prefix}{p["image"]}" alt="" loading="lazy">
            <span class="row__body">
              <span class="row__title">{esc(p["title"])}</span>
              <span class="row__meta">{esc(p["subtitle"])}</span>
            </span>
            <span class="row__arrow">{icon("arrow")}</span>
          </a></li>""" for p in C.PROJECTS)
    return f"""
      <section class="block" id="projects" aria-labelledby="projects-title">
        {two_tone("Recent", "Projects", "h2", "projects")}
        <ul class="rows">{rows}
        </ul>
      </section>"""


def section_experience(prefix):
    entries = []
    for job in C.EXPERIENCE:
        entries.append(f"""
          <li><a class="entry" href="{prefix}{job["page"]}">
            <span class="entry__title">{esc(job["org"])}</span>
            <span class="entry__role">{esc(job["role"])}</span>
            <span class="entry__text">{esc(job["summary"])}</span>
            <span class="entry__date">{esc(job["date"])}</span>
            <span class="entry__arrow">{icon("arrow")}</span>
          </a></li>""")
    return f"""
      <section class="block" id="experience" aria-labelledby="experience-title">
        {two_tone("3 Years of", "Experience", "h2", "experience")}
        <ul class="entries">{"".join(entries)}
        </ul>
      </section>"""


def section_toolkit():
    tiles = []
    for name, label, devicon, short_label in C.TOOLS:
        monogram = esc(short_label)
        if devicon:
            logo = (f'<span class="tool__logo"><img src="{DEVICON_URL.format(devicon)}" alt="" '
                    f'loading="lazy" data-fallback="{monogram}"></span>')
        else:
            logo = f'<span class="tool__logo tool__logo--mono">{monogram}</span>'
        tiles.append(f"""
          <li class="tool">{logo}<span><span class="tool__name">{esc(name)}</span><span class="tool__label">{esc(label)}</span></span></li>""")

    groups = "".join(chips(items) for _, items in C.SKILL_GROUPS)
    return f"""
      <section class="block" id="toolkit" aria-labelledby="toolkit-title">
        {two_tone("Embedded", "Toolkit", "h2", "toolkit")}
        <ul class="tools">{"".join(tiles)}
        </ul>
        <details class="all-skills">
          <summary>Every skill, grouped</summary>
          <div class="all-skills__body">{groups}</div>
        </details>
      </section>"""


def section_education(prefix):
    entries = []
    for item in C.EDUCATION:
        tag_open = f'<a class="entry" href="{prefix}{item["page"]}">' if item["page"] else '<div class="entry entry--static">'
        tag_close = "</a>" if item["page"] else "</div>"
        arrow = f'<span class="entry__arrow">{icon("arrow")}</span>' if item["page"] else ""
        summary = f'<span class="entry__text">{esc(item["summary"])}</span>' if item["summary"] else ""
        entries.append(f"""
          <li>{tag_open}
            <span class="entry__title">{esc(item["title"])}</span>
            <span class="entry__role">{esc(item["place"])}</span>
            {summary}
            <span class="entry__date">{esc(item["date"])}</span>
            {arrow}
          {tag_close}</li>""")
    courses = "".join(f"""
          <li><a href="{prefix}{course["page"]}">{esc(course["title"])}{icon("arrow")}</a></li>"""
                      for course in C.COURSES)
    return f"""
      <section class="block" id="education" aria-labelledby="education-title">
        {two_tone("Education", "& Courses", "h2", "education")}
        <ul class="entries">{"".join(entries)}
        </ul>
        <h3 class="subhead">Self-study courses</h3>
        <ul class="courses">{courses}
        </ul>
      </section>"""


def section_contact():
    return f"""
      <section class="block" id="contact" aria-labelledby="contact-title">
        {two_tone("Let's work", "together", "h2", "contact")}
        <form class="form" id="contact-form" data-email="{C.EMAIL}">
          <label>Name<input type="text" name="name" placeholder="Your name" autocomplete="name" required></label>
          <label>Email<input type="email" name="email" placeholder="you@company.com" autocomplete="email" required></label>
          <label class="form__wide">Looking for
            <select name="topic">
              <option>Internship</option>
              <option>Apprenticeship (alternance)</option>
              <option>Full-time role</option>
              <option>Freelance or something else</option>
            </select>
          </label>
          <label class="form__wide">Message<textarea name="message" placeholder="Tell me about the role or project" required></textarea></label>
          <button class="btn form__wide" type="submit">Open in my email app</button>
          <p class="form__note form__wide">Sends nothing by itself: it opens your email app with this message, addressed to {esc(C.EMAIL)}.</p>
        </form>
      </section>"""


def write_site():
    prefix = ""
    page = f"""{head(prefix, f"{C.NAME}, {C.TITLE}")}
<body class="site">
  {pill_nav(prefix, on_site_page=True)}
  <div class="layout">
    {profile_card(prefix)}
    <main class="content">{section_home()}{section_projects(prefix)}{section_experience(prefix)}{section_toolkit()}{section_education(prefix)}{section_contact()}
    {footer(prefix)}
    </main>
  </div>
  <script src="script.js"></script>
</body>
</html>
"""
    (REPO_ROOT / SITE_FILE).write_text(page, encoding="utf-8")


# --------------------------------------------------------------------------
# Old section URLs → redirects (keeps links people may have saved working)
# --------------------------------------------------------------------------

def write_redirects():
    for name, anchor in [("experience", "experience"), ("education", "education"),
                         ("skills", "toolkit"), ("contact", "contact")]:
        target = f"../{SITE_FILE}#{anchor}"
        (TEMPLATES_DIR / f"{name}.html").write_text(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{esc(C.NAME)}</title>
  <meta http-equiv="refresh" content="0; url={target}">
  <link rel="canonical" href="{target}">
</head>
<body><p><a href="{target}">Continue to {name}</a></p></body>
</html>
""", encoding="utf-8")


# --------------------------------------------------------------------------
# Detail pages
# --------------------------------------------------------------------------

DETAIL_BACK = {
    "projects": ("projects", "All projects"),
    "experience": ("experience", "All experience"),
    "education": ("education", "Education"),
}

OLD_NAV = re.compile(r"\s*(<div class=\"bg\"[^>]*>\s*</div>\s*)?<nav\b.*?</nav>", re.S)
OLD_HEADER = re.compile(r"\s*(<div class=\"bg\"[^>]*>\s*</div>\s*)?<header class=\"site-nav\">.*?</header>", re.S)
INLINE_ACCENT = re.compile(r'\s*style="color:\s*var\(--clr-accent\);?"')
TEXT_FIXES = {
    "experience-powersoft.html": [
        ("Nov 2024 - Present", "Nov 2024 - Aug 2025"),
        ("At Powersoft, I’m contributing to", "At Powersoft, I contributed to"),
    ],
}


def extract_detail_body(source):
    """Return only the page's own content, without any old or new chrome."""
    body = re.search(r"<body[^>]*>(.*)</body>", source, re.S).group(1)
    body = re.sub(r"\s*<!--.*?-->", "", body, flags=re.S)
    body = OLD_NAV.sub("", body)
    body = OLD_HEADER.sub("", body)
    body = re.sub(r'\s*<nav class="pill-nav".*?</nav>', "", body, flags=re.S)
    body = re.sub(r"\s*<footer\b.*?</footer>", "", body, flags=re.S)
    body = re.sub(r"\s*<script\b.*?</script>", "", body, flags=re.S)
    body = re.sub(r'\s*<a class="page-back".*?</a>', "", body, flags=re.S)
    body = re.sub(r"</?main\b[^>]*>", "", body)
    body = INLINE_ACCENT.sub("", body)
    body = body.replace('class="project-page container glass"', 'class="project-page"')
    return body.strip()


def reskin_detail_page(path):
    section_dir = path.parent.name
    anchor, back_label = DETAIL_BACK[section_dir]
    prefix = "../../"
    source = path.read_text(encoding="utf-8")

    title_match = re.search(r"<title>(.*?)</title>", source, re.S)
    title = html.unescape(title_match.group(1).strip()) if title_match else C.NAME
    title = title.replace(" · ", ", ")

    body = extract_detail_body(source)
    for old_text, new_text in TEXT_FIXES.get(path.name, []):
        body = body.replace(old_text, new_text)

    page = f"""{head(prefix, title)}
<body class="detail">
  {pill_nav(prefix, on_site_page=False)}
  <main class="detail__main">
    <a class="page-back" href="{prefix}{SITE_FILE}#{anchor}">← {back_label}</a>
    {body}
  </main>
  <div class="detail__footer">{footer(prefix)}</div>
  <script src="{prefix}script.js"></script>
</body>
</html>
"""
    path.write_text(page, encoding="utf-8")
    return body


# --------------------------------------------------------------------------
# Terminal data (text pulled from the detail pages)
# --------------------------------------------------------------------------

def plain_text(fragment):
    text = re.sub(r"<[^>]+>", "", fragment)
    return re.sub(r"\s+", " ", html.unescape(text)).strip()


def paragraphs(body):
    found = [plain_text(p) for p in re.findall(r"<p\b[^>]*>(.*?)</p>", body, re.S)]
    skip_prefixes = ("Duration", "Note", "Institution", "Responsibilities")
    return [p for p in found if p and not p.startswith(skip_prefixes)
            and "·" not in p[:60] and len(p) > 40]


def list_items(body):
    return [plain_text(li) for li in re.findall(r"<li\b[^>]*>(.*?)</li>", body, re.S)]


def first_sentences(text, count=2):
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return " ".join(sentences[:count])


def write_terminal_data(detail_bodies):
    projects = []
    for project in C.PROJECTS:
        body = detail_bodies.get(project["page"], "")
        intro = paragraphs(body)
        projects.append({
            "slug": project["slug"],
            "title": project["title"],
            "subtitle": project["subtitle"],
            "tags": project["tags"],
            "page": project["page"],
            "about": first_sentences(intro[0], 3) if intro else project["subtitle"],
        })

    experience = []
    for job in C.EXPERIENCE:
        body = detail_bodies.get(job["page"], "")
        experience.append({
            "slug": job["slug"], "org": job["org"], "role": job["role"],
            "date": job["date"], "summary": job["summary"], "page": job["page"],
            "points": list_items(body)[:6],
        })

    data = {
        "name": C.NAME, "firstName": C.FIRST_NAME, "title": C.TITLE,
        "location": C.LOCATION, "email": C.EMAIL, "github": C.GITHUB_URL,
        "linkedin": C.LINKEDIN_URL, "bio": C.BIO, "sitePage": SITE_FILE,
        "projects": projects, "experience": experience,
        "education": C.EDUCATION, "courses": C.COURSES,
        "skills": {name: items for name, items in C.SKILL_GROUPS},
    }
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(
        "/* Generated by tools/build_pages.py from tools/content.py. Do not edit by hand. */\n"
        "window.PORTFOLIO = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8")


def main():
    write_site()
    write_redirects()
    detail_bodies = {}
    for section_dir in DETAIL_BACK:
        for path in sorted((TEMPLATES_DIR / section_dir).glob("*.html")):
            relative = f"templates/{section_dir}/{path.name}"
            detail_bodies[relative] = reskin_detail_page(path)
    write_terminal_data(detail_bodies)


if __name__ == "__main__":
    main()
