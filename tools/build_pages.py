#!/usr/bin/env python3
"""Generate the portfolio pages from one source of truth.

Writes index.html and templates/{experience,education,skills,contact}.html
from the data below, and re-skins every detail page under templates/*/
with the shared head, navigation and footer (page content is untouched).

Run from the repository root:  python3 tools/build_pages.py
"""

import html
import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = REPO_ROOT / "templates"

SITE_NAME = "Obaid Tanveer"
EMAIL = "obaidtanveer04@gmail.com"
GITHUB_URL = "https://github.com/Obaidtanveer1804"
LINKEDIN_URL = "https://www.linkedin.com/in/obaid-tanveer-1a889523b/"

# --------------------------------------------------------------------------
# Content
# --------------------------------------------------------------------------

EXPERIENCE = [
    {
        "date": "Aug 2025 – Sep 2026",
        "role": "Embedded Systems QA Engineer",
        "org": "Motive",
        "summary": "Tested AI dashcams and Linux-based embedded products. Wrote test "
                   "profiles and automation scripts that widened coverage and cut about "
                   "two weeks of manual testing.",
        "page": "experience/experience-motive.html",
    },
    {
        "date": "Nov 2024 – Aug 2025",
        "role": "Embedded Firmware Engineer",
        "org": "Powersoft",
        "summary": "Firmware for EV charging and battery management on dual-core STM32H7: "
                   "an L2 charger built from scratch, a Li-ion BMS over isoSPI and CAN, "
                   "freeV2G on Raspberry Pi, and an OTA bootloader.",
        "page": "experience/experience-powersoft.html",
    },
    {
        "date": "Jul 2023 – Nov 2024",
        "role": "Embedded Firmware Engineer, Robotics",
        "org": "Esforge",
        "summary": "Motor-control libraries for RP2040 (PIO) and ESP32 (FreeRTOS, LEDC), "
                   "firmware and PCBs for industrial food machines, closed-loop steppers "
                   "with AS5600 encoders.",
        "page": "experience/experience-esforge.html",
    },
    {
        "date": "Jul 2023 – Aug 2023",
        "role": "Embedded Engineering Intern",
        "org": "EPTeck Pvt. Ltd",
        "summary": "FreeRTOS on ESP32 for IoT projects, firmware debugging with senior "
                   "engineers, reusable C drivers for peripherals.",
        "page": "experience/experience-epteck.html",
    },
    {
        "date": "6 months",
        "role": "Lab Assistant",
        "org": "PIEAS, Microprocessors & Interfacing Lab",
        "summary": "Taught STM32 assembly and C, timers, ADCs and GPIO in STM32CubeIDE "
                   "and Keil, and sensor interfacing.",
        "page": "experience/experience-pieas.html",
    },
    {
        "date": "Aug 2022 – Sep 2022",
        "role": "Firmware Engineering Intern",
        "org": "109 AED",
        "summary": "Robotics simulation in CoppeliaSim, SolidWorks parts for prototypes, "
                   "embedded testing and debugging.",
        "page": "experience/experience-aed.html",
    },
]

FEATURED_PROJECTS = [
    {
        "title": "Battery Management System",
        "text": "LTC6804 cell monitoring over isoSPI into an STM32, fault handling and "
                "SoC estimation, data out over CAN, and a C#/.NET desktop app for live "
                "monitoring.",
        "tags": ["STM32", "isoSPI", "LTC6804", "CAN", "C#/.NET"],
        "image": "assets/dc1941d.png",
        "page": "templates/projects/project-1.html",
    },
    {
        "title": "Level 2 EV charger",
        "text": "A 7.4 kW single-phase charger following IEC 61851-1: Control Pilot and "
                "Proximity Pilot detection, a charging state machine and relay control on "
                "an STM32H7.",
        "tags": ["STM32H7", "IEC 61851-1", "ADC", "CAN", "Relays"],
        "image": "assets/ev-connector-tn.png",
        "page": "templates/projects/project-2.html",
    },
    {
        "title": "freeV2G",
        "text": "Bidirectional vehicle-to-grid charging built on OpenEVSE, Whitebeet "
                "boards and a Raspberry Pi 4.",
        "tags": ["Raspberry Pi", "Whitebeet", "OpenEVSE", "V2G", "Python"],
        "image": "assets/whitebeet-2.png",
        "page": "templates/projects/project-3.html",
    },
]

PROJECTS = [
    ("SCARA robot with ROS2", ["ROS2", "STM32", "CoppeliaSim", "Python"],
     "assets/ros-2.png", "templates/projects/project-13.html"),
    ("6-DOF robot arm", ["STM32", "CoppeliaSim", "CAN"],
     "assets/fyp-6dof.jpeg", "templates/projects/project-4.html"),
    ("Protein bar pressing machine", ["RP2040", "ESP32", "Robotics"],
     "assets/protien-press.JPEG", "templates/projects/project-5.html"),
    ("Paratha pressing machine", ["ESP32", "FreeRTOS", "Robotics"],
     "assets/paratha-pressing-machine-asm.JPEG", "templates/projects/project-6.html"),
    ("Filling machine", ["RP2040", "ESP32", "Steppers", "C++"],
     "assets/filling-machine-pcb.JPEG", "templates/projects/project-7.html"),
    ("ESP32 smartwatch", ["ESP32", "FreeRTOS", "C++"],
     "assets/schematic-tn.png", "templates/projects/project-9.html"),
    ("Stepper library for RP2040", ["RP2040", "PIO", "C++"],
     "assets/stepper-tn.jpeg", "templates/projects/project-10.html"),
    ("Smart home relay device", ["ESP32", "PlatformIO", "IoT"],
     "assets/relay.png", "templates/projects/project-11.html"),
    ("This portfolio", ["HTML", "CSS", "JavaScript"],
     "assets/pftn.png", "templates/projects/project-12.html"),
]

SKILL_GROUPS = [
    ("Languages", ["C", "Embedded C", "C++", "Python", "Assembly", "C#", "JavaScript"]),
    ("Microcontrollers & boards", ["STM32 (F0, F4, H7)", "ESP32", "Raspberry Pi Pico",
                                   "Raspberry Pi 4"]),
    ("RTOS & operating systems", ["FreeRTOS", "Linux", "Raspbian", "ROS2"]),
    ("Protocols & buses", ["CAN", "CANopen", "isoSPI", "SPI", "UART", "I²C", "BLE",
                           "Ethernet"]),
    ("Domains", ["EV charging", "Battery management", "Motor control", "Robotics",
                 "Sensor interfacing", "IoT", "Embedded test automation"]),
    ("Tools", ["STM32CubeIDE", "ESP-IDF", "PlatformIO", "Keil", "Saleae logic analyzer",
               "CAN sniffer", "Oscilloscope", "CoppeliaSim", "Git"]),
]

EDUCATION = [
    {
        "title": "M.Sc. Electronics, ELISE programme (M1)",
        "place": "Université Marie et Louis Pasteur, Besançon",
        "date": "2026 – present",
        "logo": None,
        "logo_text": "UMLP",
        "page": None,
    },
    {
        "title": "B.Sc. Electrical Engineering",
        "place": "PIEAS, Pakistan Institute of Engineering and Applied Sciences",
        "date": "2020 – 2024",
        "logo": "assets/pieas.png",
        "page": "templates/education/education-university.html",
    },
    {
        "title": "Intermediate (FSc), Pre-Engineering",
        "place": "College",
        "date": "",
        "logo": "assets/college.png",
        "page": "templates/education/education-intermediate.html",
    },
    {
        "title": "Matric, Science",
        "place": "High school",
        "date": "",
        "logo": "assets/school.png",
        "page": "templates/education/education-matric.html",
    },
]

COURSES = [
    ("ROS2 for robotics", "assets/ros-2.png", "templates/education/course-ros2.html"),
    ("STM32 bootloader", "assets/bootloader.png",
     "templates/education/course-stm32-bootloader.html"),
    ("STM32 embedded C", "assets/stm.png", "templates/education/course-stm32-embedded-c.html"),
    ("Robotics fundamentals", "assets/robotics.png", "templates/education/course-robotics.html"),
    ("CANopen stack", "assets/canopen.png", "templates/education/course-canopen-stack.html"),
]

NAV_ITEMS = [
    ("experience", "Experience"),
    ("projects", "Projects"),
    ("skills", "Skills"),
    ("education", "Education"),
    ("contact", "Contact"),
]

ICON_PATHS = {
    "github": "M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37"
              "-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76"
              " 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.74.4-1.25.73-1.54-2.55-.29"
              "-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0"
              " .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58"
              ".23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36"
              ".78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z",
    "linkedin": "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14"
                " 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37"
                " 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12"
                " 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24"
                " 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
    "mail": "M2 5.5A2.5 2.5 0 0 1 4.5 3h15A2.5 2.5 0 0 1 22 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-15"
            "A2.5 2.5 0 0 1 2 18.5v-13Zm2.3-.5 7.7 6.16L19.7 5H4.3ZM20 6.3l-7.38 5.9a1 1 0 0 1"
            "-1.24 0L4 6.3v12.2c0 .28.22.5.5.5h15a.5.5 0 0 0 .5-.5V6.3Z",
}


# --------------------------------------------------------------------------
# Shared partials
# --------------------------------------------------------------------------

def esc(text):
    return html.escape(text, quote=True)


def icon(name):
    return (f'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">'
            f'<path d="{ICON_PATHS[name]}"/></svg>')


def social_links():
    return (
        f'<a href="{GITHUB_URL}" target="_blank" rel="noopener" aria-label="GitHub">'
        f'{icon("github")}</a>'
        f'<a href="{LINKEDIN_URL}" target="_blank" rel="noopener" aria-label="LinkedIn">'
        f'{icon("linkedin")}</a>'
        f'<a href="mailto:{EMAIL}" aria-label="Email">{icon("mail")}</a>'
    )


def head(prefix, title, description="Embedded firmware engineer: STM32, EV charging, "
                                    "battery management and robotics."):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="theme-color" content="#0f1420">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{prefix}styles.css">"""


def nav(prefix, active=None):
    """`prefix` is the relative path back to the repository root."""
    links = []
    for section_id, label in NAV_ITEMS:
        current = ' aria-current="page"' if section_id == active else ""
        links.append(f'<li><a href="{prefix}index.html#{section_id}"{current}>{label}</a></li>')
    return f"""<div class="bg" aria-hidden="true"></div>
  <header class="site-nav">
    <div class="container site-nav__inner">
      <a class="site-nav__brand" href="{prefix}index.html"><span class="site-nav__led" aria-hidden="true"></span>{SITE_NAME}</a>
      <button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-links" aria-label="Menu">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
      </button>
      <ul class="site-nav__links" id="site-links">
        {"".join(links)}
        <li class="site-nav__social">{social_links()}</li>
      </ul>
    </div>
  </header>"""


def footer(prefix):
    return f"""<footer class="site-footer">
    <div class="container site-footer__inner">
      <span>© <span data-year></span> {SITE_NAME}, Besançon</span>
      <span><a href="mailto:{EMAIL}">{EMAIL}</a></span>
    </div>
  </footer>
  <script src="{prefix}script.js"></script>"""


def chips(tags):
    items = "".join(f'<li class="chip">{esc(tag)}</li>' for tag in tags)
    return f'<ul class="chips">{items}</ul>'


# --------------------------------------------------------------------------
# Sections (prefix = path from the page to the repository root)
# --------------------------------------------------------------------------

def section_experience(prefix, heading_tag="h2"):
    items = []
    for job in EXPERIENCE:
        role = esc(job["role"])
        if job["page"]:
            role = f'<a href="{prefix}templates/{job["page"]}">{role}</a>'
        items.append(f"""
        <li class="timeline__item">
          <div class="timeline__date">{esc(job["date"])}</div>
          <div>
            <h3 class="timeline__role">{role}</h3>
            <div class="timeline__org">{esc(job["org"])}</div>
            <p class="timeline__summary">{esc(job["summary"])}</p>
          </div>
        </li>""")
    return f"""
    <section class="section container" id="experience">
      <div class="section__head">
        <{heading_tag} class="section__title">Experience</{heading_tag}>
        <p class="section__intro">About three years of embedded work, from robotics and
        food-processing machines to EV chargers, battery packs and AI dashcams.</p>
      </div>
      <ol class="timeline" reversed>{"".join(items)}
      </ol>
    </section>"""


def section_projects(prefix):
    features = []
    for project in FEATURED_PROJECTS:
        features.append(f"""
        <a class="feature" href="{prefix}{project["page"]}">
          <div class="feature__media"><img src="{prefix}{project["image"]}" alt="" loading="lazy"></div>
          <div class="feature__body">
            <h3 class="feature__title">{esc(project["title"])}</h3>
            <p class="feature__text">{esc(project["text"])}</p>
            {chips(project["tags"])}
            <span class="feature__more">Read the write-up</span>
          </div>
        </a>""")

    cards = []
    for title, tags, image, page in PROJECTS:
        cards.append(f"""
        <a class="project" href="{prefix}{page}">
          <div class="project__media"><img src="{prefix}{image}" alt="" loading="lazy"></div>
          <div class="project__body">
            <h3 class="project__title">{esc(title)}</h3>
            {chips(tags)}
          </div>
        </a>""")

    return f"""
    <section class="section container" id="projects">
      <div class="section__head">
        <h2 class="section__title">Projects</h2>
        <p class="section__intro">Hardware I've brought up and shipped. Some work was
        under NDA, so a few write-ups describe the system without schematics.</p>
      </div>
      <div class="feature-list">{"".join(features)}
      </div>
      <div class="project-grid">{"".join(cards)}
      </div>
    </section>"""


def section_skills(heading_tag="h2"):
    groups = "".join(f"""
        <div class="skill-group">
          <h3 class="skill-group__title">{esc(name)}</h3>
          {chips(items)}
        </div>""" for name, items in SKILL_GROUPS)
    return f"""
    <section class="section container" id="skills">
      <div class="section__head">
        <{heading_tag} class="section__title">Skills</{heading_tag}>
      </div>
      <div class="skill-groups">{groups}
      </div>
    </section>"""


def section_education(prefix, heading_tag="h2"):
    items = []
    for entry in EDUCATION:
        if entry["logo"]:
            logo = f'<img class="edu-item__logo" src="{prefix}{entry["logo"]}" alt="" loading="lazy">'
        else:
            logo = f'<span class="edu-item__logo edu-item__logo--text" aria-hidden="true">{esc(entry["logo_text"])}</span>'
        title = esc(entry["title"])
        if entry["page"]:
            title = f'<a href="{prefix}{entry["page"]}">{title}</a>'
        items.append(f"""
        <li class="edu-item">
          {logo}
          <div>
            <h3 class="edu-item__title">{title}</h3>
            <p class="edu-item__place">{esc(entry["place"])}</p>
          </div>
          <span class="edu-item__date">{esc(entry["date"])}</span>
        </li>""")

    courses = "".join(f"""
        <li><a href="{prefix}{page}"><img src="{prefix}{image}" alt="" loading="lazy">{esc(name)}</a></li>"""
                      for name, image, page in COURSES)

    return f"""
    <section class="section container" id="education">
      <div class="section__head">
        <{heading_tag} class="section__title">Education</{heading_tag}>
      </div>
      <ul class="edu-list">{"".join(items)}
      </ul>
      <h3 class="subhead">Self-study courses</h3>
      <ul class="course-list">{courses}
      </ul>
    </section>"""


def section_contact(prefix, heading_tag="h2"):
    return f"""
    <section class="section container" id="contact">
      <div class="contact">
        <div>
          <img class="contact__photo" src="{prefix}assets/profile.jpg" alt="Obaid Tanveer" loading="lazy">
          <{heading_tag} class="contact__big">Building something with a microcontroller in it?</{heading_tag}>
          <a class="contact__email" href="mailto:{EMAIL}">{EMAIL}</a>
          <div class="contact__links">
            <a class="btn btn--ghost" href="{LINKEDIN_URL}" target="_blank" rel="noopener">{icon("linkedin")} LinkedIn</a>
            <a class="btn btn--ghost" href="{GITHUB_URL}" target="_blank" rel="noopener">{icon("github")} GitHub</a>
          </div>
        </div>
        <form class="form" id="contact-form">
          <label>Your email
            <input type="email" id="contact-email" placeholder="you@company.com" required>
          </label>
          <label>Organisation
            <input type="text" id="contact-org" placeholder="Company or school">
          </label>
          <label>Message
            <textarea id="contact-message" placeholder="Hi Obaid," required></textarea>
          </label>
          <button class="btn" type="submit">Open in my email app</button>
          <p class="form__note">This opens your own email app with the message filled in.</p>
        </form>
      </div>
    </section>
  <script>
    document.getElementById("contact-form").addEventListener("submit", (event) => {{
      event.preventDefault();
      const sender = document.getElementById("contact-email").value;
      const organisation = document.getElementById("contact-org").value;
      const message = document.getElementById("contact-message").value;
      const body = `From: ${{sender}}\\nOrganisation: ${{organisation}}\\n\\n${{message}}`;
      window.location.href = `mailto:{EMAIL}?subject=${{encodeURIComponent("Portfolio message")}}`
        + `&body=${{encodeURIComponent(body)}}`;
    }});
  </script>"""


HERO = """
    <section class="container hero">
      <div>
        <p class="hero__status">M.Sc. student in Besançon, open to embedded internships</p>
        <h1 class="hero__name">Obaid Tanveer</h1>
        <p class="hero__lede">Embedded firmware engineer. I write the C that runs
        <strong>EV chargers, battery packs and robot arms</strong>, on STM32, ESP32 and RP2040.</p>
        <div class="hero__actions">
          <a class="btn" href="#projects">See projects</a>
          <a class="btn btn--ghost" href="#contact">Get in touch</a>
        </div>
      </div>
      <div class="terminal" role="region" aria-label="Interactive terminal">
        <div class="terminal__bar">
          <span class="terminal__dots" aria-hidden="true"><span></span><span></span><span></span></span>
          ttyACM0 · 115200 baud
        </div>
        <div class="terminal__body" data-terminal aria-live="polite"></div>
        <div class="terminal__chips">
          <button type="button" data-terminal-command="whoami">whoami</button>
          <button type="button" data-terminal-command="ls projects">ls projects</button>
          <button type="button" data-terminal-command="contact">contact</button>
          <button type="button" data-terminal-command="help">help</button>
        </div>
      </div>
    </section>
    <div class="scope" aria-hidden="true">
      <canvas data-scope></canvas>
      <div class="scope__legend"><span class="ch1">CH1 CAN_H</span><span class="ch2">CH2 ref</span></div>
    </div>"""


# --------------------------------------------------------------------------
# Page writers
# --------------------------------------------------------------------------

def write_index():
    page = f"""{head("", f"{SITE_NAME}, embedded firmware engineer")}
</head>
<body>
  {nav("")}
  <main>{HERO}
    {section_experience("")}
    {section_projects("")}
    {section_skills()}
    {section_education("")}
    {section_contact("")}
  </main>
  {footer("")}
</body>
</html>
"""
    (REPO_ROOT / "index.html").write_text(page, encoding="utf-8")


def write_section_pages():
    """Standalone versions of each section, kept so old links keep working."""
    prefix = "../"
    pages = {
        "experience.html": ("Experience", "experience", section_experience(prefix, "h1")),
        "education.html": ("Education", "education", section_education(prefix, "h1")),
        "skills.html": ("Skills", "skills", section_skills("h1")),
        "contact.html": ("Contact", "contact", section_contact(prefix, "h1")),
    }
    for filename, (title, active, body) in pages.items():
        page = f"""{head(prefix, f"{title}, {SITE_NAME}")}
</head>
<body>
  {nav(prefix, active)}
  <main>{body}
  </main>
  {footer(prefix)}
</body>
</html>
"""
        (TEMPLATES_DIR / filename).write_text(page, encoding="utf-8")


DETAIL_SECTION = {
    "projects": ("projects", "All projects"),
    "experience": ("experience", "All experience"),
    "education": ("education", "All education"),
}

NAV_BLOCK = re.compile(r"\s*(<div class=\"bg\"[^>]*>\s*</div>\s*)?<nav\b.*?</nav>", re.S)
SITE_NAV_BLOCK = re.compile(r"\s*(<div class=\"bg\"[^>]*>\s*</div>\s*)?<header class=\"site-nav\">.*?</header>", re.S)
COMMENTS = re.compile(r"\s*<!--.*?-->", re.S)
INLINE_ACCENT = re.compile(r'\s*style="color:\s*var\(--clr-accent\);?"')

# Corrections to the old detail-page text (Powersoft is no longer current).
TEXT_FIXES = {
    "experience-powersoft.html": [
        ("Nov 2024 - Present", "Nov 2024 - Aug 2025"),
        ("At Powersoft, I’m contributing to", "At Powersoft, I contributed to"),
    ],
}


def reskin_detail_page(path):
    section_dir = path.parent.name
    active, back_label = DETAIL_SECTION[section_dir]
    prefix = "../../"
    source = path.read_text(encoding="utf-8")

    title_match = re.search(r"<title>(.*?)</title>", source, re.S)
    title = html.unescape(title_match.group(1).strip()) if title_match else SITE_NAME
    title = title.replace(" · ", ", ")

    body_match = re.search(r"<body[^>]*>(.*)</body>", source, re.S)
    body = body_match.group(1)
    body = COMMENTS.sub("", body)
    body = NAV_BLOCK.sub("", body)
    body = SITE_NAV_BLOCK.sub("", body)
    body = INLINE_ACCENT.sub("", body)
    body = re.sub(r"\s*<footer\b.*?</footer>", "", body, flags=re.S)
    body = re.sub(r"\s*<script\b.*?</script>", "", body, flags=re.S)
    body = re.sub(r'\s*<a class="page-back".*?</a>', "", body, flags=re.S)
    body = body.replace('class="project-page container glass"', 'class="project-page"')
    body = re.sub(r"</?main\b[^>]*>", "", body)
    for old_text, new_text in TEXT_FIXES.get(path.name, []):
        body = body.replace(old_text, new_text)

    back_link = (f'<a class="page-back" href="{prefix}index.html#{active}">'
                 f'← {back_label}</a>')

    page = f"""{head(prefix, title)}
</head>
<body>
  {nav(prefix, active)}
  <main class="container">
    {back_link}
    {body.strip()}
  </main>
  {footer(prefix)}
</body>
</html>
"""
    path.write_text(page, encoding="utf-8")


def main():
    write_index()
    write_section_pages()
    for section_dir in DETAIL_SECTION:
        for path in sorted((TEMPLATES_DIR / section_dir).glob("*.html")):
            reskin_detail_page(path)


if __name__ == "__main__":
    main()
