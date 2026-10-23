/* =====================================================================
   Obaid Tanveer — portfolio scripts
   Each feature initialises only if its element exists on the page.
   ===================================================================== */
(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year], #year").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Mobile navigation ---------- */
  const nav = document.querySelector(".site-nav");
  const navToggle = document.querySelector(".site-nav__toggle");

  if (nav && navToggle) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll(".site-nav__links a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- "A · B · C" tag lines become chips ---------- */
  document.querySelectorAll(".project-page .tags").forEach((tagLine) => {
    const tagNames = tagLine.textContent
      .split("·")
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (tagNames.length < 2) {
      return;
    }

    const chipList = document.createElement("ul");
    chipList.className = "chips tags";
    tagNames.forEach((tagName) => {
      const chip = document.createElement("li");
      chip.className = "chip";
      chip.textContent = tagName;
      chipList.appendChild(chip);
    });
    tagLine.replaceWith(chipList);
  });

  /* ---------- Timeline: line fills as you scroll ---------- */
  const timeline = document.querySelector(".timeline");

  if (timeline) {
    const progressBar = document.createElement("span");
    progressBar.className = "timeline__progress";
    progressBar.setAttribute("aria-hidden", "true");
    timeline.prepend(progressBar);

    const timelineItems = Array.from(timeline.querySelectorAll(".timeline__item"));
    let isFrameQueued = false;

    const updateTimeline = () => {
      isFrameQueued = false;
      const rect = timeline.getBoundingClientRect();
      const viewportAnchor = window.innerHeight * 0.65;
      const progress = Math.min(Math.max((viewportAnchor - rect.top) / rect.height, 0), 1);
      timeline.style.setProperty("--progress", progress.toFixed(3));

      timelineItems.forEach((item) => {
        const isReached = item.getBoundingClientRect().top < viewportAnchor;
        item.classList.toggle("is-reached", isReached);
      });
    };

    const queueTimelineUpdate = () => {
      if (!isFrameQueued) {
        isFrameQueued = true;
        window.requestAnimationFrame(updateTimeline);
      }
    };

    window.addEventListener("scroll", queueTimelineUpdate, { passive: true });
    window.addEventListener("resize", queueTimelineUpdate);
    updateTimeline();
  }

  /* ---------- Hero terminal: boot log + tiny shell ---------- */
  const terminalBody = document.querySelector("[data-terminal]");

  if (terminalBody) {
    initTerminal(terminalBody);
  }

  function initTerminal(bodyEl) {
    const BOOT_LINES = [
      ["0.000000", "kernel", "Booting obaid-fw (arm-none-eabi, -O2)"],
      ["0.004211", "edu", "B.Sc. Electrical Engineering, PIEAS"],
      ["0.019870", "can0", "Esforge: robotics firmware"],
      ["0.027104", "can0", "Powersoft: EV chargers and BMS"],
      ["0.033912", "eth0", "Motive: embedded QA, AI dashcams"],
      ["0.041377", "usb0", "UMLP Besançon: M.Sc. ELISE (M1)"],
      ["0.048002", "init", "open to embedded internships"],
    ];

    const COMMANDS = {
      help: () => [
        "available commands:",
        "  whoami       short intro",
        "  ls projects  list featured projects",
        "  experience   jump to work history",
        "  skills       jump to skills",
        "  contact      how to reach me",
        "  clear        clear the screen",
      ],
      whoami: () => [
        "Obaid Tanveer: embedded firmware engineer.",
        "~3 years: STM32/ESP32/RP2040 firmware, EV charging, robotics, embedded QA.",
        "Now an M.Sc. Electronics (ELISE) student at UMLP, Besançon.",
      ],
      "ls projects": () => [
        "bms/            STM32 + LTC6804 battery management",
        "l2-ev-charger/  STM32H747 Level-2 charger",
        "freev2g/        Raspberry Pi vehicle-to-grid",
        "scara-ros2/     SCARA arm on ROS2",
        "...             scroll down for all 12",
      ],
      experience: () => scrollToSection("experience"),
      skills: () => scrollToSection("skills"),
      contact: () => [
        "mail      obaidtanveer04@gmail.com",
        "github    github.com/Obaidtanveer1804",
        "linkedin  linkedin.com/in/obaid-tanveer-1a889523b",
      ],
    };

    const PROMPT = "obaid@besancon:~$";
    let inputEl = null;

    function scrollToSection(sectionId) {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
      return [`→ #${sectionId}`];
    }

    function appendLine(contentNodes) {
      const line = document.createElement("div");
      line.className = "terminal__line";
      contentNodes.forEach((node) => line.append(node));
      bodyEl.insertBefore(line, inputEl ? inputEl.parentElement : null);
      bodyEl.scrollTop = bodyEl.scrollHeight;
      return line;
    }

    function span(className, text) {
      const el = document.createElement("span");
      el.className = className;
      el.textContent = text;
      return el;
    }

    function bootLineNodes([timestamp, device, message]) {
      return [
        span("term-time", `[${timestamp}] `),
        span("term-dev", `${device}: `),
        message,
      ];
    }

    function createPrompt() {
      const row = document.createElement("div");
      row.className = "terminal__line terminal__input-row";
      row.append(span("term-prompt", PROMPT));

      inputEl = document.createElement("input");
      inputEl.className = "terminal__input";
      inputEl.setAttribute("aria-label", "Terminal command");
      inputEl.setAttribute("autocomplete", "off");
      inputEl.setAttribute("spellcheck", "false");
      inputEl.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          runCommand(inputEl.value);
          inputEl.value = "";
        }
      });
      row.append(inputEl);
      bodyEl.append(row);
    }

    function runCommand(rawCommand) {
      const command = rawCommand.trim().toLowerCase().replace(/\s+/g, " ");
      appendLine([span("term-prompt", PROMPT), ` ${rawCommand}`]);

      if (command === "") {
        return;
      }

      if (command === "clear") {
        Array.from(bodyEl.querySelectorAll(".terminal__line"))
          .filter((line) => !line.contains(inputEl))
          .forEach((line) => line.remove());
        return;
      }

      const handler = COMMANDS[command];
      const outputLines = handler
        ? handler()
        : [`${command}: command not found. Type "help" to see what works.`];

      outputLines.forEach((text) => appendLine([span("term-dim", text)]));
    }

    function finishBoot() {
      appendLine([span("term-ok", "[  OK  ] "), "Reached target portfolio.target"]);
      appendLine([span("term-dim", 'Type "help", or tap a command below.')]);
      createPrompt();
    }

    bodyEl.addEventListener("click", () => {
      if (inputEl && !window.getSelection().toString()) {
        inputEl.focus({ preventScroll: true });
      }
    });

    document.querySelectorAll("[data-terminal-command]").forEach((button) => {
      button.addEventListener("click", () => {
        if (inputEl) {
          runCommand(button.dataset.terminalCommand);
        }
      });
    });

    if (prefersReducedMotion) {
      BOOT_LINES.forEach((bootLine) => appendLine(bootLineNodes(bootLine)));
      finishBoot();
      return;
    }

    const BOOT_DELAY_MS = 260;
    BOOT_LINES.forEach((bootLine, index) => {
      window.setTimeout(() => appendLine(bootLineNodes(bootLine)), 350 + index * BOOT_DELAY_MS);
    });
    window.setTimeout(finishBoot, 350 + BOOT_LINES.length * BOOT_DELAY_MS + 200);
  }

  /* ---------- Scope trace (CH1: CAN-like square wave, CH2: sine) ---------- */
  const scopeCanvas = document.querySelector("[data-scope]");

  if (scopeCanvas) {
    initScope(scopeCanvas);
  }

  function initScope(canvas) {
    const context = canvas.getContext("2d");
    const styles = getComputedStyle(document.documentElement);
    const colorCh1 = styles.getPropertyValue("--ch1").trim();
    const colorCh2 = styles.getPropertyValue("--ch2").trim();
    const CAN_PATTERN = "0110100111010001011100101101";
    const BIT_WIDTH_PX = 22;
    let phase = 0;
    let isVisible = true;

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * ratio;
      canvas.height = canvas.clientHeight * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function drawSquare(width, height) {
      const high = height * 0.28;
      const low = height * 0.52;
      context.beginPath();
      context.strokeStyle = colorCh1;
      context.lineWidth = 1.6;

      const offset = phase % BIT_WIDTH_PX;
      const firstBit = Math.floor(phase / BIT_WIDTH_PX);
      let previousY = null;

      for (let x = -offset, bit = firstBit; x < width + BIT_WIDTH_PX; x += BIT_WIDTH_PX, bit += 1) {
        const y = CAN_PATTERN[bit % CAN_PATTERN.length] === "1" ? high : low;
        if (previousY === null) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, previousY);
          context.lineTo(x, y);
        }
        context.lineTo(x + BIT_WIDTH_PX, y);
        previousY = y;
      }
      context.stroke();
    }

    function drawSine(width, height) {
      const centre = height * 0.74;
      const amplitude = height * 0.11;
      context.beginPath();
      context.strokeStyle = colorCh2;
      context.lineWidth = 1.4;
      for (let x = 0; x <= width; x += 2) {
        const y = centre + Math.sin((x + phase * 0.6) / 38) * amplitude;
        if (x === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.stroke();
    }

    function draw() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      context.clearRect(0, 0, width, height);
      drawSquare(width, height);
      drawSine(width, height);
    }

    function tick() {
      if (isVisible) {
        phase += 0.6;
        draw();
      }
      window.requestAnimationFrame(tick);
    }

    resize();
    draw();
    window.addEventListener("resize", () => {
      resize();
      draw();
    });

    if (!prefersReducedMotion) {
      new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
      }).observe(canvas);
      window.requestAnimationFrame(tick);
    }
  }
})();
