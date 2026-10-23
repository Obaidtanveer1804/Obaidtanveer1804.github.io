/* =====================================================================
   Obaid Tanveer — terminal portfolio
   Content comes from assets/js/portfolio-data.js (window.PORTFOLIO),
   generated from tools/content.py so the terminal and website agree.
   ===================================================================== */
(() => {
  "use strict";

  const DATA = window.PORTFOLIO;
  const HOME_PATH = "/home/obaid";
  const HOST = "stm32h7";
  const USER = "obaid";
  const IS_TOUCH = window.matchMedia("(pointer: coarse)").matches;
  const PREFERS_REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const outputEl = document.querySelector("[data-output]");
  const scrollEl = document.querySelector("[data-scroll]");
  const formEl = document.querySelector("[data-prompt-form]");
  const inputEl = document.querySelector("[data-input]");
  const ps1El = document.querySelector("[data-ps1]");

  const state = {
    cwd: HOME_PATH,
    history: [],
    historyIndex: 0,
    isBusy: false,
    abortRequested: false,
    bootTime: Date.now(),
  };

  const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  /* ===================================================================
     Board: LEDs, buttons, readout
     =================================================================== */
  const board = (() => {
    const ledElements = {};
    document.querySelectorAll("[data-led]").forEach((element) => {
      ledElements[element.dataset.led] = element;
    });

    const userLedIds = ["1", "2", "3"];
    let txTimer = 0;

    function setLed(ledId, isOn) {
      const led = ledElements[ledId];
      if (led) {
        led.classList.toggle("is-on", isOn);
      }
    }

    function isLedOn(ledId) {
      return Boolean(ledElements[ledId] && ledElements[ledId].classList.contains("is-on"));
    }

    function toggleLed(ledId) {
      setLed(ledId, !isLedOn(ledId));
    }

    async function blink(ledId, times, periodMs) {
      for (let count = 0; count < times && !state.abortRequested; count += 1) {
        setLed(ledId, true);
        await sleep(periodMs / 2);
        setLed(ledId, false);
        await sleep(periodMs / 2);
      }
    }

    /* UART activity: TX flickers whenever the terminal prints. */
    function pulseTx() {
      setLed("tx", true);
      window.clearTimeout(txTimer);
      txTimer = window.setTimeout(() => setLed("tx", false), 60);
    }

    function pulseRx() {
      setLed("rx", true);
      window.setTimeout(() => setLed("rx", false), 90);
    }

    function pressButton(buttonName) {
      const button = document.querySelector(`[data-button="${buttonName}"]`);
      if (!button) {
        return;
      }
      button.classList.add("is-pressed");
      window.setTimeout(() => button.classList.remove("is-pressed"), 160);
    }

    function drawPinsAndLegs() {
      const svgNs = "http://www.w3.org/2000/svg";
      const pinGroup = document.querySelector("[data-pins]");
      for (let row = 0; row < 11; row += 1) {
        [36, 278].forEach((x) => {
          const pin = document.createElementNS(svgNs, "rect");
          pin.setAttribute("x", String(x));
          pin.setAttribute("y", String(45 + row * 12));
          pin.setAttribute("width", "6");
          pin.setAttribute("height", "6");
          pinGroup.appendChild(pin);
        });
      }

      const legGroup = document.querySelector("[data-mcu-legs]");
      for (let index = 0; index < 9; index += 1) {
        const offset = 88 + index * 7;
        const legs = [
          [128 + index * 8, 77, 3, 6],
          [128 + index * 8, 151, 3, 6],
          [117, offset, 6, 3],
          [197, offset, 6, 3],
        ];
        legs.forEach(([x, y, width, height]) => {
          const leg = document.createElementNS(svgNs, "rect");
          leg.setAttribute("x", String(x));
          leg.setAttribute("y", String(y));
          leg.setAttribute("width", String(width));
          leg.setAttribute("height", String(height));
          legGroup.appendChild(leg);
        });
      }
    }

    function startReadout() {
      const readout = document.querySelector("[data-readout]");
      if (!readout) {
        return;
      }
      const update = () => {
        const temperature = 33.6 + Math.sin(Date.now() / 9000) * 0.8 + Math.random() * 0.2;
        readout.textContent =
          `SYSCLK 480 MHz · VDD 3.30 V · ${temperature.toFixed(1)} °C · up ${formatUptime()}`;
      };
      update();
      window.setInterval(update, 1000);
    }

    drawPinsAndLegs();
    startReadout();

    return { userLedIds, setLed, isLedOn, toggleLed, blink, pulseTx, pulseRx, pressButton };
  })();

  /* ===================================================================
     Output helpers
     A line is built from segments: a string, or
     { text, cls, run } (clickable command) or { text, cls, href }.
     =================================================================== */
  function segmentNode(segment) {
    if (typeof segment === "string") {
      return document.createTextNode(segment);
    }
    if (segment.run) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `t-link ${segment.cls || ""}`.trim();
      button.textContent = segment.text;
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        submitCommand(segment.run);
      });
      return button;
    }
    if (segment.href) {
      const link = document.createElement("a");
      link.className = `t-link ${segment.cls || ""}`.trim();
      link.href = segment.href;
      link.textContent = segment.text;
      if (/^https?:/.test(segment.href)) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      return link;
    }
    const span = document.createElement("span");
    span.className = segment.cls || "";
    span.textContent = segment.text;
    return span;
  }

  function print(...segments) {
    const line = document.createElement("div");
    line.className = "line";
    segments.forEach((segment) => line.appendChild(segmentNode(segment)));
    outputEl.appendChild(line);
    scrollEl.scrollTop = scrollEl.scrollHeight;
    board.pulseTx();
    return line;
  }

  function printLines(lines) {
    lines.forEach((segments) => print(...[].concat(segments)));
  }

  const dim = (text) => ({ text, cls: "c-dim" });
  const lime = (text) => ({ text, cls: "c-lime" });
  const orange = (text) => ({ text, cls: "c-orange" });
  const cyan = (text) => ({ text, cls: "c-cyan" });
  const red = (text) => ({ text, cls: "c-red" });
  const run = (text, command, cls) => ({ text, run: command || text, cls });

  function wrap(text, width) {
    const words = text.split(/\s+/);
    const lines = [];
    let current = "";
    words.forEach((word) => {
      if ((current + " " + word).trim().length > width) {
        lines.push(current);
        current = word;
      } else {
        current = (current + " " + word).trim();
      }
    });
    if (current) {
      lines.push(current);
    }
    return lines;
  }

  function wrapWidth() {
    const charWidth = 8.4;
    return Math.max(34, Math.min(96, Math.floor(scrollEl.clientWidth / charWidth) - 2));
  }

  function pad(text, width) {
    return text.length >= width ? `${text} ` : text + " ".repeat(width - text.length);
  }

  function formatUptime() {
    const totalSeconds = Math.floor((Date.now() - state.bootTime) / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }

  /* Minimal C syntax colouring for main.c and skills.h */
  const C_KEYWORDS = new Set([
    "int", "void", "const", "char", "static", "while", "return", "struct", "typedef",
    "unsigned", "uint8_t", "uint32_t", "bool", "true", "false", "if", "for",
  ]);

  function highlightC(sourceLine) {
    if (/^\s*(\/\/|\/\*|\*)/.test(sourceLine)) {
      return [dim(sourceLine)];
    }
    if (/^\s*#/.test(sourceLine)) {
      return [orange(sourceLine)];
    }
    const segments = [];
    const tokenPattern = /("[^"]*")|(\b[A-Za-z_][A-Za-z0-9_]*\b)|([^"A-Za-z_]+)/g;
    let match;
    while ((match = tokenPattern.exec(sourceLine)) !== null) {
      const [token, stringToken, wordToken] = match;
      if (stringToken) {
        segments.push(lime(token));
      } else if (wordToken && C_KEYWORDS.has(wordToken)) {
        segments.push(orange(token));
      } else if (wordToken && /^[A-Z][A-Z0-9_]+$/.test(wordToken)) {
        segments.push(cyan(token));
      } else {
        segments.push(token);
      }
    }
    return segments;
  }

  /* ===================================================================
     File system, built from the portfolio data
     =================================================================== */
  function createDir(children = {}) {
    return { type: "dir", children };
  }

  function createFile(render, extra = {}) {
    return { type: "file", render, ...extra };
  }

  function aboutText() {
    const width = Math.min(wrapWidth(), 76);
    return [
      [lime(DATA.name), dim(`  ·  ${DATA.title}`)],
      [dim(DATA.location)],
      [""],
      ...wrap(DATA.bio, width).map((text) => [text]),
      [""],
      [dim("Next: "), run("printf(experience);"), dim("  ·  "), run("ls projects/")],
    ];
  }

  function mainSource() {
    const studying = DATA.education[0];
    return [
      "/* main.c: the short version of me */",
      '#include "obaid.h"',
      "",
      "int main(void)",
      "{",
      "    hal_init();",
      "    clock_config(SYSCLK_480_MHZ);",
      "",
      "    const engineer_t me = {",
      `        .name        = "${DATA.name}",`,
      `        .role        = "${DATA.title}",`,
      `        .based_in    = "${DATA.location}",`,
      "        .experience  = YEARS(3),",
      `        .studying    = "${studying.title}",`,
      '        .looking_for = "embedded internship / apprenticeship",',
      "    };",
      "",
      "    while (true) {",
      "        write_firmware(&me);",
      "        probe_with_scope(&me);",
      "        ship(&me);",
      "    }",
      "}",
    ];
  }

  function skillsHeader() {
    const lines = ["#ifndef SKILLS_H", "#define SKILLS_H", ""];
    Object.entries(DATA.skills).forEach(([groupName, items]) => {
      lines.push(`static const char *const skills_${groupName}[] = {`);
      const quoted = items.map((item) => `"${item}"`);
      let current = "   ";
      quoted.forEach((item, index) => {
        const piece = ` ${item}${index < quoted.length - 1 ? "," : ""}`;
        if (current.length + piece.length > 64) {
          lines.push(current);
          current = "   ";
        }
        current += piece;
      });
      lines.push(current, "};", "");
    });
    lines.push("#endif /* SKILLS_H */");
    return lines;
  }

  function contactText() {
    return [
      [pad("email", 10), { text: DATA.email, href: `mailto:${DATA.email}`, cls: "c-lime" }],
      [pad("github", 10), { text: DATA.github.replace("https://", ""), href: DATA.github, cls: "c-lime" }],
      [pad("linkedin", 10), { text: "linkedin.com/in/obaid-tanveer", href: DATA.linkedin, cls: "c-lime" }],
      [pad("location", 10), DATA.location],
    ];
  }

  function projectReadme(project) {
    const width = Math.min(wrapWidth(), 80);
    return [
      [lime(`# ${project.title}`)],
      [dim(project.subtitle)],
      [project.tags.map((tag) => `[${tag}]`).join(" ")],
      [""],
      ...wrap(project.about, width).map((text) => [text]),
      [""],
      [dim("full write-up: "), run(`open ${project.slug}`)],
    ];
  }

  function experienceLog(job) {
    const width = Math.min(wrapWidth(), 80);
    const lines = [
      [orange(job.org), dim(`  ${job.date}`)],
      [lime(job.role)],
      [""],
      ...wrap(job.summary, width).map((text) => [text]),
    ];
    if (job.points.length > 0) {
      lines.push([""]);
      job.points.forEach((point) => {
        wrap(point, width - 4).forEach((text, index) => {
          lines.push([index === 0 ? dim("  - ") : "    ", text]);
        });
      });
    }
    lines.push([""], [dim("details: "), run(`open ${job.slug}`)]);
    return lines;
  }

  function educationText(item) {
    const lines = [[lime(item.title)], [dim(item.place)]];
    if (item.date) {
      lines.push([dim(item.date)]);
    }
    if (item.summary) {
      lines.push([""], ...wrap(item.summary, Math.min(wrapWidth(), 80)).map((text) => [text]));
    }
    return lines;
  }

  function buildFileSystem() {
    const projects = {};
    DATA.projects.forEach((project) => {
      projects[project.slug] = createDir({
        "README.md": createFile(() => projectReadme(project), { page: project.page }),
      });
      projects[project.slug].page = project.page;
    });

    const experience = {};
    DATA.experience.forEach((job) => {
      experience[`${job.slug}.log`] = createFile(() => experienceLog(job), { page: job.page });
    });

    const education = {};
    DATA.education.forEach((item) => {
      education[`${item.slug}.txt`] = createFile(() => educationText(item), { page: item.page });
    });
    education["courses.txt"] = createFile(() =>
      DATA.courses.map((course) => [dim("  - "), { text: course.title, href: course.page }]));

    return createDir({
      home: createDir({
        obaid: createDir({
          "about.txt": createFile(aboutText),
          "main.c": createFile(() => mainSource().map(highlightC)),
          "skills.h": createFile(() => skillsHeader().map(highlightC)),
          "contact.txt": createFile(contactText),
          projects: createDir(projects),
          experience: createDir(experience),
          education: createDir(education),
        }),
      }),
    });
  }

  const fileSystem = buildFileSystem();

  function normalizePath(pathText) {
    let raw = (pathText || "").trim();
    if (raw === "" || raw === "~") {
      return HOME_PATH;
    }
    if (raw.startsWith("~/")) {
      raw = HOME_PATH + raw.slice(1);
    }
    const base = raw.startsWith("/") ? [] : state.cwd.split("/").filter(Boolean);
    raw.split("/").filter(Boolean).forEach((part) => {
      if (part === "..") {
        base.pop();
      } else if (part !== ".") {
        base.push(part);
      }
    });
    return "/" + base.join("/");
  }

  function getNode(absolutePath) {
    let node = fileSystem;
    for (const part of absolutePath.split("/").filter(Boolean)) {
      if (!node || node.type !== "dir" || !node.children[part]) {
        return null;
      }
      node = node.children[part];
    }
    return node;
  }

  function displayPath(absolutePath) {
    if (absolutePath === HOME_PATH) {
      return "~";
    }
    return absolutePath.startsWith(`${HOME_PATH}/`)
      ? `~${absolutePath.slice(HOME_PATH.length)}`
      : absolutePath;
  }

  function relativeFromCwd(absolutePath) {
    if (absolutePath.startsWith(`${state.cwd}/`)) {
      return absolutePath.slice(state.cwd.length + 1);
    }
    return displayPath(absolutePath);
  }

  function updatePrompt() {
    ps1El.textContent = `${USER}@${HOST}:${displayPath(state.cwd)}$`;
  }

  /* ===================================================================
     Commands
     =================================================================== */
  function findBySlug(slug) {
    const cleanSlug = (slug || "").replace(/\/$/, "").split("/").pop().replace(/\.(log|txt|md)$/, "");
    return DATA.projects.find((item) => item.slug === cleanSlug)
      || DATA.experience.find((item) => item.slug === cleanSlug)
      || DATA.education.find((item) => item.slug === cleanSlug)
      || DATA.courses.find((item) => item.slug === cleanSlug);
  }

  function listDirectory(absolutePath) {
    const node = getNode(absolutePath);
    const entries = Object.entries(node.children);
    const segments = [];
    entries.forEach(([name, child], index) => {
      const childPath = `${absolutePath}/${name}`;
      const target = relativeFromCwd(childPath);
      if (child.type === "dir") {
        segments.push(run(`${name}/`, `ls ${target}`, "c-orange"));
      } else {
        segments.push(run(name, `cat ${target}`));
      }
      if (index < entries.length - 1) {
        segments.push("   ");
      }
    });
    print(...segments);
  }

  /* Phones get one column; wider screens get a date column on the left. */
  function isNarrow() {
    return wrapWidth() < 60;
  }

  function printExperience() {
    const width = Math.min(wrapWidth(), 84);
    print(dim("// printf(experience);  click a company for the full log"));
    print("");
    DATA.experience.forEach((job) => {
      const orgLink = run(job.org, `cat ~/experience/${job.slug}.log`, "c-orange");
      if (isNarrow()) {
        print(orgLink, dim(`  ${job.date}`));
        print(lime(job.role));
      } else {
        print(dim(pad(job.date, 22)), orgLink);
        print(pad("", 22), lime(job.role));
        wrap(job.summary, width - 22).forEach((text) => print(pad("", 22), dim(text)));
      }
      print("");
    });
  }

  function printProjects() {
    print(dim("// printf(projects);  click one to read its README"));
    print("");
    DATA.projects.forEach((project) => {
      const readme = `cat ~/projects/${project.slug}/README.md`;
      if (isNarrow()) {
        print(run(project.title, readme, "c-orange"), dim(`  ${project.subtitle}`));
      } else {
        print(run(pad(project.slug, 22), readme, "c-orange"), project.title, dim(`  ${project.subtitle}`));
      }
    });
  }

  function printSkills() {
    const labels = {
      languages: "Languages", mcus: "MCUs & boards", rtos_os: "RTOS & OS",
      protocols: "Protocols", domains: "Domains", tools: "Tools",
    };
    print(dim("// printf(skills);"));
    print("");
    Object.entries(DATA.skills).forEach(([group, items]) => {
      const label = labels[group] || group;
      if (isNarrow()) {
        print(orange(label));
        wrap(items.join(", "), wrapWidth()).forEach((text) => print(text));
        print("");
        return;
      }
      const lines = wrap(items.join(", "), Math.min(wrapWidth(), 90) - 16);
      lines.forEach((text, index) => print(index === 0 ? orange(pad(label, 16)) : pad("", 16), text));
    });
  }

  function printEducation() {
    print(dim("// printf(education);"));
    print("");
    DATA.education.forEach((item) => {
      const titleLink = run(item.title, `cat ~/education/${item.slug}.txt`, "c-orange");
      if (isNarrow()) {
        print(titleLink, dim(item.date ? `  ${item.date}` : ""));
        print(dim(item.place));
      } else {
        print(dim(pad(item.date || "", 16)), titleLink);
        print(pad("", 16), dim(item.place));
      }
    });
    print("");
    print(dim("courses: "), run("cat ~/education/courses.txt"));
  }

  const PRINT_TARGETS = {
    experience: printExperience,
    projects: printProjects,
    skills: printSkills,
    education: printEducation,
    contact: () => printLines(contactText()),
    about: () => printLines(aboutText()),
    me: () => printLines(aboutText()),
  };

  async function bootSequence({ showBanner }) {
    const steps = [
      [dim("[BOOT] "), "obaid-fw bootloader v3.1 (STM32H747, Cortex-M7 @ 480 MHz)"],
      [lime("[ OK ] "), "flash 2048 KB  ram 1024 KB  crc32 0x5EED0B1D"],
      [lime("[ OK ] "), "clock tree: HSE 25 MHz -> PLL1 480 MHz"],
      [lime("[ OK ] "), "usart3 up at 115200 8N1"],
      [lime("[ OK ] "), "mounted ~/projects ~/experience ~/education"],
      [lime("[ OK ] "), "gpio: LD1 LD2 LD3 ready"],
    ];
    const delayMs = PREFERS_REDUCED_MOTION ? 0 : 110;
    for (const step of steps) {
      print(...step);
      if (delayMs) {
        await sleep(delayMs);
      }
    }
    if (!PREFERS_REDUCED_MOTION) {
      await board.blink("1", 2, 140);
    }
    if (showBanner) {
      printBanner();
    }
  }

  function printBanner() {
    const letters = {
      O: [" ██████╗ ", "██╔═══██╗", "██║   ██║", "██║   ██║", "╚██████╔╝", " ╚═════╝ "],
      B: ["██████╗ ", "██╔══██╗", "██████╔╝", "██╔══██╗", "██████╔╝", "╚═════╝ "],
      A: [" █████╗ ", "██╔══██╗", "███████║", "██╔══██║", "██║  ██║", "╚═╝  ╚═╝"],
      I: ["██╗", "██║", "██║", "██║", "██║", "╚═╝"],
      D: ["██████╗ ", "██╔══██╗", "██║  ██║", "██║  ██║", "██████╔╝", "╚═════╝ "],
    };
    const rows = [0, 1, 2, 3, 4, 5].map((row) =>
      "OBAID".split("").map((letter) => letters[letter][row]).join(""));

    const banner = document.createElement("div");
    banner.className = "banner";
    banner.setAttribute("aria-label", DATA.name);
    banner.textContent = rows.join("\n");
    outputEl.appendChild(banner);

    print({ text: `${DATA.name.toUpperCase()}  ·  ${DATA.title}`, cls: "c-orange c-bold" });
    print(dim(`M.Sc. Electronics (ELISE) student in ${DATA.location}. Open to embedded internships.`));
    print("");
    print("Type ", lime("help"), " for all commands, or try ", run("printf(experience);"),
      ", ", run("ls projects/"), ", ", run("blink led"), ".");
    print(dim("Prefer clicking? "), { text: "Open the website", href: DATA.sitePage, cls: "c-lime" },
      dim("  ·  everything underlined here is clickable."));
    print("");
  }

  const COMMANDS = {
    help: {
      summary: "list commands, or help <command>",
      run: (args) => {
        if (args[0] && COMMANDS[args[0]]) {
          print(lime(args[0]), dim(`  ${COMMANDS[args[0]].summary}`));
          return;
        }
        const groups = [
          ["Explore", ["ls", "cd", "pwd", "cat", "tree", "open"]],
          ["About me", ["printf", "whoami", "experience", "projects", "skills", "education", "contact"]],
          ["Hardware", ["blink", "led", "make", "candump", "i2cdetect", "reset"]],
          ["System", ["neofetch", "uname", "uptime", "dmesg", "date", "echo", "history", "clear", "gui"]],
        ];
        groups.forEach(([title, names]) => {
          print(orange(title));
          names.forEach((name) => print("  ", run(pad(name, 12), name === "printf" ? "printf(experience);" : name, "c-lime"),
            dim(COMMANDS[name].summary)));
          print("");
        });
        print(dim("Tab completes commands and paths. Up/Down recalls history. Ctrl+C stops, Ctrl+L clears."));
      },
    },
    ls: {
      summary: "list a directory",
      run: (args) => {
        const target = normalizePath(args.find((arg) => !arg.startsWith("-")) || ".");
        const node = getNode(target);
        if (!node) {
          print(red(`ls: cannot access '${args[0]}': No such file or directory`));
        } else if (node.type === "file") {
          print(args[0]);
        } else {
          listDirectory(target);
        }
      },
    },
    cd: {
      summary: "change directory (cd .., cd ~)",
      run: (args) => {
        const target = normalizePath(args[0] || "~");
        const node = getNode(target);
        if (!node) {
          print(red(`cd: ${args[0]}: No such file or directory`));
        } else if (node.type !== "dir") {
          print(red(`cd: ${args[0]}: Not a directory`));
        } else {
          state.cwd = target;
          updatePrompt();
        }
      },
    },
    pwd: { summary: "print working directory", run: () => print(state.cwd) },
    cat: {
      summary: "print a file",
      run: (args) => {
        if (!args[0]) {
          print(red("cat: missing file operand"), dim("  try: cat about.txt"));
          return;
        }
        const target = normalizePath(args[0]);
        const node = getNode(target);
        if (!node) {
          print(red(`cat: ${args[0]}: No such file or directory`));
        } else if (node.type === "dir") {
          const readme = node.children["README.md"];
          if (readme) {
            printLines(readme.render());
          } else {
            print(red(`cat: ${args[0]}: Is a directory`), dim("  try: "), run(`ls ${args[0]}`));
          }
        } else {
          printLines(node.render());
        }
      },
    },
    tree: {
      summary: "show the directory tree",
      run: (args) => {
        const root = normalizePath(args[0] || ".");
        const rootNode = getNode(root);
        if (!rootNode || rootNode.type !== "dir") {
          print(red(`tree: ${args[0] || "."}: not a directory`));
          return;
        }
        print(orange(displayPath(root)));
        const walk = (node, absolutePath, prefix) => {
          const entries = Object.entries(node.children);
          entries.forEach(([name, child], index) => {
            const isLast = index === entries.length - 1;
            const childPath = `${absolutePath}/${name}`;
            const target = relativeFromCwd(childPath);
            const label = child.type === "dir"
              ? run(`${name}/`, `ls ${target}`, "c-orange")
              : run(name, `cat ${target}`);
            print(dim(prefix + (isLast ? "└── " : "├── ")), label);
            if (child.type === "dir") {
              walk(child, childPath, prefix + (isLast ? "    " : "│   "));
            }
          });
        };
        walk(rootNode, root, "");
      },
    },
    open: {
      summary: "open a project or role page (open bms)",
      run: (args) => {
        const target = args[0] ? normalizePath(args[0]) : "";
        const node = target ? getNode(target) : null;
        const page = (node && node.page) || (findBySlug(args[0]) || {}).page;
        if (!page) {
          print(red(`open: nothing to open for '${args[0] || ""}'`), dim("  try: "), run("open bms"));
          return;
        }
        print(dim("opening "), lime(page), dim(" in a new tab"));
        window.open(page, "_blank", "noopener");
      },
    },
    printf: {
      summary: "printf(experience); also projects, skills, education, contact",
      run: (_args, rawLine) => {
        const match = rawLine.match(/^printf\s*\(?\s*(.*?)\s*\)?\s*;?\s*$/);
        const argument = match ? match[1] : "";
        const quoted = argument.match(/^"(.*)"$/);
        if (quoted) {
          quoted[1].split("\\n").forEach((text) => print(text));
          return;
        }
        const printer = PRINT_TARGETS[argument.toLowerCase()];
        if (printer) {
          printer();
        } else {
          print(red(`error: '${argument || "?"}' undeclared`),
            dim("  try: printf(experience); printf(projects); printf(skills);"));
        }
      },
    },
    whoami: { summary: "who is this?", run: () => printLines(aboutText()) },
    experience: { summary: "same as printf(experience);", run: printExperience },
    projects: { summary: "same as printf(projects);", run: printProjects },
    skills: { summary: "same as printf(skills);", run: printSkills },
    education: { summary: "degrees and courses", run: printEducation },
    contact: { summary: "email, GitHub, LinkedIn", run: () => printLines(contactText()) },
    blink: {
      summary: "blink led [1|2|3] [times]",
      run: async (args) => {
        const numbers = args.filter((arg) => /^\d+$/.test(arg)).map(Number);
        const ledId = numbers[0] >= 1 && numbers[0] <= 3 ? String(numbers[0]) : "2";
        const times = Math.min(numbers[1] || 6, 30);
        print(dim("HAL_GPIO_TogglePin("), cyan(`LD${ledId}_GPIO_Port`), dim(", "), cyan(`LD${ledId}_Pin`),
          dim(`);  x${times * 2}, 250 ms period`));
        await board.blink(ledId, times, 250);
        print(state.abortRequested ? red("^C") : lime("done."), dim(" look at the board on the right"));
      },
    },
    led: {
      summary: "led <on|off|toggle> <1|2|3|all>",
      run: (args) => {
        const action = (args[0] || "").toLowerCase();
        const which = (args[1] || "all").toLowerCase();
        const targets = which === "all" ? board.userLedIds : [which];
        if (!["on", "off", "toggle"].includes(action) || !targets.every((id) => board.userLedIds.includes(id))) {
          print(red("usage: led <on|off|toggle> <1|2|3|all>"));
          return;
        }
        targets.forEach((id) => {
          if (action === "toggle") {
            board.toggleLed(id);
          } else {
            board.setLed(id, action === "on");
          }
          print(dim(`LD${id} -> `), board.isLedOn(id) ? lime("ON") : dim("OFF"));
        });
      },
    },
    make: {
      summary: "make flash: build and flash the firmware",
      run: async (args) => {
        if (args[0] !== "flash") {
          print(dim("make: try "), run("make flash"));
          return;
        }
        const files = ["main.c", "can_bus.c", "bms.c", "ev_charger.c", "motor_ctrl.c", "uart_shell.c"];
        for (const file of files) {
          if (state.abortRequested) {
            return;
          }
          print(dim("arm-none-eabi-gcc -mcpu=cortex-m7 -O2 -c "), file);
          await sleep(90);
        }
        print(dim("arm-none-eabi-size obaid-fw.elf"));
        print(dim("   text    data     bss     dec"));
        print("  48212    1204    8932   58348");
        const progressLine = print({ text: "", cls: "progress" });
        for (let percent = 0; percent <= 100 && !state.abortRequested; percent += 5) {
          const filled = Math.round(percent / 5);
          progressLine.textContent = `flashing [${"#".repeat(filled)}${".".repeat(20 - filled)}] ${percent}%`;
          board.setLed("3", percent % 10 === 0);
          await sleep(55);
        }
        board.setLed("3", false);
        print(lime("verified OK. "), "resetting target...");
        await sleep(200);
        for (const id of board.userLedIds) {
          await board.blink(id, 1, 160);
        }
      },
    },
    candump: {
      summary: "candump can0: watch CAN frames",
      run: async () => {
        const frames = [
          ["0x18F", "8", "0D 48 0F A0 00 64 21 00", "bms: pack 3400 mV x12, soc 100%"],
          ["0x2A0", "4", "01 00 1E 00", "evse: state B, 30 A offered"],
          ["0x18F", "8", "0D 47 0F 9F 00 63 22 00", "bms: soc 99%, 34 °C"],
          ["0x701", "1", "05", "canopen: node 1 operational"],
          ["0x2A0", "4", "02 00 20 00", "evse: state C, charging"],
          ["0x181", "6", "E8 03 00 00 10 27", "joint1 pos 1000, vel 10000"],
          ["0x18F", "8", "0D 45 0F 9E 00 62 22 01", "bms: balancing cell 1"],
        ];
        print(dim("interface  id     dlc  data                       note"));
        for (const [id, dlc, payload, note] of frames) {
          if (state.abortRequested) {
            break;
          }
          board.pulseRx();
          print("  can0     ", cyan(pad(id, 7)), pad(`[${dlc}]`, 5), pad(payload, 27), dim(note));
          await sleep(220);
        }
        print(dim("(simulated bus, numbers in the style of my BMS and charger projects)"));
      },
    },
    i2cdetect: {
      summary: "i2cdetect -y 1: scan the I2C bus",
      run: () => {
        const found = { 0x36: "AS5600 encoder", 0x3c: "SSD1306 OLED", 0x68: "MPU-6050 IMU" };
        print(dim("     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f"));
        for (let row = 0; row < 8; row += 1) {
          const segments = [dim(`${(row * 16).toString(16).padStart(2, "0")}: `)];
          for (let col = 0; col < 16; col += 1) {
            const address = row * 16 + col;
            if (address < 3 || address > 0x77) {
              segments.push("   ");
            } else if (found[address]) {
              segments.push(lime(address.toString(16).padStart(2, "0")), " ");
            } else {
              segments.push(dim("-- "));
            }
          }
          print(...segments);
        }
        Object.entries(found).forEach(([address, name]) =>
          print(lime(`0x${Number(address).toString(16)}`), dim(`  ${name}`)));
      },
    },
    reset: {
      summary: "reboot the board",
      run: async () => {
        board.pressButton("reset");
        board.userLedIds.forEach((id) => board.setLed(id, false));
        outputEl.textContent = "";
        state.cwd = HOME_PATH;
        updatePrompt();
        await bootSequence({ showBanner: true });
      },
    },
    neofetch: {
      summary: "system info",
      run: () => {
        const chip = [
          "   ┌┬┬┬┬┬┬┐  ",
          "  ┌┴┴┴┴┴┴┴┴┐ ",
          " ─┤ STM32  ├─",
          " ─┤  H747  ├─",
          " ─┤ OBAIDFW├─",
          "  └┬┬┬┬┬┬┬┬┘ ",
          "   └┴┴┴┴┴┴┘  ",
        ];
        const info = [
          [lime(`${USER}@${HOST}`)],
          [dim("-------------")],
          [orange("OS       "), "obaid-fw 3.1 (bare metal + FreeRTOS)"],
          [orange("Host     "), DATA.name],
          [orange("Role     "), DATA.title],
          [orange("Location "), DATA.location],
          [orange("Uptime   "), formatUptime()],
          [orange("Shell    "), "uart-sh 115200 8N1"],
          [orange("Contact  "), { text: DATA.email, href: `mailto:${DATA.email}`, cls: "c-lime" }],
        ];
        const rows = Math.max(chip.length, info.length);
        for (let index = 0; index < rows; index += 1) {
          print(lime(pad(chip[index] || "", 16)), ...(info[index] || [""]));
        }
      },
    },
    uname: { summary: "uname -a", run: () => print("obaid-fw 3.1.0 stm32h747 cortex-m7 armv7e-m FreeRTOS-10.6") },
    uptime: { summary: "time since boot", run: () => print(`up ${formatUptime()}, 1 user, load average: 0.04 0.02 0.00`) },
    dmesg: { summary: "replay the boot log", run: () => bootSequence({ showBanner: false }) },
    date: {
      summary: "date in Besançon",
      run: () => print(new Date().toLocaleString("en-GB", { timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "medium" }), dim(" (Besançon)")),
    },
    echo: { summary: "print text", run: (_args, rawLine) => print(rawLine.replace(/^echo\s*/, "")) },
    history: {
      summary: "previous commands",
      run: () => state.history.forEach((command, index) =>
        print(dim(String(index + 1).padStart(4, " ") + "  "), run(command))),
    },
    clear: { summary: "clear the screen", run: () => { outputEl.textContent = ""; } },
    gui: {
      summary: "switch to the website",
      run: async () => {
        print(dim("switching to the website..."));
        await sleep(250);
        window.location.href = DATA.sitePage;
      },
    },
    sudo: {
      summary: "",
      run: () => print(red("sudo: no MMU, no root. This MCU trusts everyone equally.")),
    },
    exit: { summary: "", run: () => COMMANDS.gui.run() },
  };

  const ALIASES = {
    website: "gui", site: "gui", "?": "help", ll: "ls", dir: "ls", reboot: "reset",
    about: "whoami", fetch: "neofetch", sysinfo: "neofetch", cls: "clear",
  };

  /* ===================================================================
     Running commands
     =================================================================== */
  async function submitCommand(rawInput) {
    const rawLine = rawInput.trim();
    if (state.isBusy) {
      return;
    }

    print(lime(`${USER}@${HOST}:${displayPath(state.cwd)}$`), ` ${rawLine}`);
    board.pulseRx();

    if (rawLine === "") {
      return;
    }

    state.history.push(rawLine);
    state.historyIndex = state.history.length;

    const commandMatch = rawLine.match(/^([A-Za-z0-9_?.-]+)/);
    let name = commandMatch ? commandMatch[1].toLowerCase() : "";
    if (/^printf\b/i.test(rawLine)) {
      name = "printf";
    }
    name = ALIASES[name] || name;
    const args = rawLine.replace(/^\S+\s*/, "").split(/\s+/).filter(Boolean);

    const command = COMMANDS[name];
    if (!command) {
      print(red(`${commandMatch ? commandMatch[1] : rawLine}: command not found.`),
        dim(" Type "), run("help", "help", "c-lime"), dim(" to see what works."));
      return;
    }

    state.isBusy = true;
    state.abortRequested = false;
    formEl.hidden = true;
    try {
      await command.run(args, rawLine);
    } catch (error) {
      print(red(`fault: ${error.message}`));
    } finally {
      state.isBusy = false;
      formEl.hidden = false;
      scrollEl.scrollTop = scrollEl.scrollHeight;
      if (!IS_TOUCH) {
        inputEl.focus({ preventScroll: true });
      }
    }
  }

  /* ---------- Tab completion ---------- */
  function completionCandidates(text) {
    const parts = text.split(/\s+/);
    if (parts.length <= 1) {
      const names = [...Object.keys(COMMANDS), ...Object.keys(ALIASES)]
        .filter((name) => COMMANDS[name] ? COMMANDS[name].summary !== "" : true);
      return { prefix: "", fragment: parts[0], options: names.filter((name) => name.startsWith(parts[0])) };
    }

    const fragment = parts[parts.length - 1];
    const prefix = text.slice(0, text.length - fragment.length);
    const slashIndex = fragment.lastIndexOf("/");
    const directoryPart = slashIndex >= 0 ? fragment.slice(0, slashIndex + 1) : "";
    const namePart = slashIndex >= 0 ? fragment.slice(slashIndex + 1) : fragment;
    const directoryNode = getNode(normalizePath(directoryPart || "."));
    const options = [];

    if (directoryNode && directoryNode.type === "dir") {
      Object.entries(directoryNode.children).forEach(([name, child]) => {
        if (name.startsWith(namePart)) {
          options.push(directoryPart + name + (child.type === "dir" ? "/" : ""));
        }
      });
    }
    if (parts[0] === "open" && !directoryPart) {
      [...DATA.projects, ...DATA.experience].forEach((item) => {
        if (item.slug.startsWith(namePart) && !options.includes(item.slug)) {
          options.push(item.slug);
        }
      });
    }
    return { prefix, fragment, options };
  }

  function commonPrefix(words) {
    return words.reduce((shared, word) => {
      let index = 0;
      while (index < shared.length && shared[index] === word[index]) {
        index += 1;
      }
      return shared.slice(0, index);
    });
  }

  function completeInput() {
    const { prefix, fragment, options } = completionCandidates(inputEl.value);
    if (options.length === 0) {
      return;
    }
    if (options.length === 1) {
      const isDirectory = options[0].endsWith("/");
      inputEl.value = prefix + options[0] + (isDirectory ? "" : " ");
      return;
    }
    const shared = commonPrefix(options);
    if (shared.length > fragment.length) {
      inputEl.value = prefix + shared;
    } else {
      print(lime(`${USER}@${HOST}:${displayPath(state.cwd)}$`), ` ${inputEl.value}`);
      print(...options.flatMap((option) => [option.endsWith("/") ? orange(option) : option, "   "]));
    }
  }

  /* ---------- Input events ---------- */
  formEl.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = inputEl.value;
    inputEl.value = "";
    submitCommand(value);
  });

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      completeInput();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (state.historyIndex > 0) {
        state.historyIndex -= 1;
        inputEl.value = state.history[state.historyIndex];
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      if (state.historyIndex < state.history.length - 1) {
        state.historyIndex += 1;
        inputEl.value = state.history[state.historyIndex];
      } else {
        state.historyIndex = state.history.length;
        inputEl.value = "";
      }
    } else if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      outputEl.textContent = "";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "c" && event.ctrlKey && state.isBusy) {
      state.abortRequested = true;
    }
  });

  document.querySelector(".terminal").addEventListener("click", () => {
    if (!window.getSelection().toString() && !state.isBusy) {
      inputEl.focus({ preventScroll: true });
    }
  });

  document.querySelectorAll("[data-run]").forEach((button) => {
    button.addEventListener("click", () => submitCommand(button.dataset.run));
  });

  document.querySelectorAll("[data-button]").forEach((button) => {
    const press = () => {
      if (button.dataset.button === "reset") {
        submitCommand("reset");
        return;
      }
      board.pressButton("user");
      print(dim("EXTI15_10_IRQHandler: "), "USER button pressed", dim(" -> toggling LD1"));
      board.toggleLed("1");
    };
    button.addEventListener("click", press);
    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        press();
      }
    });
  });

  /* ---------- Status bar clock and footer year ---------- */
  const clockEl = document.querySelector("[data-clock]");
  const tickClock = () => {
    clockEl.textContent = new Date().toLocaleTimeString("en-GB", {
      timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", second: "2-digit",
    }) + " Besançon";
  };
  tickClock();
  window.setInterval(tickClock, 1000);
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  /* ---------- Start ---------- */
  updatePrompt();
  formEl.hidden = true;
  state.isBusy = true;
  bootSequence({ showBanner: true }).then(() => {
    state.isBusy = false;
    formEl.hidden = false;
    if (!IS_TOUCH) {
      inputEl.focus({ preventScroll: true });
    }
  });
})();
