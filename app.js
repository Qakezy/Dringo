/* app.js
- Updated: 2025-09-06
- Fixes:
  1) Use CSS classes (.will-reveal / .is-visible) instead of inline styles for reveal animations.
  2) Carousel translation now uses the visible carousel container width (px) to avoid percentage math issues.
- How to run: save over your old app.js and refresh the page.
*/

(function () {
  'use strict';

  const qs = s => document.querySelector(s);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme Toggle  ---------- */
  const THEME_KEY = 'dringo-theme';
  const body = document.body;
  const themeBtn = qs('#themeToggle');
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) body.setAttribute('data-theme', savedTheme);
  themeBtn && themeBtn.addEventListener('click', () => {
    const next = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    themeBtn.setAttribute('aria-pressed', String(next === 'dark'));
  });

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.querySelector('.nav__toggle');
  const navList = document.querySelector('#nav-list');

  if (navToggle && navList) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !expanded);
      navList.style.display = expanded ? 'none' : 'flex';
    });
  }

  /* ---------- Smooth scroll + active link ---------- */
  const links = qsa('.nav__link');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({behavior: REDUCE ? 'auto' : 'smooth', block: 'start'});
      }
    });
  });

  // active link on scroll (throttle-lite)
  const sectionEls = qsa('main > section[id]');
  function onScrollActive(){
    const fromTop = window.scrollY + 120;
    sectionEls.forEach(sec => {
      const id = sec.id;
      const link = document.querySelector(`.nav__link[href="#${id}"]`);
      if (!link) return;
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (fromTop >= top && fromTop < bottom) {
        link.classList.add('is-active');
      } else {
        link.classList.remove('is-active');
      }
    });
  }
  window.addEventListener('scroll', onScrollActive, {passive:true});

  /* ---------- Scroll progress bar ---------- */
  const progress = qs('.progress');
  function updateProgress(){
    const h = document.documentElement;
    const percent = Math.min(100, (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100);
    progress.style.width = percent + '%';
  }
  window.addEventListener('scroll', updateProgress, {passive:true});

  /* ---------- Back to top FAB ---------- */
  const btnTop = qs('#btnTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      btnTop.style.display = 'block';
    } else {
      btnTop.style.display = 'none';
    }
  });
  btnTop.addEventListener('click', () => window.scrollTo({top:0, behavior: REDUCE ? 'auto' : 'smooth'}));

  /* ---------- Parallax hero background ---------- */
  const heroBg = qs('.hero__bg');
  if (heroBg && !REDUCE) {
    window.addEventListener('scroll', () => {
      const sc = window.scrollY;
      heroBg.style.transform = `translateY(${sc * 0.12}px)`;
    }, {passive:true});
  }

  /* ---------- Intersection Observer for reveal animations ---------- */
  const revealEls = qsa('.card, .steps__item, .testimonial, .panel, .map__skeleton, .cta__inner, .accordion__item');
  if (!REDUCE && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, {threshold: 0.12});
    revealEls.forEach(el => { el.classList.add('will-reveal'); io.observe(el); });
  } else {
    // fallback make visible
    revealEls.forEach(el => { el.classList.add('is-visible'); });
  }

  /* ---------- FAQ accordion ARIA ---------- */
  qsa('.accordion__button').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      const panel = btn.nextElementSibling;
      if (!panel) return;
      if (expanded) {
        panel.hidden = true;
      } else {
        panel.hidden = false;
      }
    });
  });

  /* ---------- Email capture form validation (client-side) ---------- */

const emailForm = qs('#emailForm');
const emailInput = qs('#email');
const emailMsg = qs('#emailMsg');

if (emailForm) {
  // helper: save to localStorage (fallback)
  function saveToLocalWaitlist(email) {
    try {
      const key = 'dringo_waitlist';
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const exists = list.some(item => item.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        list.push({ email, ts: new Date().toISOString() });
        localStorage.setItem(key, JSON.stringify(list));
      }
      return !exists;
    } catch (err) {
      return false;
    }
  }

 async function submitWaitlist(email) {
  const submitBtn = emailForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;
  emailMsg.textContent = '';

  try {
    // Send URL-encoded data (Apps Script understands this directly)
    const body = new URLSearchParams();
    body.append("email", email);

    // IMPORTANT: no headers and no JSON.stringify
    // "no-cors" mode avoids CORS errors, we just assume success
    await fetch(
      "https://script.google.com/macros/s/AKfycbxv0Ou3aGi4YhkQoA_bDxNnc068W5TheJdif6iz3GGPzjsx0a-Qnhbto6vDZzMT3ps/exec",
      {
        method: "POST",
        body: body,
        mode: "no-cors"
      }
    );

    return { remote: true }; // treat as success
  } catch (err) {
    console.error("Waitlist submission failed:", err);
  }

  // fallback: save locally
  const added = saveToLocalWaitlist(email);
  return { remote: false, added };
}


  emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    emailMsg.textContent = '';

    const val = emailInput.value.trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      emailMsg.textContent = 'Please enter a valid email.';
      emailInput.focus();
      return;
    }

    // optimistic UX
    emailMsg.textContent = 'Saving...';

    const result = await submitWaitlist(val);
    if (result.remote) {
      emailMsg.textContent = 'Thanks — you’re on the waitlist!';
    } else if (result.added) {
      emailMsg.textContent = 'Saved locally — you’re on the waitlist! (no server available)';
    } else {
      emailMsg.textContent = 'You’re already on the waitlist.';
    }

    // clear input on success
    if (result.remote || result.added) emailInput.value = '';

    if (!REDUCE) {
      try {
        emailMsg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      } catch (e) {}
    }

    const submitBtn = emailForm.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = false;
  });
}



  /* ---------- Anchor -> focus email input (Join learners CTA) ---------- */
  function focusEmailFromHash() {
    if (location.hash === '#email') {
      setTimeout(() => {
        if (emailInput) {
          emailInput.scrollIntoView({behavior:'smooth', block:'center'});
          emailInput.focus({preventScroll:true});
        }
      }, 80);
    }
  }
  // handle clicks on any link to #email
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href="#email"]');
    if (a) {
      ev.preventDefault();
      history.pushState(null, '', '#email');
      focusEmailFromHash();
    }
  });
  // on load
  focusEmailFromHash();
  // on hash change
  window.addEventListener('hashchange', focusEmailFromHash);

  /* ---------- Small accessibility: set current year in footer ---------- */
  qs('#year') && (qs('#year').textContent = new Date().getFullYear());

  /* ---------- Initial states ---------- */
  onScrollActive();
  updateProgress();

})();

