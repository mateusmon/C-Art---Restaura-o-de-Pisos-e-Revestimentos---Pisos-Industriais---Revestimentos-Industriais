const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');

function closeMenu() {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
  mobileNav.hidden = true;
  document.body.classList.remove('menu-open');
}

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  mobileNav.hidden = !open;
  document.body.classList.toggle('menu-open', open);
});

mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 760) closeMenu(); });

const filters = [...document.querySelectorAll('.filter')];
const cards = [...document.querySelectorAll('.work-card')];
filters.forEach((button) => button.addEventListener('click', () => {
  const selected = button.dataset.filter;
  filters.forEach((item) => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  cards.forEach((card) => { card.hidden = card.dataset.category !== selected; });
}));

const contactForm = document.querySelector('#contact-service-form');
if (contactForm) {
  const serviceSelect = contactForm.querySelector('#contact-service');
  const messageField = contactForm.querySelector('[name="text"]');
  const submitButton = contactForm.querySelector('[type="submit"]');
  serviceSelect?.addEventListener('change', () => {
    const service = serviceSelect.selectedOptions[0]?.textContent?.trim();
    messageField.value = `Olá! Tenho interesse em ${service}. Gostaria de receber mais informações e um orçamento.`;
    submitButton.disabled = !serviceSelect.value;
  });
}

const wheel = document.querySelector('[data-service-wheel]');
if (wheel) {
  const serviceWheel = wheel.closest('.service-wheel');
  const orbit = wheel.querySelector('[data-wheel-orbit]');
  const wheelCards = [...wheel.querySelectorAll('[data-wheel-card]')];
  const count = serviceWheel.querySelector('[data-wheel-count]');
  const title = serviceWheel.querySelector('[data-wheel-title]');
  const copy = serviceWheel.querySelector('[data-wheel-copy]');
  const selectors = [...wheel.querySelectorAll('[data-wheel-select]')];
  const previous = serviceWheel.querySelector('[data-wheel-prev]');
  const next = serviceWheel.querySelector('[data-wheel-next]');
  const descriptions = [
    'Limpeza, recuperação e renovação visual de superfícies em diferentes ambientes.',
    'Aplicações e acabamentos para pisos, incluindo revestimento industrial, resina epóxi e porcelanato líquido.',
    'Cuidado e restauração de superfícies que pedem atenção ao uso, à limpeza e ao acabamento.',
    'Tratamento final das superfícies para apresentar o ambiente depois da obra.',
    'Revitalização e pintura de pisos e calçadas, de acordo com as condições de cada espaço.',
  ];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const radians = (degrees) => degrees * Math.PI / 180;
  const countItems = wheelCards.length;
  let turn = 1;
  let target = 1;
  let active = -1;
  let frame = 0;
  let dragY = null;
  let visible = true;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function goTo(value) {
    target = clamp(value, 1, countItems);
    updateActive(Math.round(Math.max(0, target - 1)));
  }

  function updateActive(index) {
    const next = clamp(index, 0, countItems - 1);
    if (next === active && count) return;
    active = next;
    if (count) count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(countItems).padStart(2, '0')}`;
    if (title) title.textContent = wheelCards[active].querySelector('figcaption').textContent;
    if (copy) copy.textContent = descriptions[active];
    selectors.forEach((button, index) => button.setAttribute('aria-pressed', String(index === active)));
  }

  function draw() {
    frame = requestAnimationFrame(draw);
    if (!visible) return;
    const width = wheel.clientWidth;
    const height = wheel.clientHeight;
    if (!width || !height) return;
    const cardWidth = Math.min(height * .38 * 1.45, width * (width < 700 ? .55 : .34));
    const cardHeight = cardWidth / 1.45;
    const ringRadius = cardHeight * 1.14;
    const drumRadius = cardHeight * 2.22;
    const bow = cardHeight * 1.82;
    const ringScale = clamp(((2 * Math.PI * ringRadius / countItems) * .82) / cardWidth, .16, 1);
    wheel.style.perspective = `${cardHeight * 2.7}px`;
    wheelCards.forEach((card) => {
      card.style.width = `${cardWidth}px`;
      card.style.height = `${cardHeight}px`;
      card.style.marginLeft = `${-cardWidth / 2}px`;
      card.style.marginTop = `${-cardHeight / 2}px`;
    });

    const gap = target - turn;
    turn = Math.abs(gap) < .0005 ? target : turn + gap * (reducedMotion.matches ? 1 : .12);
    const mix = clamp(turn, 0, 1);
    const position = Math.max(0, turn - 1);
    orbit.style.transform = `translateZ(${-mix * drumRadius}px)`;
    wheelCards.forEach((card, index) => {
      const distance = index - position;
      const angle = distance * 40;
      const arcX = -bow * (1 - Math.cos(radians(angle)));
      const ringAngle = distance * 360 / countItems;
      card.style.transform = `translateX(${mix * arcX}px) rotateZ(${(1 - mix) * ringAngle}deg) translateY(${-(1 - mix) * ringRadius}px) rotateX(${mix * angle}deg) translateZ(${mix * drumRadius}px) scale(${ringScale + (1 - ringScale) * mix})`;
      card.style.opacity = mix > .5 && Math.abs(distance) > 1.6 ? '0' : '1';
      card.style.zIndex = String(Math.round(100 - Math.abs(distance) * 2));
    });
    updateActive(Math.round(position));
  }

  function start() { if (!frame) frame = requestAnimationFrame(draw); }
  start();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; } }, { rootMargin: '120px' });
    observer.observe(wheel);
  }

  selectors.forEach((button) => button.addEventListener('click', () => goTo(Number(button.dataset.wheelSelect) + 1)));
  previous?.addEventListener('click', () => goTo(Math.round(target) - 1));
  next?.addEventListener('click', () => goTo(Math.round(target) + 1));
  wheel.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') { event.preventDefault(); goTo(Math.round(target) + 1); }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') { event.preventDefault(); goTo(Math.round(target) - 1); }
  });
  wheel.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    dragY = event.clientY;
    wheel.setPointerCapture(event.pointerId);
  });
  wheel.addEventListener('pointermove', (event) => {
    if (dragY === null) return;
    goTo(target + (dragY - event.clientY) / 180);
    dragY = event.clientY;
  });
  const settleDrag = () => { if (dragY === null) return; dragY = null; goTo(Math.round(target)); };
  wheel.addEventListener('pointerup', settleDrag);
  wheel.addEventListener('pointercancel', settleDrag);
}

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());
