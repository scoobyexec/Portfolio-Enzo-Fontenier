/**
 * Ce fichier doit être chargé avec l'attribut `defer` dans le HTML :
 *   <script src="script.js" defer></script>
 *
 * `defer` garantit que le DOM est prêt avant l'exécution du script,
 * ce qui évite de bloquer le rendu de la page et rend inutile
 * l'écouteur DOMContentLoaded (remplacé par un appel direct en bas).
 */
'use strict';

const el  = (sel, ctx = document) => ctx.querySelector(sel);
const els = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function initNavigation() {
  const burger = el('#burger');
  const liens  = el('#liens-nav');
  if (!burger || !liens) return;

  function ouvrir() {
    liens.classList.add('ouvert');
    burger.classList.add('ouvert');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
  }

  function fermer() {
    liens.classList.remove('ouvert');
    burger.classList.remove('ouvert');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
  }

  burger.addEventListener('click', () => liens.classList.contains('ouvert') ? fermer() : ouvrir());
  els('.navigation__lien').forEach(lien => lien.addEventListener('click', fermer));
  document.addEventListener('click', e => { if (!e.target.closest('.navigation')) fermer(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && liens.classList.contains('ouvert')) { fermer(); burger.focus(); }
  });
}

function initApparition() {
  const elements = els('.apparition');
  if (!elements.length) return;

  els('.carte, .carte-video').forEach((el, i) => el.style.setProperty('--i', i % 3));

  // rootMargin '0px 0px 0px 0px' : les éléments déjà dans le viewport au
  // chargement sont détectés immédiatement par l'IntersectionObserver sans
  // passer par getBoundingClientRect (qui force un recalcul de style/layout).
  // Le threshold à 0 déclenche dès le premier pixel visible, ce qui est plus
  // léger pour les éléments en limite basse d'écran.
  const observateur = new IntersectionObserver(
    entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observateur.unobserve(entry.target);
      }
    }),
    { threshold: 0, rootMargin: '0px 0px -30px 0px' }
  );

  elements.forEach(el => observateur.observe(el));
}

function initTiroir() {
  const galerie = el('#galerie');
  if (!galerie) return;

  const tiroir       = el('#tiroir');
  const fondTiroir   = el('#tiroir-fond');
  const panneau      = tiroir ? tiroir.querySelector('.tiroir__panneau') : null;
  const btnFermer    = el('#tiroir-fermer');
  const elCategorie  = el('#tiroir-categorie');
  const elTitre      = el('#tiroir-titre');
  const elDesc       = el('#tiroir-description');
  const elMeta       = el('#tiroir-meta');
  const elImages     = el('#tiroir-images');

  if (!tiroir || !panneau) return;

  let dernierFocus = null;

  function ouvrir(carte) {
    dernierFocus = carte;
    elCategorie.textContent = carte.dataset.categorie || '';
    elTitre.textContent     = carte.dataset.titre     || '';
    elDesc.textContent      = carte.dataset.description || '';

    elMeta.innerHTML = '';
    [
      { label: 'Categorie', valeur: carte.dataset.categorie },
      { label: 'Annee',     valeur: carte.dataset.annee     },
      { label: 'Outils',    valeur: carte.dataset.outils    },
    ]
      .filter(m => m.valeur)
      .forEach(({ label, valeur }) => {
        const item = document.createElement('div');
        item.className = 'tiroir__meta-element';
        item.innerHTML = `<span class="tiroir__meta-label">${label}</span><span class="tiroir__meta-valeur">${valeur}</span>`;
        elMeta.appendChild(item);
      });

    elImages.innerHTML = '';
    els('img', carte).forEach(img => {
      const image = new Image();
      image.src       = img.src;
      image.alt       = img.alt;
      image.className = 'tiroir__image-projet';
      image.loading   = 'lazy';
      elImages.appendChild(image);
    });

    tiroir.classList.add('ouvert');
    tiroir.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnFermer.focus();
  }

  function fermer() {
    tiroir.classList.remove('ouvert');
    tiroir.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (dernierFocus) dernierFocus.focus();
  }

  els('.carte', galerie).forEach(carte => {
    carte.setAttribute('tabindex', '0');
    carte.setAttribute('role', 'button');
    carte.setAttribute('aria-label', `Voir le projet ${carte.dataset.titre}`);
    carte.addEventListener('click', () => ouvrir(carte));
    carte.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(carte); }
    });
  });

  btnFermer.addEventListener('click', fermer);
  fondTiroir.addEventListener('click', fermer);
  document.addEventListener('keydown', e => {
    if (tiroir.classList.contains('ouvert') && e.key === 'Escape') fermer();
  });

  panneau.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const focusables = els('button, [href], input, [tabindex]:not([tabindex="-1"])', panneau);
    if (!focusables.length) return;
    const premier = focusables[0];
    const dernier = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  });
}

function initModaleVideo() {
  const galerie = el('#galerie-video');
  if (!galerie) return;

  const modale     = el('#modale-video');
  const lecteur    = el('#modale-video-lecteur');
  const elTitre    = el('#modale-video-titre');
  const elDesc     = el('#modale-video-description');
  const btnFermer  = el('#modale-video-fermer');

  if (!modale) return;

  let dernierFocus = null;

  function ouvrir(carte) {
    dernierFocus = carte;
    const { type, src, titre = '', description = '' } = carte.dataset;
    elTitre.textContent = titre;
    elDesc.textContent  = description;
    lecteur.innerHTML   = '';

    if (type === 'youtube') {
      const iframe = document.createElement('iframe');
      iframe.src             = `https://www.youtube-nocookie.com/embed/${src}?autoplay=1&rel=0&modestbranding=1`;
      iframe.allow           = 'autoplay; encrypted-media; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title           = titre;
      lecteur.appendChild(iframe);
    } else {
      const video = document.createElement('video');
      video.src      = src;
      video.controls = true;
      video.autoplay = true;
      video.title    = titre;
      lecteur.appendChild(video);
    }

    modale.classList.add('ouverte');
    modale.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    btnFermer.focus();
  }

  function fermer() {
    modale.classList.remove('ouverte');
    modale.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { lecteur.innerHTML = ''; }, 400);
    if (dernierFocus) dernierFocus.focus();
  }

  els('.carte-video', galerie).forEach(carte => {
    carte.setAttribute('tabindex', '0');
    carte.setAttribute('role', 'button');
    carte.setAttribute('aria-label', `Lire la video ${carte.dataset.titre}`);
    carte.addEventListener('click', () => ouvrir(carte));
    carte.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ouvrir(carte); }
    });
  });

  btnFermer.addEventListener('click', fermer);
  modale.addEventListener('click', e => { if (e.target === modale) fermer(); });
  document.addEventListener('keydown', e => {
    if (modale.classList.contains('ouverte') && e.key === 'Escape') fermer();
  });
}

function initAjoutRapide() {
  const btnToggle  = el('#ajout-rapide-toggle');
  const panneau    = el('#ajout-rapide-panneau');
  if (!btnToggle || !panneau) return;

  const btnFermer      = el('#ajout-rapide-fermer');
  const btnSoumettre   = el('#ajout-soumettre');
  const btnExporter    = el('#ajout-exporter');
  const hint           = el('#ajout-hint');
  const modaleExport   = el('#modale-export');
  const codeExport     = el('#modale-export-code');
  const btnFermerExport = el('#modale-export-fermer');
  const btnCopier      = el('#modale-export-copier');

  function ouvrirPanneau() {
    panneau.classList.add('ouvert');
    panneau.setAttribute('aria-hidden', 'false');
    btnToggle.setAttribute('aria-expanded', 'true');
    const premier = panneau.querySelector('input, textarea, button');
    if (premier) premier.focus();
  }

  function fermerPanneau() {
    panneau.classList.remove('ouvert');
    panneau.setAttribute('aria-hidden', 'true');
    btnToggle.setAttribute('aria-expanded', 'false');
    btnToggle.focus();
  }

  function extraireIdYoutube(saisie) {
    saisie = (saisie || '').trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(saisie)) return saisie;
    const court = saisie.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (court) return court[1];
    const long = saisie.match(/(?:v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return long ? long[1] : null;
  }

  function lireFormulaire() {
    return {
      url:         el('#ajout-url').value,
      titre:       el('#ajout-titre').value.trim(),
      badge:       el('#ajout-badge').value.trim(),
      tag:         el('#ajout-tag').value.trim(),
      description: el('#ajout-description').value.trim(),
    };
  }

  // Échappe les caractères spéciaux pour une injection sûre dans les attributs HTML.
  function echapperAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function construireCarte(ytId, titre, badge, tag, description) {
    const titreAffiche = titre || 'Sans titre';
    const article = document.createElement('article');
    article.className        = 'carte-video apparition';
    article.dataset.type        = 'youtube';
    article.dataset.src         = ytId;
    article.dataset.titre       = titreAffiche;
    article.dataset.description = description || '';
    article.innerHTML = `
      <div class="carte-video__miniature">
        <img src="https://img.youtube.com/vi/${ytId}/maxresdefault.jpg" alt="Miniature de la vidéo : ${echapperAttr(titreAffiche)}" loading="lazy" width="1280" height="720" />
        <div class="carte-video__lecture" aria-hidden="true"><span>&#9654;</span></div>
        <span class="carte-video__badge">${echapperAttr(badge || 'Vidéo')}</span>
      </div>
      <div class="carte-video__meta">
        <h2 class="carte-video__titre">${echapperAttr(titreAffiche)}</h2>
        <p class="carte-video__categorie">${echapperAttr(tag || '')}</p>
      </div>`;
    return article;
  }

  function construireSnippetHtml(ytId, titre, badge, tag, description) {
    const titreAffiche = echapperAttr(titre || 'Sans titre');
    const badgeAffiche = echapperAttr(badge || 'Vidéo');
    const tagAffiche   = echapperAttr(tag   || '');
    const descAffiche  = echapperAttr(description || '');
    return (
      `<article class="carte-video apparition"\n` +
      `  data-type="youtube"\n` +
      `  data-src="${ytId}"\n` +
      `  data-titre="${titreAffiche}"\n` +
      `  data-description="${descAffiche}"\n` +
      `>\n` +
      `  <div class="carte-video__miniature">\n` +
      `    <img src="https://img.youtube.com/vi/${ytId}/maxresdefault.jpg" alt="Miniature de la vidéo : ${titreAffiche}" loading="lazy" width="1280" height="720" />\n` +
      `    <div class="carte-video__lecture" aria-hidden="true"><span>&#9654;</span></div>\n` +
      `    <span class="carte-video__badge">${badgeAffiche}</span>\n` +
      `  </div>\n` +
      `  <div class="carte-video__meta">\n` +
      `    <h2 class="carte-video__titre">${titreAffiche}</h2>\n` +
      `    <p class="carte-video__categorie">${tagAffiche}</p>\n` +
      `  </div>\n` +
      `</article>`
    );
  }

  btnToggle.addEventListener('click', () => panneau.classList.contains('ouvert') ? fermerPanneau() : ouvrirPanneau());
  btnFermer.addEventListener('click', fermerPanneau);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panneau.classList.contains('ouvert')) fermerPanneau();
  });

  btnSoumettre.addEventListener('click', () => {
    const { url, titre, badge, tag, description } = lireFormulaire();
    const ytId = extraireIdYoutube(url);
    if (!ytId) {
      hint.textContent = 'Lien YouTube invalide.';
      hint.className   = 'ajout-rapide-panneau__hint erreur';
      return;
    }
    const galerie = el('#galerie-video');
    const carte   = construireCarte(ytId, titre, badge, tag, description);
    galerie.appendChild(carte);

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.15 });
    obs.observe(carte);

    carte.setAttribute('tabindex', '0');
    carte.setAttribute('role', 'button');
    carte.setAttribute('aria-label', `Lire la video ${titre}`);
    carte.addEventListener('click', () => {
      const modaleVideo = el('#modale-video');
      if (modaleVideo) modaleVideo.dispatchEvent(new CustomEvent('ouvrir-carte', { detail: carte }));
    });

    hint.textContent = 'Video ajoutee a la galerie.';
    hint.className   = 'ajout-rapide-panneau__hint';
    el('#ajout-url').value = '';
  });

  btnExporter.addEventListener('click', () => {
    const { url, titre, badge, tag, description } = lireFormulaire();
    const ytId = extraireIdYoutube(url);
    if (!ytId) {
      hint.textContent = 'Lien YouTube invalide.';
      hint.className   = 'ajout-rapide-panneau__hint erreur';
      return;
    }
    codeExport.textContent = construireSnippetHtml(ytId, titre, badge, tag, description);
    modaleExport.classList.add('ouverte');
    modaleExport.setAttribute('aria-hidden', 'false');
  });

  btnFermerExport.addEventListener('click', () => {
    modaleExport.classList.remove('ouverte');
    modaleExport.setAttribute('aria-hidden', 'true');
  });

  modaleExport.addEventListener('click', e => {
    if (e.target === modaleExport) {
      modaleExport.classList.remove('ouverte');
      modaleExport.setAttribute('aria-hidden', 'true');
    }
  });

  btnCopier.addEventListener('click', () => {
    navigator.clipboard.writeText(codeExport.textContent).then(() => {
      btnCopier.textContent = 'Copie !';
      setTimeout(() => { btnCopier.textContent = 'Copier'; }, 2000);
    });
  });
}

function initIndicateurScroll() {
  const indicateur = el('#indicateur-scroll');
  if (!indicateur) return;
  window.addEventListener('scroll', () => {
    indicateur.classList.toggle('cache', window.scrollY > 80);
  }, { passive: true });
}

function initFormulaireContact() {
  const formulaire = el('#formulaire-contact');
  if (!formulaire) return;
  formulaire.addEventListener('submit', e => {
    e.preventDefault();
    const nom     = el('#contact-nom').value.trim();
    const email   = el('#contact-email').value.trim();
    const sujet   = el('#contact-sujet').value.trim();
    const message = el('#contact-message').value.trim();
    if (!nom || !email || !sujet || !message) return;
    const corps  = `Bonjour Enzo,\n\nVous avez recu un message de ${nom} (${email}) :\n\n${message}\n\nEnvoye depuis votre portfolio.`;
    const mailto = `mailto:efontenier@gmail.com?subject=${encodeURIComponent(sujet)}&body=${encodeURIComponent(corps)}`;
    window.location.href = mailto;
  });
}

// Avec `defer`, le DOM est garanti prêt à l'exécution du script :
// inutile d'attendre l'événement DOMContentLoaded.
initNavigation();
initApparition();
initTiroir();
initModaleVideo();
initAjoutRapide();
initIndicateurScroll();
initFormulaireContact();
