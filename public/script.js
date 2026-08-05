/* ============================================================
   GLOBAL GRACE ACTIVATION — shared behaviour
   ============================================================ */
(function(){

  /* ---------- Navbar: scroll state + mobile menu + active link ---------- */
  const nav = document.querySelector('.nav');
  const burger = document.querySelector('.nav-burger');
  const links = document.querySelector('.nav-links');

  function onScroll(){
    if(!nav) return;
    if(window.scrollY > 30) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  if(burger && links){
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-open');
      links.classList.toggle('is-open');
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      burger.classList.remove('is-open');
      links.classList.remove('is-open');
    }));
  }

  // mark active nav link based on current file
  const page = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-stagger');
  if('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, {threshold:.14, rootMargin:'0px 0px -60px 0px'});
    revealEls.forEach(el=>io.observe(el));
  } else {
    revealEls.forEach(el=>el.classList.add('in'));
  }

  /* ---------- Countdown timer (real, live) ---------- */
  // Reads the target date from the countdown element's data-event-date
  // attribute (set server-side from the featured Event in the CMS) when
  // present, so the countdown follows whatever event is actually
  // configured instead of a hardcoded date.
  const countdownEl = document.querySelector('.countdown[data-event-date]');
  const EVENT_DATE = countdownEl
    ? new Date(countdownEl.getAttribute('data-event-date')).getTime()
    : new Date('2026-12-04T18:00:00+01:00').getTime();

  function paint(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = String(Math.max(0,value)).padStart(2,'0');
  }

  function tickCountdown(){
    const now = Date.now();
    let diff = EVENT_DATE - now;
    if(diff < 0) diff = 0;
    const days = Math.floor(diff / (1000*60*60*24));
    const hours = Math.floor((diff / (1000*60*60)) % 24);
    const mins = Math.floor((diff / (1000*60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    paint('cd-days', days);
    paint('cd-hours', hours);
    paint('cd-mins', mins);
    paint('cd-secs', secs);
  }
  if(document.getElementById('cd-days')){
    tickCountdown();
    setInterval(tickCountdown, 1000);
  }

  /* ---------- Hero background video (falls back to slider if missing) ---------- */
  const heroVideo = document.getElementById('hero-video');
  if(heroVideo){
    heroVideo.addEventListener('error', ()=> heroVideo.classList.add('hero-video--hidden'));
    // if no playable source loads within a few seconds, hide it too
    setTimeout(()=>{
      if(heroVideo.readyState === 0) heroVideo.classList.add('hero-video--hidden');
    }, 4000);
  }

  /* ---------- Hero background fade slider ---------- */
  const heroSlider = document.getElementById('hero-slider');
  if(heroSlider){
    const slides = heroSlider.querySelectorAll('.hero-slide');
    if(slides.length > 1){
      let current = 0;
      setInterval(()=>{
        slides[current].classList.remove('active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('active');
      }, 5000);
    }
  }

  /* ---------- Hero load-in sequence ---------- */
  window.addEventListener('DOMContentLoaded', () => {
    const seq = [
      '.hero-flame-word',
      '.hero .split-line span',
      'p.lede',
      '.hero-cta-row',
      '.hero-panel'
    ];
    let delay = 200;
    seq.forEach((sel, i)=>{
      document.querySelectorAll(sel).forEach((el, idx)=>{
        setTimeout(()=>{
          el.style.transition = 'opacity .9s cubic-bezier(.16,.8,.24,1), transform .9s cubic-bezier(.16,.8,.24,1)';
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, delay + idx*90);
      });
      delay += (sel.includes('split-line') ? 90 : 160);
    });
  });

  /* ---------- Ember particle canvas on hero ---------- */
  const canvas = document.getElementById('ember-canvas');
  if(canvas && canvas.getContext){
    const ctx = canvas.getContext('2d');
    let w,h,particles;
    const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize(){
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    }
    function makeParticles(){
      const count = REDUCE ? 0 : Math.min(70, Math.floor(w/28));
      particles = Array.from({length:count}, () => spawn());
    }
    function spawn(){
      return {
        x: Math.random()*w,
        y: h + Math.random()*100,
        r: (Math.random()*2.2+0.6) * devicePixelRatio,
        speed: (Math.random()*0.6+0.25) * devicePixelRatio,
        drift: (Math.random()-0.5)*0.5,
        alpha: Math.random()*0.5+0.15,
        hue: Math.random() > 0.25 ? '181,211,52' : '245,185,66'
      };
    }
    function frame(){
      ctx.clearRect(0,0,w,h);
      particles.forEach(p=>{
        p.y -= p.speed;
        p.x += p.drift;
        if(p.y < -20){ Object.assign(p, spawn(), {y: h+20}); }
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fillStyle = `rgba(${p.hue},${p.alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    resize(); makeParticles();
    window.addEventListener('resize', ()=>{ resize(); makeParticles(); });
    if(!REDUCE) requestAnimationFrame(frame);
  }

  /* ---------- Toast helper ---------- */
  window.gcToast = function(msg){
    let t = document.querySelector('.toast');
    if(!t){
      t = document.createElement('div');
      t.className = 'toast';
      t.innerHTML = '<span class="dot-ok"></span><span class="msg"></span>';
      document.body.appendChild(t);
    }
    t.querySelector('.msg').textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(()=>t.classList.remove('show'), 3200);
  };

  /* ---------- Generic form intercept (newsletter, contact, volunteer, prayer, register) ---------- */
  document.querySelectorAll('form[data-fake-submit]').forEach(form=>{
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const msg = form.getAttribute('data-success') || 'Thank you — received!';
      window.gcToast(msg);
      form.reset();
      const modal = form.closest('.modal-overlay');
      if(modal){
        setTimeout(()=>{
          modal.classList.remove('open');
          modal.setAttribute('aria-hidden','true');
          document.body.style.overflow = '';
        }, 500);
      }
    });
  });

  /* ---------- Register modal ---------- */
  const registerModal = document.getElementById('register-modal');
  if(registerModal){
    const closeBtn = document.getElementById('register-modal-close');
    const titleEl = document.getElementById('register-modal-title');

    function openRegisterModal(eventName){
      if(titleEl) titleEl.textContent = eventName ? ('Register for ' + eventName) : 'Register for GGA Global Conference 2026';
      registerModal.classList.add('open');
      registerModal.setAttribute('aria-hidden','false');
      document.body.style.overflow = 'hidden';
    }
    function closeRegisterModal(){
      registerModal.classList.remove('open');
      registerModal.setAttribute('aria-hidden','true');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.js-register-btn').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        openRegisterModal(btn.getAttribute('data-event'));
      });
    });
    if(closeBtn) closeBtn.addEventListener('click', closeRegisterModal);
    registerModal.addEventListener('click', (e)=>{
      if(e.target === registerModal) closeRegisterModal();
    });
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape' && registerModal.classList.contains('open')) closeRegisterModal();
    });
  }

  /* ---------- Accordion (FAQs) ---------- */
  document.querySelectorAll('.accordion-item').forEach(item=>{
    const btn = item.querySelector('button');
    const body = item.querySelector('.a-body');
    if(!btn||!body) return;
    btn.addEventListener('click', ()=>{
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i=>{
        i.classList.remove('open');
        i.querySelector('.a-body').style.maxHeight = null;
      });
      if(!isOpen){
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Tabs (Events / Blog / Testimonies filters) ---------- */
  document.querySelectorAll('[data-tabs]').forEach(group=>{
    const buttons = group.querySelectorAll('.tab-btn');
    const targetSel = group.getAttribute('data-tabs');
    const items = document.querySelectorAll(targetSel + ' [data-cat]');
    buttons.forEach(b=>{
      b.addEventListener('click', ()=>{
        buttons.forEach(x=>x.classList.remove('active'));
        b.classList.add('active');
        const cat = b.getAttribute('data-filter');
        items.forEach(it=>{
          const show = cat === 'all' || it.getAttribute('data-cat') === cat;
          it.style.display = show ? '' : 'none';
        });
      });
    });
  });

  /* ---------- Give: amount + frequency selection ---------- */
  document.querySelectorAll('.give-amounts').forEach(group=>{
    group.querySelectorAll('.amt-btn').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        group.querySelectorAll('.amt-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const customInput = group.parentElement.querySelector('.custom-amount');
        if(customInput) customInput.value = btn.dataset.amt === 'custom' ? '' : btn.textContent.replace(/[^\d]/g,'');
      });
    });
  });
  document.querySelectorAll('.give-toggle').forEach(toggle=>{
    toggle.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        toggle.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
  document.querySelectorAll('[data-give-cta]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      window.gcToast('Redirecting to secure checkout…');
    });
  });

  /* ---------- Watch Live chat is handled entirely by watch-live.js
     (real Socket.io implementation) — nothing to do here anymore. ---------- */

  /* ---------- Gallery lightbox (simple caption toast) ---------- */
  document.querySelectorAll('.gallery-item').forEach(item=>{
    item.addEventListener('click', ()=>{
      window.gcToast(item.dataset.caption || 'Opening media…');
    });
  });



  /* ---------- Pop-up image modal ---------- */
  const popTrigger = document.getElementById('pop-trigger');
  const popModal = document.getElementById('pop-modal');
  const popModalImg = document.getElementById('pop-modal-img');
  const popModalClose = document.getElementById('pop-modal-close');

  function openPopModal(){
    if(!popModal || !popModalImg) return;
    const src = document.getElementById('pop-feature-img').getAttribute('src');
    popModalImg.src = src;
    popModal.classList.add('open');
    popModal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closePopModal(){
    if(!popModal) return;
    popModal.classList.remove('open');
    popModal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  if(popTrigger){
    popTrigger.addEventListener('click', openPopModal);
  }
  if(popModalClose){
    popModalClose.addEventListener('click', (e)=>{ e.stopPropagation(); closePopModal(); });
  }
  if(popModal){
    popModal.addEventListener('click', (e)=>{ if(e.target === popModal) closePopModal(); });
  }
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && popModal && popModal.classList.contains('open')) closePopModal();
  });

})();