// ============================================
// SmartIntern — Rotating match preview
// ============================================

(function () {
  const cards = document.querySelectorAll('.match-card');
  const dots  = document.querySelectorAll('.match-dot-indicator');
  if (!cards.length) return;

  let current = 0;
  let intervalId = null;
  const DELAY = 3200;

  function show(index) {
    cards.forEach((c, i) => c.classList.toggle('active', i === index));
    dots.forEach((d, i) => d.classList.toggle('active', i === index));
    current = index;

    // Re-animate the fill bar
    const bar = cards[index].querySelector('.match-bar-fill');
    if (bar) {
      const finalWidth = bar.dataset.width || bar.style.width || '80%';
      bar.dataset.width = finalWidth;
      bar.style.width = '0';
      void bar.offsetWidth; // force reflow
      bar.style.width = finalWidth;
    }
  }

  function next() { show((current + 1) % cards.length); }

  function start() {
    stop();
    intervalId = setInterval(next, DELAY);
  }

  function stop() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }

  // Dots
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      show(i);
      start();
    });
  });

  // Pause on hover
  const preview = document.getElementById('matchPreview');
  if (preview) {
    preview.addEventListener('mouseenter', stop);
    preview.addEventListener('mouseleave', start);
  }

  show(0);
  start();
})();