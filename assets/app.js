// Año dinámico
document.getElementById('y').textContent = new Date().getFullYear();

// Galería: cambiar imagen principal
const galImg = document.getElementById('galImg');
document.querySelectorAll('.thumb').forEach(t => {
  t.addEventListener('click', () => {
    galImg.src = t.src;
    document.querySelectorAll('.thumb').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
  });
});

// Reveal on scroll
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = 1;
      e.target.style.transform = 'none';
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });

document.querySelectorAll('.card, .use, .gal-main, .offer, details').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(18px)';
  el.style.transition = 'opacity .6s ease, transform .6s ease';
  io.observe(el);
});
