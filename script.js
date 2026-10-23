/* =====================================================================
   Obaid Tanveer — website scripts (site.html and detail pages)
   Each feature runs only if its elements exist on the page.
   ===================================================================== */
(() => {
  "use strict";

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  /* ---------- Highlight the nav icon of the section in view ---------- */
  const navLinks = Array.from(document.querySelectorAll(".pill-nav__link[data-nav]"));
  const isSitePage = document.body.classList.contains("site");

  if (isSitePage && navLinks.length > 0 && "IntersectionObserver" in window) {
    const setActive = (sectionId) => {
      navLinks.forEach((link) => {
        const isActive = link.dataset.nav === sectionId;
        link.classList.toggle("is-active", isActive);
        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => setActive(entry.target.id));
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    navLinks.forEach((link) => {
      const section = document.getElementById(link.dataset.nav);
      if (section) {
        sectionObserver.observe(section);
      }
    });
  } else if (!isSitePage) {
    const detailSection = location.pathname.includes("/experience/")
      ? "experience"
      : location.pathname.includes("/education/")
        ? "education"
        : "projects";
    navLinks
      .filter((link) => link.dataset.nav === detailSection)
      .forEach((link) => link.classList.add("is-active"));
  }

  /* ---------- Tool logos: fall back to a monogram if the icon CDN fails ---------- */
  document.querySelectorAll(".tool__logo img[data-fallback]").forEach((image) => {
    const useMonogram = () => {
      const logo = image.parentElement;
      logo.classList.add("tool__logo--mono");
      logo.textContent = image.dataset.fallback;
    };
    if (image.complete && image.naturalWidth === 0) {
      useMonogram();
    } else {
      image.addEventListener("error", useMonogram, { once: true });
    }
  });

  /* ---------- Detail pages: "A · B · C" tag lines become chips ---------- */
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

  /* ---------- Contact form opens the visitor's email app ---------- */
  const contactForm = document.getElementById("contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(contactForm);
      const subject = `Portfolio: ${formData.get("topic")}`;
      const body = [
        `Name: ${formData.get("name")}`,
        `Email: ${formData.get("email")}`,
        "",
        formData.get("message"),
      ].join("\n");
      window.location.href =
        `mailto:${contactForm.dataset.email}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;
    });
  }
})();
