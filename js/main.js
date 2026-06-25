/* =========================================================
   AXIA.AI — Deck horizontal · navegación de slides
   ========================================================= */
(function () {
  'use strict';

  var track   = document.getElementById('track');
  var slides   = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var prevBtn  = document.getElementById('prevBtn');
  var nextBtn  = document.getElementById('nextBtn');
  var dotsWrap = document.getElementById('dots');
  var curEl    = document.getElementById('cur');
  var totalEl  = document.getElementById('total');
  var progress = document.getElementById('progressBar');
  var hint     = document.getElementById('hint');
  var menu     = document.getElementById('mobileMenu');
  var toggle   = document.getElementById('navToggle');

  var index = 0;
  var count = slides.length;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pad(n) { return String(n).padStart(2, '0'); }

  /* ---- Theme toggle (light / dark) ---- */
  var root = document.documentElement;
  // enable cross-fade transitions only after first paint
  requestAnimationFrame(function () { root.classList.add('theme-ready'); });

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('axia-theme', theme); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f7fb' : '#0a0a0f');
  }
  function toggleTheme() {
    setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  }
  var tt = document.getElementById('themeToggle');
  var ttm = document.getElementById('themeToggleMobile');
  if (tt) tt.addEventListener('click', toggleTheme);
  if (ttm) ttm.addEventListener('click', toggleTheme);

  /* ---- Lucide icons (CDN loads async) ---- */
  function initIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
  }
  if (document.readyState !== 'loading') initIcons();
  else document.addEventListener('DOMContentLoaded', initIcons);
  window.addEventListener('load', initIcons);

  /* ---- Build dots ---- */
  var dots = [];
  for (var i = 0; i < count; i++) {
    var d = document.createElement('button');
    d.className = 'dot';
    d.setAttribute('role', 'tab');
    d.setAttribute('aria-label', 'Slide ' + (i + 1) + ' · ' + (slides[i].dataset.label || ''));
    (function (idx) { d.addEventListener('click', function () { goTo(idx); }); })(i);
    dotsWrap.appendChild(d);
    dots.push(d);
  }
  if (totalEl) totalEl.textContent = pad(count);

  /* ---- Core navigation ---- */
  function render() {
    track.style.transform = 'translateX(' + (-index * 100) + 'vw)';
    for (var i = 0; i < count; i++) {
      slides[i].classList.toggle('is-active', i === index);
      slides[i].setAttribute('aria-hidden', i === index ? 'false' : 'true');
      dots[i].classList.toggle('active', i === index);
    }
    if (curEl) curEl.textContent = pad(index + 1);
    if (progress) progress.style.width = ((index + 1) / count * 100) + '%';
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === count - 1;
    // reset internal scroll of the active slide
    slides[index].scrollTop = 0;
  }

  function goTo(i) {
    var clamped = Math.max(0, Math.min(count - 1, i));
    if (clamped === index) return;
    index = clamped;
    render();
    hideHint();
  }
  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  if (nextBtn) nextBtn.addEventListener('click', next);
  if (prevBtn) prevBtn.addEventListener('click', prev);

  /* ---- data-goto triggers (nav links, CTAs, brand) ---- */
  document.querySelectorAll('[data-goto]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      goTo(parseInt(el.dataset.goto, 10) || 0);
      closeMenu();
    });
  });

  /* ---- Keyboard ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); }
    else if (e.key === 'End') { e.preventDefault(); goTo(count - 1); }
  });

  /* ---- Wheel: advance on horizontal / vertical intent (debounced) ---- */
  var wheelLock = false;
  window.addEventListener('wheel', function (e) {
    var active = slides[index];
    // let the slide scroll internally if its content overflows vertically
    var canScroll = active.scrollHeight > active.clientHeight + 2;
    var delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (canScroll && Math.abs(e.deltaX) < Math.abs(e.deltaY)) return; // vertical scroll inside slide
    if (Math.abs(delta) < 18 || wheelLock) return;
    wheelLock = true;
    if (delta > 0) next(); else prev();
    setTimeout(function () { wheelLock = false; }, 720);
  }, { passive: true });

  /* ---- Touch swipe ---- */
  var startX = 0, startY = 0, touching = false, noSwipe = false;
  window.addEventListener('touchstart', function (e) {
    startX = e.touches[0].clientX; startY = e.touches[0].clientY; touching = true;
    // don't hijack swipes that start inside an interactive/scrollable widget
    noSwipe = !!(e.target.closest && e.target.closest('[data-noswipe]'));
  }, { passive: true });
  window.addEventListener('touchend', function (e) {
    if (!touching) return; touching = false;
    if (noSwipe) return;
    var dx = e.changedTouches[0].clientX - startX;
    var dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
  }, { passive: true });

  /* ---- Mobile menu ---- */
  function closeMenu() {
    if (!menu) return;
    menu.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeMenu();
    render(); // keep transform aligned (vw based, but force consistency)
  });

  /* ---- Hint ---- */
  var hintHidden = false;
  function hideHint() {
    if (hintHidden || !hint) return;
    hint.classList.add('hidden'); hintHidden = true;
  }
  setTimeout(hideHint, 6000);

  /* ---- init ---- */
  render();

  /* =========================================================
     Diseñador de Informes — drag & drop builder
     ========================================================= */
  (function initBuilder() {
    var builder = document.getElementById('builder');
    if (!builder) return;

    // Mock data model — dimensiones e indicadores (datos ficticios pero coherentes)
    var DIMS = {
      'Mes':          ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo'],
      'Aseguradora':  ['La Segunda', 'Triunfo', 'Qualia'],
      'Producto':     ['Auto', 'Hogar', 'Vida', 'Moto'],
      'Sucursal':     ['Centro', 'Norte', 'Sur'],
      'Operador':     ['Diego F.', 'Ana M.', 'Luis R.']
    };
    var INDS = {
      'Comisión':      { type: 'money', base: 0.4, range: 1.6 },
      'Prima Anual':   { type: 'money', base: 6,   range: 18 },
      '% Comisión':    { type: 'pct',   base: 8,   range: 14 },
      'Nº de Pólizas': { type: 'int',   base: 40,  range: 880 }
    };
    // deterministic 0..1 from a string (FNV-1a) so cells are stable per combination
    function seed(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967295; }
    function fmt(type, n) {
      if (type === 'money') return '$' + n.toFixed(1).replace('.', ',') + 'M';
      if (type === 'pct')   return n.toFixed(1).replace('.', ',') + '%';
      return Math.round(n).toLocaleString('es-AR');
    }
    function cellVal(r, c, ind) { var cfg = INDS[ind]; return cfg.base + seed(r + '|' + c + '|' + ind) * cfg.range; }

    var filasZone = builder.querySelector('.dropzone.filas');
    var colsZone  = builder.querySelector('.dropzone.columnas');
    var datosZone = builder.querySelector('.dropzone.datos');
    var table  = builder.querySelector('.bd-table');
    var thead  = table.querySelector('thead');
    var tbody  = table.querySelector('tbody');
    var rcount = builder.querySelector('.rcount');

    function tokenOf(zone) { var t = zone.querySelector('.dz-token'); return t ? t.getAttribute('data-label') : null; }

    function render() {
      var ind = tokenOf(datosZone);
      builder.classList.toggle('ready', !!ind);
      datosZone.classList.toggle('empty', !ind);
      if (!ind) { thead.innerHTML = ''; tbody.innerHTML = ''; return; }
      var cfg = INDS[ind];
      var rowDim = tokenOf(filasZone), colDim = tokenOf(colsZone);
      var rowVals = rowDim ? DIMS[rowDim] : ['Total'];
      var colVals = colDim ? DIMS[colDim] : null;

      var h = '<tr><th>' + (rowDim || '') + '</th>';
      if (colVals) { colVals.forEach(function (c) { h += '<th>' + c + '</th>'; }); h += '<th>Total</th>'; }
      else { h += '<th>' + ind + '</th>'; }
      thead.innerHTML = h + '</tr>';

      var b = '';
      rowVals.forEach(function (r) {
        b += '<tr><td>' + r + '</td>';
        if (colVals) {
          var sum = 0;
          colVals.forEach(function (c) { var v = cellVal(r, c, ind); sum += v; b += '<td>' + fmt(cfg.type, v) + '</td>'; });
          var tot = cfg.type === 'pct' ? sum / colVals.length : sum;
          b += '<td class="tot">' + fmt(cfg.type, tot) + '</td>';
        } else {
          b += '<td class="tot">' + fmt(cfg.type, cellVal(r, '', ind)) + '</td>';
        }
        b += '</tr>';
      });
      tbody.innerHTML = b;

      var procesadas = 120 + Math.round(seed(ind + (rowDim || '') + (colDim || '')) * 320);
      if (rcount) rcount.textContent = rowVals.length + ' fila' + (rowVals.length > 1 ? 's' : '') + ' · ' + procesadas.toLocaleString('es-AR') + ' pólizas procesadas';
    }

    // one token per zone: dropping/clicking a new one replaces the previous
    function setToken(zone, label, type) {
      if (!zone) return;
      var prev = zone.querySelector('.dz-token');
      if (prev) {
        var pc = builder.querySelector('.dz-chip[data-label="' + prev.getAttribute('data-label') + '"]');
        if (pc) pc.classList.remove('used');
        prev.remove();
      }
      var t = document.createElement('span');
      t.className = 'dz-token' + (type === 'ind' ? ' ind' : '');
      t.setAttribute('data-label', label);
      var lbl = document.createElement('span'); lbl.textContent = label;
      var x = document.createElement('span'); x.className = 'x'; x.textContent = '×';
      t.appendChild(lbl); t.appendChild(x);
      zone.querySelector('.dz-tokens').appendChild(t);
      var chip = builder.querySelector('.dz-chip[data-label="' + label + '"]');
      if (chip) chip.classList.add('used');
      x.addEventListener('click', function () { t.remove(); if (chip) chip.classList.remove('used'); render(); });
      render();
    }

    function zoneAccepts(zone) { return zone.classList.contains('datos') ? 'ind' : 'attr'; }

    // chips: drag (desktop) + click/tap (any device)
    builder.querySelectorAll('.dz-chip').forEach(function (chip) {
      chip.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ label: chip.dataset.label, type: chip.dataset.type }));
        e.dataTransfer.effectAllowed = 'copy';
      });
      chip.addEventListener('click', function () {
        if (chip.classList.contains('used')) return;
        var z;
        if (chip.dataset.type === 'ind') z = datosZone;
        else z = tokenOf(filasZone) ? (tokenOf(colsZone) ? filasZone : colsZone) : filasZone;
        setToken(z, chip.dataset.label, chip.dataset.type);
      });
    });

    // zones accept matching drops only
    builder.querySelectorAll('.dropzone').forEach(function (z) {
      z.addEventListener('dragover', function (e) { e.preventDefault(); z.classList.add('over'); });
      z.addEventListener('dragleave', function () { z.classList.remove('over'); });
      z.addEventListener('drop', function (e) {
        e.preventDefault(); z.classList.remove('over');
        try {
          var d = JSON.parse(e.dataTransfer.getData('text/plain'));
          if (d.type === zoneAccepts(z)) setToken(z, d.label, d.type);
        } catch (err) {}
      });
    });

    // prefill a complete, working report so it looks alive on load (and on mobile)
    setToken(filasZone, 'Mes', 'attr');
    setToken(colsZone, 'Aseguradora', 'attr');
    setToken(datosZone, 'Comisión', 'ind');

    /* ---------- Export flow (dropdown + preview screen) ---------- */
    var stage    = document.getElementById('bdStage');
    var exportBtn  = document.getElementById('exportBtn');
    var exportMenu = document.getElementById('exportMenu');
    var bdExport   = document.getElementById('bdExport');
    if (stage && exportBtn && exportMenu) {
      var bdTitle    = document.getElementById('bdTitle');
      var pvTitle    = document.getElementById('pvTitle');
      var pvMeta     = document.getElementById('pvMeta');
      var pvTable    = document.getElementById('pvTable');
      var pvDest     = document.getElementById('pvDest');
      var pvDestSpan = pvDest.querySelector('span');
      var pvFmt      = document.getElementById('pvFmt');
      var pvLayout   = document.getElementById('pvLayoutRow');
      var pvPages    = document.getElementById('pvPagesLabel');
      var bdPage     = document.getElementById('bdPage');
      var saveLabel  = document.getElementById('exportSaveLabel');
      var toast      = document.getElementById('bdToast');
      var toastMsg   = document.getElementById('bdToastMsg');

      var FMT = {
        'pdf':     { dest: 'Guardar como PDF', fmt: 'PDF (.pdf)',               excel: false, layout: true,  save: 'Guardar',   toast: 'PDF generado' },
        'excel-f': { dest: 'Microsoft Excel',  fmt: 'Excel con formato (.xlsx)', excel: true,  layout: false, save: 'Descargar', toast: 'Excel con formato descargado' },
        'excel-p': { dest: 'Microsoft Excel',  fmt: 'Excel sin formato (.xlsx)', excel: true,  layout: false, save: 'Descargar', toast: 'Excel descargado' }
      };
      var pendingToast = '';

      function reportData() {
        var ind = tokenOf(datosZone);
        if (!ind) return null;
        var rowDim = tokenOf(filasZone), colDim = tokenOf(colsZone);
        return { ind: ind, cfg: INDS[ind], rowDim: rowDim, colDim: colDim,
                 rowVals: rowDim ? DIMS[rowDim] : ['Total'], colVals: colDim ? DIMS[colDim] : null };
      }

      function renderPreview() {
        var thP = pvTable.querySelector('thead'), tbP = pvTable.querySelector('tbody');
        var d = reportData();
        if (!d) { thP.innerHTML = ''; tbP.innerHTML = '<tr><td>Seleccioná un indicador en el constructor.</td></tr>'; return; }
        var cfg = d.cfg, avg = cfg.type === 'pct';
        var h = '<tr><th>' + (d.rowDim || 'Total') + '</th>';
        if (d.colVals) { d.colVals.forEach(function (c) { h += '<th>' + c + '</th>'; }); h += '<th>Total</th>'; }
        else { h += '<th>' + d.ind + '</th>'; }
        thP.innerHTML = h + '</tr>';

        var colSums = (d.colVals || ['_']).map(function () { return 0; });
        var grand = 0, b = '';
        d.rowVals.forEach(function (r) {
          b += '<tr><td>' + r + '</td>';
          if (d.colVals) {
            var sum = 0;
            d.colVals.forEach(function (c, ci) { var v = cellVal(r, c, d.ind); sum += v; colSums[ci] += v; b += '<td>' + fmt(cfg.type, v) + '</td>'; });
            var tot = avg ? sum / d.colVals.length : sum; grand += tot;
            b += '<td class="tot">' + fmt(cfg.type, tot) + '</td>';
          } else {
            var v = cellVal(r, '', d.ind); colSums[0] += v;
            b += '<td class="tot">' + fmt(cfg.type, v) + '</td>';
          }
          b += '</tr>';
        });
        var g = '<tr class="grand"><td>Total general</td>';
        if (d.colVals) {
          d.colVals.forEach(function (c, ci) { g += '<td>' + fmt(cfg.type, avg ? colSums[ci] / d.rowVals.length : colSums[ci]) + '</td>'; });
          g += '<td>' + fmt(cfg.type, avg ? grand / d.rowVals.length : grand) + '</td>';
        } else {
          g += '<td>' + fmt(cfg.type, avg ? colSums[0] / d.rowVals.length : colSums[0]) + '</td>';
        }
        tbP.innerHTML = b + g + '</tr>';
      }

      function closeMenu() { exportMenu.classList.remove('open'); exportBtn.setAttribute('aria-expanded', 'false'); }

      function openExport(key) {
        var c = FMT[key] || FMT.pdf;
        var title = (bdTitle.textContent || 'Informe sin título').trim();
        pvTitle.textContent = 'Axia · ' + title;
        var d = reportData();
        var proc = d ? (120 + Math.round(seed(d.ind + (d.rowDim || '') + (d.colDim || '')) * 320)) : 0;
        pvMeta.textContent = 'Administrador de Seguros — Informe de Producción · ' + new Date().toLocaleDateString('es-AR') + ' · ' + proc.toLocaleString('es-AR') + ' registros procesados';
        pvDestSpan.textContent = c.dest;
        pvFmt.textContent = c.fmt;
        pvLayout.style.display = c.layout ? '' : 'none';
        pvPages.textContent = c.excel ? 'Hojas' : 'Páginas';
        saveLabel.textContent = c.save;
        bdPage.classList.toggle('is-excel', c.excel);
        bdPage.classList.toggle('is-pdf', !c.excel);
        pendingToast = c.toast;
        renderPreview();
        closeMenu();
        if (bdExport) bdExport.hidden = false;
        stage.classList.add('exporting');
      }

      function closeExport() { stage.classList.remove('exporting'); if (bdExport) bdExport.hidden = true; }

      var toastTimer, toastTimer2;
      function showToast(msg) {
        if (!toast) return;
        toastMsg.textContent = msg;
        toast.hidden = false;
        // force reflow so the show transition runs after unhiding
        void toast.offsetWidth;
        toast.classList.add('show');
        clearTimeout(toastTimer); clearTimeout(toastTimer2);
        toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
        toastTimer2 = setTimeout(function () { toast.hidden = true; }, 2950);
      }

      exportBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = exportMenu.classList.toggle('open');
        exportBtn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', function (e) {
        if (!exportMenu.contains(e.target) && e.target !== exportBtn) closeMenu();
      });
      exportMenu.querySelectorAll('.bd-menu-item').forEach(function (it) {
        it.addEventListener('click', function () { openExport(it.dataset.fmt); });
      });
      var closeBtn = document.getElementById('exportClose');
      var cancelBtn = document.getElementById('exportCancel');
      var saveBtn = document.getElementById('exportSave');
      if (closeBtn)  closeBtn.addEventListener('click', closeExport);
      if (cancelBtn) cancelBtn.addEventListener('click', closeExport);
      if (saveBtn)   saveBtn.addEventListener('click', function () { closeExport(); showToast(pendingToast); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); closeExport(); } });
    }
  })();

  /* =========================================================
     Pipeline CRM — Kanban interactivo (estilo Kommo)
     ========================================================= */
  (function initPipeline() {
    var kanban = document.getElementById('kanban');
    var stageEl = document.getElementById('kanbanStage');
    if (!kanban || !stageEl) return;

    var STAGES = ['Prospecto', 'Contactado', 'Cotizado', 'Negociación', 'Ganado'];
    var PROB = [10, 30, 55, 75, 100];
    var DATA = [
      { name: 'Andrés Reyes',     prod: 'Accidentes Personales', amount: 3000, aseg: 'Qualia Seguros',  op: 'Valentina Torres', fecha: '2025-04-21', stage: 0 },
      { name: 'Carmen Moreno',    prod: 'Robo en Cajero',        amount: 814,  aseg: 'Qualia Seguros',  op: 'Valentina Torres', fecha: '2025-03-14', stage: 0 },
      { name: 'Beatriz Suárez',   prod: 'Robo en Cajero',        amount: 1718, aseg: 'La Segunda',      op: 'Sebastián López',  fecha: '2025-05-08', stage: 1 },
      { name: 'Adriana Peña',     prod: 'Robo en Cajero',        amount: 3165, aseg: 'Triunfo Seguros', op: 'Valentina Torres', fecha: '2025-04-28', stage: 1 },
      { name: 'Fernando Ríos',    prod: 'Robo en Cajero',        amount: 2869, aseg: 'La Segunda',      op: 'Diego Fernández',  fecha: '2025-04-05', stage: 2 },
      { name: 'Juan Martínez',    prod: 'Robo en Cajero',        amount: 5428, aseg: 'La Segunda',      op: 'Laura Méndez',     fecha: '2025-05-02', stage: 2 },
      { name: 'Miguel González',  prod: 'Seguro de Hogar',       amount: 3616, aseg: 'Triunfo Seguros', op: 'Matías Gómez',     fecha: '2025-04-09', stage: 3 },
      { name: 'Francisco Torres', prod: 'Seguro de Hogar',       amount: 1762, aseg: 'Qualia Seguros',  op: 'Camila Ruiz',      fecha: '2025-06-04', stage: 4 },
      { name: 'Pedro Sánchez',    prod: 'Seguro de Vida',        amount: 3643, aseg: 'Qualia Seguros',  op: 'Laura Méndez',     fecha: '2025-04-27', stage: 4 }
    ];
    var LOST = 3;
    var AVC = ['#7c3aed', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'];
    function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
    function avColor(s) { return AVC[hash(s) % AVC.length]; }
    function initials(n) { var p = n.split(' '); return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase(); }
    function money(n) { return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function kfmt(n) { return '$ ' + Math.round(n).toLocaleString('es-AR'); }

    var CHEV_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
    var CHEV_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
    var CHECK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

    var cols = Array.prototype.slice.call(kanban.querySelectorAll('.kcol'));
    var elOpen = document.getElementById('kOpen'), elW = document.getElementById('kWeighted'),
        elWon = document.getElementById('kWon'), elRate = document.getElementById('kRate');

    function updateKpis() {
      var open = 0, won = 0, weighted = 0;
      DATA.forEach(function (o) {
        if (o.stage < 4) { open++; weighted += o.amount * PROB[o.stage] / 100; }
        else won++;
      });
      if (elOpen) elOpen.textContent = open;
      if (elW) elW.textContent = kfmt(weighted);
      if (elWon) elWon.textContent = won;
      if (elRate) elRate.textContent = Math.round(won / (won + LOST) * 100) + '%';
    }

    function makeCard(o, idx) {
      var card = document.createElement('div');
      card.className = 'kcard' + (o.featured ? ' featured' : '');
      card.setAttribute('draggable', 'true');
      card.dataset.idx = idx;
      var s = o.stage;
      card.innerHTML =
        '<div class="kcard-top">' +
          '<div class="kc-avatar" style="background:' + avColor(o.name) + '">' + initials(o.name) + '</div>' +
          '<div><div class="kc-name">' + o.name + '</div><div class="kc-prod">' + o.prod + '</div></div>' +
        '</div>' +
        '<div class="kc-mid"><span class="kc-amount">' + money(o.amount) + '</span><span class="kc-prob p' + s + '">' + PROB[s] + '%</span></div>' +
        '<div class="kc-meta">' + o.aseg + ' · ' + o.op + '<span class="act">Últ. actividad: ' + o.fecha + '</span></div>' +
        '<div class="kc-nav">' +
          '<button class="kc-arrow prev" ' + (s === 0 ? 'disabled' : '') + ' aria-label="Retroceder etapa">' + CHEV_L + '</button>' +
          '<button class="kc-arrow next" ' + (s === 4 ? 'disabled' : '') + ' aria-label="Avanzar etapa">' + CHEV_R + '</button>' +
          (s === 4 ? '<span class="kc-won">' + CHECK + ' Ganada</span>' : '') +
        '</div>';

      card.querySelector('.prev').addEventListener('click', function () { moveTo(idx, o.stage - 1); });
      card.querySelector('.next').addEventListener('click', function () { moveTo(idx, o.stage + 1); });
      card.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', String(idx));
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', function () { card.classList.remove('dragging'); });
      return card;
    }

    function render(movedIdx) {
      cols.forEach(function (c) { c.querySelector('.kcards').innerHTML = ''; });
      DATA.forEach(function (o, idx) {
        cols[o.stage].querySelector('.kcards').appendChild(makeCard(o, idx));
      });
      cols.forEach(function (c) {
        var n = c.querySelectorAll('.kcard').length;
        c.querySelector('.kcount').textContent = n;
      });
      updateKpis();
      if (movedIdx != null) {
        var m = kanban.querySelector('.kcard[data-idx="' + movedIdx + '"]');
        if (m) m.classList.add('justmoved');
      }
    }

    function moveTo(idx, stage) {
      stage = Math.max(0, Math.min(4, stage));
      if (DATA[idx].stage === stage) return;
      DATA[idx].stage = stage;
      render(idx);
    }

    // drag & drop onto columns
    cols.forEach(function (c) {
      c.addEventListener('dragover', function (e) { e.preventDefault(); c.classList.add('over'); });
      c.addEventListener('dragleave', function () { c.classList.remove('over'); });
      c.addEventListener('drop', function (e) {
        e.preventDefault(); c.classList.remove('over');
        var idx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(idx)) moveTo(idx, parseInt(c.dataset.stage, 10));
      });
    });

    render();
  })();

  /* =========================================================
     Solicitud digital — formulario interactivo multi-paso
     ========================================================= */
  (function initSolicitud() {
    var root = document.getElementById('solic');
    if (!root) return;

    function svg(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>'; }
    var ICN = {
      vida:   svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
      hogar:  svg('<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'),
      ap:     svg('<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>'),
      cajero: svg('<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>'),
      bici:   svg('<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>'),
      moto:   svg('<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M15 16.5h-4l-2.5-4.5"/><path d="M5.5 16.5l2.5-4.5h6l1.5 2.5h2.5"/><path d="M12.5 12V9.5h3"/>')
    };
    var PRODS = [
      { slug: 'vida',   icon: ICN.vida,   nombre: 'Seguro de Vida',        prima: 'Desde $2.800/mes', aseg: ['La Segunda', 'Triunfo Seguros'], cob: ['Muerte por cualquier causa', 'Muerte accidental', 'Incapacidad total y permanente', 'Enfermedades graves'] },
      { slug: 'hogar',  icon: ICN.hogar,  nombre: 'Seguro de Hogar',       prima: 'Desde $3.200/mes', aseg: ['La Segunda', 'Qualia Seguros'],   cob: ['Incendio y rayo', 'Robo y hurto', 'Daño eléctrico', 'Daños por agua'] },
      { slug: 'ap',     icon: ICN.ap,     nombre: 'Accidentes Personales', prima: 'Desde $1.500/mes', aseg: ['Triunfo Seguros', 'Qualia Seguros'], cob: ['Muerte accidental', 'Incapacidad permanente', 'Gastos de curación', 'Renta diaria'] },
      { slug: 'cajero', icon: ICN.cajero, nombre: 'Robo en Cajero',        prima: 'Desde $480/mes',   aseg: ['La Segunda'],                     cob: ['Robo de efectivo', 'Daño o robo de tarjetas', 'Daños físicos', 'Asistencia psicológica'] },
      { slug: 'bici',   icon: ICN.bici,   nombre: 'Seguro de Bicicleta',   prima: 'Desde $890/mes',   aseg: ['Qualia Seguros'],                 cob: ['Robo total', 'Daños parciales', 'Responsabilidad civil', 'Accidentes del ciclista'] },
      { slug: 'moto',   icon: ICN.moto,   nombre: 'Seguro de Moto',        prima: 'Desde $4.100/mes', aseg: ['La Segunda', 'Triunfo Seguros'],  cob: ['Responsabilidad civil', 'Robo total y parcial', 'Daños parciales', 'Asistencia en ruta'] }
    ];
    var STEPS = ['producto', 'datos', 'detalle', 'confirmacion'];
    var META = [{ n: '1', l: 'Producto' }, { n: '2', l: 'Datos' }, { n: '3', l: 'Detalle' }, { n: '4', l: 'Confirmación' }];
    var CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>';

    var st = { step: 'producto', f: { prod: '', aseg: '', nombre: '', apellido: '', dni: '', email: '', telefono: '', localidad: 'Rosario', obs: '', terms: false } };
    function prod() { return PRODS.filter(function (p) { return p.slug === st.f.prod; })[0]; }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

    function field(label, key, ph, type) {
      return '<div class="sf-field"><label>' + label + '</label><input type="' + (type || 'text') + '" data-f="' + key + '" value="' + esc(st.f[key]) + '" placeholder="' + esc(ph || '') + '"></div>';
    }

    function stepper() {
      var idx = STEPS.indexOf(st.step);
      return '<div class="solic-steps">' + META.map(function (m, i) {
        var active = STEPS[i] === st.step, done = i < idx;
        var line = i < 3 ? '<div class="ss-line ' + (done ? 'done' : '') + '"></div>' : '';
        return '<div class="ss-item ' + (active ? 'active' : '') + ' ' + (done ? 'done' : '') + '">' +
          '<div class="ss-circle">' + (done ? CHK : m.n) + '</div><span class="ss-label">' + m.l + '</span></div>' + line;
      }).join('') + '</div>';
    }

    function sidebar(p) {
      if (!p) return '';
      var cob = p.cob.slice(0, 4).map(function (c) { return '<div class="sr-cob">' + CHK + ' ' + esc(c) + '</div>'; }).join('');
      return '<aside class="solic-side">' +
        '<div class="sr-head">Resumen</div>' +
        '<div class="sr-ico">' + p.icon + '</div>' +
        '<div class="sr-nombre">' + esc(p.nombre) + '</div>' +
        '<div class="sr-prima">' + esc(p.prima) + '</div>' +
        '<div class="sr-sep"></div>' + cob +
        '<div class="sr-sep"></div>' +
        '<div class="sr-help"><strong>¿Necesitás ayuda?</strong><a href="tel:08008883355">0800-888-3355</a></div>' +
        '</aside>';
    }

    function mainProducto() {
      var opts = PRODS.map(function (p) {
        return '<button class="sp-opt ' + (st.f.prod === p.slug ? 'sel' : '') + '" data-prod="' + p.slug + '">' +
          '<span class="sp-ico">' + p.icon + '</span><span class="sp-nombre">' + esc(p.nombre) + '</span><span class="sp-prima">' + esc(p.prima) + '</span></button>';
      }).join('');
      return '<div class="solic-main"><div class="solic-title">¿Qué seguro querés contratar?</div><div class="sp-grid">' + opts + '</div></div>';
    }

    function mainDatos() {
      return '<div class="solic-main">' +
        '<div class="solic-title">Datos personales</div>' +
        '<div class="sf-section"><div class="sf-sectitle">Información personal</div>' +
        '<div class="sf-row2">' + field('Nombre/s', 'nombre', 'Juan Carlos') + field('Apellido/s', 'apellido', 'García') + '</div>' +
        '<div class="sf-row2">' + field('DNI', 'dni', '28.456.789') + field('Localidad', 'localidad', 'Rosario') + '</div></div>' +
        '<div class="sf-section"><div class="sf-sectitle">Contacto</div>' +
        '<div class="sf-row2">' + field('Email', 'email', 'juan@ejemplo.com', 'email') + field('Teléfono', 'telefono', '0341-4xxxxxx') + '</div></div>' +
        '<div class="solic-nav"><button class="s-back" data-go="producto">← Atrás</button><div class="spacer"></div><button class="btn btn-primary btn-sm" data-go="detalle">Continuar →</button></div>' +
        '</div>';
    }

    function mainDetalle(p) {
      var aseg = p.aseg.map(function (a) { return '<button class="sa-opt ' + (st.f.aseg === a ? 'sel' : '') + '" data-aseg="' + esc(a) + '">' + esc(a) + '</button>'; }).join('');
      return '<div class="solic-main">' +
        '<div class="solic-title">Detalle de ' + esc(p.nombre) + '</div>' +
        '<div class="sf-section"><div class="sf-sectitle">Elegí la aseguradora</div><div class="sa-opts">' + aseg + '</div></div>' +
        '<div class="sf-section"><div class="sf-sectitle">Observaciones (opcional)</div>' +
        '<textarea rows="3" data-f="obs" placeholder="Información adicional relevante para tu solicitud...">' + esc(st.f.obs) + '</textarea></div>' +
        '<div class="solic-nav"><button class="s-back" data-go="datos">← Atrás</button><div class="spacer"></div><button class="btn btn-primary btn-sm" data-go="confirmacion">Continuar →</button></div>' +
        '</div>';
    }

    function mainConfirm(p) {
      var f = st.f;
      var aseg = f.aseg ? '<div class="sc-row"><span>Aseguradora</span><strong>' + esc(f.aseg) + '</strong></div>' : '';
      return '<div class="solic-main">' +
        '<div class="solic-title">Confirmá tu solicitud</div>' +
        '<div class="sc-box"><h4>Seguro seleccionado</h4>' +
        '<div class="sc-row"><span>Producto</span><strong>' + esc(p.nombre) + '</strong></div>' +
        '<div class="sc-row"><span>Prima estimada</span><strong>' + esc(p.prima) + '</strong></div>' + aseg + '</div>' +
        '<div class="sc-box"><h4>Tus datos</h4>' +
        '<div class="sc-row"><span>Nombre</span><strong>' + (esc(f.nombre) + ' ' + esc(f.apellido)).trim() + '</strong></div>' +
        '<div class="sc-row"><span>DNI</span><strong>' + (esc(f.dni) || '—') + '</strong></div>' +
        '<div class="sc-row"><span>Email</span><strong>' + (esc(f.email) || '—') + '</strong></div>' +
        '<div class="sc-row"><span>Teléfono</span><strong>' + (esc(f.telefono) || '—') + '</strong></div></div>' +
        '<label class="sc-terms"><input type="checkbox" data-f="terms" ' + (f.terms ? 'checked' : '') + '><span>Acepto los <a href="#" onclick="return false">Términos y Condiciones</a> y la <a href="#" onclick="return false">Política de Privacidad</a>. Autorizo el procesamiento de mis datos para la gestión del seguro.</span></label>' +
        '<div class="solic-nav"><button class="s-back" data-go="detalle">← Atrás</button><div class="spacer"></div><button class="btn btn-primary btn-sm" data-enviar ' + (f.terms ? '' : 'disabled') + '><i data-lucide="send"></i> Enviar solicitud</button></div>' +
        '</div>';
    }

    function enviado(p) {
      var ref = 'AXIA-' + Date.now().toString().slice(-8);
      return '<div class="solic-done">' +
        '<div class="sd-ico">' + CHK + '</div>' +
        '<h3>¡Solicitud enviada!</h3>' +
        '<p>Recibimos tu solicitud de <strong>' + esc(p ? p.nombre : '') + '</strong>. Un asesor se pondrá en contacto a la brevedad' + (st.f.email ? ' al email <strong>' + esc(st.f.email) + '</strong>' : '') + '.</p>' +
        '<div class="sd-ref"><span>N° de referencia</span><strong>' + ref + '</strong></div>' +
        '<button class="btn btn-ghost btn-sm" data-restart><i data-lucide="rotate-ccw"></i> Nueva solicitud</button>' +
        '</div>';
    }

    function render() {
      var p = prod();
      if (st.step === 'enviado') { root.innerHTML = enviado(p); }
      else {
        var main = st.step === 'producto' ? mainProducto()
                 : st.step === 'datos' ? mainDatos()
                 : st.step === 'detalle' && p ? mainDetalle(p)
                 : st.step === 'confirmacion' && p ? mainConfirm(p)
                 : mainProducto();
        var side = (st.step === 'producto' || !p) ? '' : sidebar(p);
        root.innerHTML = stepper() + '<div class="solic-body' + (side ? '' : ' single') + '" style="grid-template-columns:' + (side ? '1fr 250px' : '1fr') + '">' + main + side + '</div>';
      }
      if (window.lucide) window.lucide.createIcons();
      bind();
    }

    function go(step) { st.step = step; render(); }

    function bind() {
      root.querySelectorAll('[data-f]').forEach(function (el) {
        var k = el.getAttribute('data-f');
        var ev = el.type === 'checkbox' ? 'change' : 'input';
        el.addEventListener(ev, function () {
          st.f[k] = el.type === 'checkbox' ? el.checked : el.value;
          if (k === 'terms') { var b = root.querySelector('[data-enviar]'); if (b) b.disabled = !el.checked; }
        });
      });
      root.querySelectorAll('[data-prod]').forEach(function (el) {
        el.addEventListener('click', function () { st.f.prod = el.getAttribute('data-prod'); st.f.aseg = ''; go('datos'); });
      });
      root.querySelectorAll('[data-go]').forEach(function (el) {
        el.addEventListener('click', function () { go(el.getAttribute('data-go')); });
      });
      root.querySelectorAll('[data-aseg]').forEach(function (el) {
        el.addEventListener('click', function () { st.f.aseg = el.getAttribute('data-aseg'); render(); });
      });
      var env = root.querySelector('[data-enviar]');
      if (env) env.addEventListener('click', function () { if (st.f.terms) go('enviado'); });
      var rs = root.querySelector('[data-restart]');
      if (rs) rs.addEventListener('click', function () { st.step = 'producto'; st.f.prod = ''; st.f.aseg = ''; st.f.terms = false; render(); });
    }

    render();
  })();
})();
