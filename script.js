/* 1) Year auto-update */
(() => {
  document.querySelectorAll('#year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();

/* 2) VanillaTilt for cards (if included) */
if (window.VanillaTilt) {
  VanillaTilt.init(document.querySelectorAll('.tilt'), {
    max: 10,
    speed: 500,
    glare: true,
    'max-glare': 0.25,
  });
}

/* 3) Smooth scroll for anchors */
document.querySelectorAll('a[href^="#"]').forEach(a =>
  a.addEventListener('click', e => {
    const tgt = document.getElementById(a.getAttribute('href').slice(1));
    if (tgt) {
      e.preventDefault();
      tgt.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  })
);

/* 4) Reveal-on-scroll */
const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal, .card').forEach(el => observer.observe(el));