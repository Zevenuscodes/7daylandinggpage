// Minimal behavior: pulse arrows faster when CTA enters viewport, warn if placeholder link not replaced
(function () {
  var ctas = [
    document.getElementById('whatsapp-cta'),
    document.getElementById('whatsapp-cta-bottom')
  ].filter(Boolean);

  // Intersection Observer to speed arrow animation
  var arrowContainers = Array.prototype.slice.call(document.querySelectorAll('.arrows'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        arrowContainers.forEach(function (el) {
          if (entry.isIntersecting) {
            el.style.filter = 'drop-shadow(0 0 6px rgba(255,23,68,0.6))';
          } else {
            el.style.filter = 'none';
          }
        });
      });
    }, { threshold: 0.2 });
    ctas.forEach(function (cta) { io.observe(cta); });
  }

  // Guard if WhatsApp link not yet added
  ctas.forEach(function (cta) {
    cta.addEventListener('click', function (e) {
      var isPlaceholder = cta.getAttribute('data-placeholder') === 'true' || cta.getAttribute('href') === '#whatsapp';
      if (isPlaceholder) {
        e.preventDefault();
        alert('WhatsApp ग्रुप लिंक अभी Placeholder है. कृपया वास्तविक लिंक जोड़ें.');
      }
      if (window.fbq) {
        try {
          fbq('track', 'Contact', { content_name: 'WhatsApp CTA', link: cta.href });
        } catch (err) { /* noop */ }
      }
    });
  });
})();

// Enhance YouTube testimonial: fetch and render video description
(function () {
  var container = document.getElementById('yt-testimonial');
  if (!container) return;
  var videoId = container.getAttribute('data-video-id');
  var descEl = container.querySelector('.yt-desc');
  var refreshBtn = container.querySelector('.descRefresh');
  if (!videoId || !descEl) return;

  function fetchDescription() {
    descEl.textContent = 'वीडियो विवरण लोड हो रहा है…';
    var url = 'https://r.jina.ai/http://www.youtube.com/watch?v=' + encodeURIComponent(videoId);
    return fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (txt) {
        var match = txt.match(/\"shortDescription\":\"([\s\S]*?)\"/);
        if (match && match[1]) {
          var raw = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\u0026/g, '&')
            .replace(/\\"/g, '"');
          var trimmed = raw.length > 500 ? raw.slice(0, 500) + '…' : raw;
          descEl.textContent = trimmed;
        } else {
          descEl.textContent = 'वीडियो देखें — पूरी कहानी इसी में है।';
        }
      })
      .catch(function () {
        descEl.textContent = 'विवरण लाने में दिक्कत हुई। ऊपर थंबनेल पर क्लिक कर वीडियो खोलें।';
      });
  }

  fetchDescription();
  if (refreshBtn) {
    refreshBtn.addEventListener('click', function () { fetchDescription(); });
  }
})();

// Video modal open/close and autoplay embed
(function () {
  var card = document.getElementById('yt-testimonial');
  var modal = document.getElementById('videoModal');
  if (!card || !modal) return;
  var thumb = card.querySelector('.thumbWrap');
  var videoId = card.getAttribute('data-video-id');
  var modalVideo = document.getElementById('modalVideo');
  var modalDesc = document.getElementById('modalDesc');
  var sourceDesc = card.querySelector('.yt-desc');

  function openModal(e) {
    if (e) e.preventDefault();
    if (sourceDesc && modalDesc) modalDesc.textContent = sourceDesc.textContent;
    var src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&modestbranding=1';
    modalVideo.innerHTML = '<iframe src="' + src + '" allow="autoplay; encrypted-media" allowfullscreen></iframe>';
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.remove('modal--open');
    modalVideo.innerHTML = '';
    document.body.style.overflow = '';
  }

  if (thumb) thumb.addEventListener('click', openModal);
  modal.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute('data-close-modal')) {
      closeModal();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();

// Brochure image modal
(function () {
  var openBtn = document.querySelector('.brochureOpen');
  var modal = document.getElementById('imageModal');
  if (!openBtn || !modal) return;
  var modalImg = document.getElementById('modalImage');
  var brochureSrc = '../public/pic1.jpg';

  function openModal(e) {
    if (e) e.preventDefault();
    if (modalImg) modalImg.src = brochureSrc;
    modal.classList.add('modal--open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('modal--open');
    document.body.style.overflow = '';
  }
  openBtn.addEventListener('click', openModal);
  modal.addEventListener('click', function (e) {
    if (e.target && e.target.hasAttribute('data-close-modal')) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();

// Lead form submit -> send to your CRM/Sheet endpoint then open WhatsApp
(function () {
  var form = document.getElementById('lead-form');
  if (!form) return;
  var statusEl = document.getElementById('lead-status');

  var WHATSAPP_URL = 'https://chat.whatsapp.com/GqG1PtmWnMFKbyjZFsa0lI?mode=wwt';
  var formId = form.getAttribute('data-formspree');
  var FORM_ENDPOINT = (formId && formId !== 'YOUR_FORMSPREE_ID') ? ('https://formspree.io/f/' + formId) : '';

  function readUtm() {
    var p = new URLSearchParams(window.location.search);
    var obj = {};
    ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','ad_id','adset_id','campaign_id'].forEach(function(k){
      var v = p.get(k); if (v) obj[k]=v;
    });
    return obj;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusEl.textContent = '';

    var data = new FormData(form);
    if (data.get('company')) { return; } // honeypot
    var name = (data.get('name')||'').toString().trim();
    var phone = (data.get('phone')||'').toString().trim();
    var email = (data.get('email')||'').toString().trim();

    var digits = phone.replace(/\D/g,'');
    if (!name || digits.length < 10) {
      statusEl.textContent = 'कृपया वैध नाम और 10 अंकों का मोबाइल दर्ज करें।';
      statusEl.style.color = '#b80b2c';
      return;
    }

    var payload = {
      name: name,
      phone: phone,
      email: email,
      page: window.location.href,
      ts: new Date().toISOString(),
      source: 'ayurveda-landing',
      utm: readUtm()
    };

    var submitBtn = form.querySelector('.leadBtn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'भेज रहा है…'; }

    var doAfter = function() {
      if (window.fbq) { try { fbq('track','Lead', {content_name:'Landing Form'}); } catch(_){} }
      window.open(WHATSAPP_URL, '_blank');
    };

    if (!FORM_ENDPOINT) {
      // No endpoint configured; just proceed to WhatsApp
      doAfter();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'भेजें और WhatsApp ग्रुप जॉइन करें'; }
      statusEl.textContent = 'डेमो मोड: कृपया वास्तविक CRM/Sheet endpoint सेट करें।';
      statusEl.style.color = '#0b8a4a';
      return;
    }

    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res){ return res.ok ? res.json() : Promise.reject(new Error('HTTP '+res.status)); })
      .then(function(){
        statusEl.textContent = 'धन्यवाद! विवरण प्राप्त हो गया।';
        statusEl.style.color = '#0b8a4a';
        doAfter();
      })
      .catch(function(){
        statusEl.textContent = 'सबमिट नहीं हो पाया। कृपया दुबारा प्रयास करें।';
        statusEl.style.color = '#b80b2c';
      })
      .finally(function(){
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'भेजें और WhatsApp ग्रुप जॉइन करें'; }
      });
  });
})();


