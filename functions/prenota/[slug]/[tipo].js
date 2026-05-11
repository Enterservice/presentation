/**
 * Cloudflare Pages Function — route /prenota/<slug>/<tipo>
 *
 * Renderizza la pagina pubblica di prenotazione (calendario Calendly-like).
 * I file statici (index.html, lavora-con-noi.html, ecc.) sono serviti
 * direttamente dal layer Pages senza passare da qui.
 *
 * I dati (user, tipo, slot disponibili) vengono fetched lato client tramite
 * https://app.enterserviceholding.com/api/public/prenota/<slug>/<tipo>
 * (CORS aperto per enterserviceholding.com).
 */

export async function onRequest(context) {
  const { slug, tipo } = context.params;
  if (!/^[a-z0-9-]+$/.test(slug) || !/^[a-z0-9-]+$/.test(tipo)) {
    return new Response('Not found', { status: 404 });
  }
  return renderPrenotaPage(slug, tipo);
}

/**
 * Renderizza la pagina pubblica di prenotazione.
 * I dati (user, tipo, slot disponibili) vengono fetched lato client tramite
 * /api/public/prenota/:slug/:tipo (l'API ha CORS aperto per enterserviceholding.com).
 */
export function renderPrenotaPage(slug, tipo) {
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Prenota un appuntamento — Enterservice</title>
  <link rel="icon" type="image/svg+xml" href="/Images/icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap">
  <style>
    :root {
      --es-navy: #140C64;
      --es-yellow: #FBA800;
      --es-gray: #727476;
      --es-text: #2C2C2C;
      --es-bg-light: #F4F4F6;
      --es-yellow-light: #FFF8E7;
      --es-border: #CCCCCC;
      --es-green: #10B981;
      --es-red: #EF4444;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: var(--es-text);
      background: var(--es-bg-light);
      margin: 0; padding: 0;
      line-height: 1.55;
    }
    .container { max-width: 920px; margin: 0 auto; padding: 32px 20px; }
    h1, h2, h3 { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: var(--es-navy); margin: 0 0 4px; }
    h1 { font-size: 1.6rem; }
    h2 { font-size: 1.15rem; margin-top: 22px; margin-bottom: 12px; }
    .header {
      background: white;
      border-radius: 12px;
      padding: 24px 28px;
      box-shadow: 0 2px 8px rgba(20,12,100,.06);
      margin-bottom: 18px;
    }
    .header .meta { color: var(--es-gray); font-size: 0.95rem; margin-top: 6px; }
    .header .badge {
      display: inline-block; padding: 3px 10px;
      background: var(--es-yellow-light); color: var(--es-navy);
      border-radius: 999px; font-size: 0.78rem; font-weight: 700;
      margin-right: 8px; vertical-align: middle;
    }
    .layout { display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 800px) { .layout { grid-template-columns: 1fr 1fr; } }

    .card {
      background: white;
      border-radius: 12px;
      padding: 22px;
      box-shadow: 0 2px 8px rgba(20,12,100,.06);
    }

    /* Calendario */
    .cal-nav {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 12px;
    }
    .cal-nav button {
      background: var(--es-bg-light); border: 1px solid var(--es-border);
      border-radius: 6px; padding: 6px 12px; cursor: pointer;
      font-family: inherit; font-size: 0.9rem;
    }
    .cal-nav button:hover { border-color: var(--es-navy); }
    .cal-nav button:disabled { opacity: 0.4; cursor: not-allowed; }
    .cal-nav .month-label { font-weight: 600; color: var(--es-navy); }

    .cal-grid {
      display: grid; grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      font-size: 0.85rem;
    }
    .cal-dow { text-align: center; font-weight: 600; color: var(--es-gray); padding: 6px 0; font-size: 0.7rem; text-transform: uppercase; }
    .cal-day {
      aspect-ratio: 1;
      display: flex; align-items: center; justify-content: center;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      background: var(--es-bg-light);
      color: var(--es-text);
      border: 1px solid transparent;
      transition: all 0.1s;
    }
    .cal-day.empty { background: transparent; cursor: default; }
    .cal-day.unavailable { color: #d1d5db; cursor: not-allowed; background: transparent; }
    .cal-day.available { background: var(--es-yellow-light); color: var(--es-navy); font-weight: 600; }
    .cal-day.available:hover { background: var(--es-yellow); }
    .cal-day.selected { background: var(--es-navy); color: white; }
    .cal-day.today { border-color: var(--es-yellow); }

    /* Slot */
    .slots-wrap { min-height: 200px; }
    .slots-empty { color: var(--es-gray); font-size: 0.92rem; padding: 22px; text-align: center; }
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 6px; }
    .slot-btn {
      padding: 8px 12px;
      background: white;
      border: 1px solid var(--es-border);
      border-radius: 6px;
      cursor: pointer;
      font-family: inherit; font-size: 0.92rem; font-weight: 600;
      color: var(--es-navy);
    }
    .slot-btn:hover { background: var(--es-yellow-light); border-color: var(--es-yellow); }
    .slot-btn.selected { background: var(--es-navy); color: white; border-color: var(--es-navy); }

    /* Form */
    .field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
    .field label { font-size: 0.82rem; font-weight: 600; color: var(--es-text); }
    .field input, .field textarea {
      padding: 9px 12px;
      border: 1px solid var(--es-border);
      border-radius: 6px;
      font-family: inherit;
      font-size: 0.95rem;
    }
    .field input:focus, .field textarea:focus {
      outline: 2px solid var(--es-yellow);
      outline-offset: -1px;
      border-color: var(--es-yellow);
    }
    .field small { color: var(--es-gray); font-size: 0.75rem; }

    .submit-btn {
      width: 100%;
      padding: 12px 20px;
      background: var(--es-yellow);
      color: var(--es-navy);
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      font-family: inherit;
      margin-top: 8px;
    }
    .submit-btn:hover { filter: brightness(0.95); }
    .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 14px;
      font-size: 0.92rem;
    }
    .alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .alert.success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .alert.info { background: #dbeafe; color: #1e3a8a; border: 1px solid #93c5fd; }

    .recap {
      background: var(--es-yellow-light);
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.92rem;
      margin-bottom: 12px;
    }
    .recap strong { color: var(--es-navy); }

    .footer-info {
      text-align: center;
      color: var(--es-gray);
      font-size: 0.78rem;
      padding: 24px 0 12px;
    }
    .footer-info a { color: inherit; }

    /* Modalità badge */
    .mod-online { color: #1e40af; }
    .mod-presenza { color: #059669; }
    .mod-telefono { color: #b45309; }

    /* Spinner */
    .spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid rgba(20,12,100,.25);
      border-top-color: var(--es-navy);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .success-page {
      background: white; border-radius: 12px; padding: 40px 28px;
      text-align: center; box-shadow: 0 2px 8px rgba(20,12,100,.06);
    }
    .success-page .icon { font-size: 3rem; margin-bottom: 12px; }
    .success-page h2 { color: var(--es-green); margin-bottom: 8px; font-size: 1.5rem; }
  </style>
</head>
<body>

<div class="container">

  <div class="header" id="page-header">
    <div style="color:var(--es-gray);font-size:.9rem;"><span class="spinner"></span>Caricamento…</div>
  </div>

  <div id="root"></div>

  <div class="footer-info">
    Enterservice S.r.l.s. · Via Casilina 3, 00182 Roma · P.IVA 15795691003 · <a href="https://enterserviceholding.com">enterserviceholding.com</a>
  </div>
</div>

<script>
const SLUG = ${JSON.stringify(slug)};
const TIPO_SLUG = ${JSON.stringify(tipo)};
const API_URL = 'https://app.enterserviceholding.com/api/public/prenota/' + SLUG + '/' + TIPO_SLUG;

const GIORNI_ABBR = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MESI = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
              'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

const state = {
  data: null,        // dati API
  monthCursor: null, // {year, month}
  selectedDate: null,
  selectedSlot: null,
};

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadData() {
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Errore caricamento');
    state.data = json.data;
    initMonth();
    render();
  } catch (err) {
    document.getElementById('page-header').innerHTML = '<div class="alert error">❌ ' + escapeHtml(err.message) + '</div>';
  }
}

function initMonth() {
  // Trova primo mese con slot disponibili (o oggi)
  const dates = Object.keys(state.data.slots_per_data).sort();
  if (dates.length > 0) {
    const [y, m] = dates[0].split('-').map(n => parseInt(n, 10));
    state.monthCursor = { year: y, month: m - 1 };
  } else {
    const today = new Date();
    state.monthCursor = { year: today.getFullYear(), month: today.getMonth() };
  }
}

function render() {
  renderHeader();
  renderRoot();
}

function renderHeader() {
  const { user, tipo, benvenuto_md } = state.data;
  const modIcon = { online: '🎥', presenza: '🏢', telefono: '📞' }[tipo.modalita] || '📅';
  const modClass = 'mod-' + tipo.modalita;
  const luogoLine = (tipo.modalita === 'presenza' && tipo.luogo) ? \`<br><span style="color:var(--es-gray);">📍 \${escapeHtml(tipo.luogo)}</span>\` : '';
  document.getElementById('page-header').innerHTML = \`
    <div style="font-size:.78rem;color:var(--es-gray);margin-bottom:6px;">PRENOTA UN APPUNTAMENTO CON</div>
    <h1>\${escapeHtml(user.nome)}</h1>
    <div class="meta" style="margin-top:14px;">
      <span class="badge">\${modIcon} \${tipo.modalita.toUpperCase()}</span>
      <strong>\${escapeHtml(tipo.titolo)}</strong> · \${tipo.durata_min} min
      \${luogoLine}
    </div>
    \${tipo.descrizione_md ? \`<div style="margin-top:14px;color:var(--es-text);font-size:.92rem;line-height:1.6;">\${escapeHtml(tipo.descrizione_md)}</div>\` : ''}
    \${benvenuto_md ? \`<div style="margin-top:12px;padding:12px 14px;background:var(--es-yellow-light);border-radius:6px;font-size:.9rem;">\${escapeHtml(benvenuto_md)}</div>\` : ''}
  \`;
}

function renderRoot() {
  const root = document.getElementById('root');
  if (!state.selectedSlot) {
    root.innerHTML = \`
      <div class="layout">
        <div class="card" id="cal-card">
          <h2>📅 Scegli una data</h2>
          \${renderCalendar()}
        </div>
        <div class="card">
          <h2>🕒 \${state.selectedDate ? 'Orari disponibili — ' + formatDateIt(state.selectedDate) : 'Orari disponibili'}</h2>
          <div class="slots-wrap" id="slots-wrap">
            \${renderSlots()}
          </div>
        </div>
      </div>
    \`;
    bindCalendarEvents();
    bindSlotEvents();
  } else {
    renderForm();
  }
}

function renderCalendar() {
  const { year, month } = state.monthCursor;
  const firstOfMonth = new Date(year, month, 1);
  const startDow = firstOfMonth.getDay();   // 0=dom..6=sab
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const slotsByDate = state.data.slots_per_data;

  // Calcola se possiamo navigare avanti/indietro
  const today = new Date();
  const todayYM = today.getFullYear() * 12 + today.getMonth();
  const cursorYM = year * 12 + month;
  const prevDisabled = cursorYM <= todayYM;

  const allDates = Object.keys(slotsByDate);
  const maxYM = allDates.length > 0
    ? (() => { const [y, m] = allDates[allDates.length - 1].split('-').map(n => parseInt(n, 10)); return y * 12 + (m - 1); })()
    : todayYM;
  const nextDisabled = cursorYM >= maxYM;

  let html = \`
    <div class="cal-nav">
      <button id="btn-prev-month" \${prevDisabled ? 'disabled' : ''}>← Prec</button>
      <span class="month-label">\${MESI[month]} \${year}</span>
      <button id="btn-next-month" \${nextDisabled ? 'disabled' : ''}>Succ →</button>
    </div>
    <div class="cal-grid">
  \`;
  // Header giorni (lun-dom in italiano: ricomincio da lun)
  const dowOrder = [1, 2, 3, 4, 5, 6, 0];
  for (const d of dowOrder) html += \`<div class="cal-dow">\${GIORNI_ABBR[d]}</div>\`;

  // Empty cells per allineare al lunedì
  // startDow è 0=dom..6=sab. Per layout lun-dom: shift = (startDow + 6) % 7
  const shift = (startDow + 6) % 7;
  for (let i = 0; i < shift; i++) html += '<div class="cal-day empty"></div>';

  const todayStr = todayDateStr();
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = \`\${year}-\${String(month + 1).padStart(2, '0')}-\${String(d).padStart(2, '0')}\`;
    const hasSlots = slotsByDate[dateStr] && slotsByDate[dateStr].length > 0;
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === state.selectedDate;
    const cls = ['cal-day'];
    if (hasSlots) cls.push('available'); else cls.push('unavailable');
    if (isToday) cls.push('today');
    if (isSelected) cls.push('selected');
    html += \`<div class="\${cls.join(' ')}" \${hasSlots ? \`data-date="\${dateStr}"\` : ''}>\${d}</div>\`;
  }
  html += '</div>';
  return html;
}

function renderSlots() {
  if (!state.selectedDate) {
    return '<div class="slots-empty">Seleziona prima una data dal calendario.</div>';
  }
  const slots = state.data.slots_per_data[state.selectedDate] || [];
  if (slots.length === 0) {
    return '<div class="slots-empty">Nessuno slot disponibile in questa data.</div>';
  }
  return '<div class="slots-grid">' +
    slots.map(s => \`<button class="slot-btn" data-slot="\${s}">\${s}</button>\`).join('') +
    '</div>';
}

function bindCalendarEvents() {
  document.getElementById('btn-prev-month').onclick = () => {
    if (state.monthCursor.month === 0) {
      state.monthCursor = { year: state.monthCursor.year - 1, month: 11 };
    } else {
      state.monthCursor.month--;
    }
    state.selectedDate = null;
    render();
  };
  document.getElementById('btn-next-month').onclick = () => {
    if (state.monthCursor.month === 11) {
      state.monthCursor = { year: state.monthCursor.year + 1, month: 0 };
    } else {
      state.monthCursor.month++;
    }
    state.selectedDate = null;
    render();
  };
  document.querySelectorAll('.cal-day.available').forEach(el => {
    el.onclick = () => {
      state.selectedDate = el.getAttribute('data-date');
      render();
    };
  });
}

function bindSlotEvents() {
  document.querySelectorAll('.slot-btn').forEach(el => {
    el.onclick = () => {
      state.selectedSlot = el.getAttribute('data-slot');
      renderForm();
    };
  });
}

function renderForm() {
  const slotInizio = state.selectedDate + ' ' + state.selectedSlot;
  document.getElementById('root').innerHTML = \`
    <div class="card">
      <button id="btn-back" style="background:none;border:none;color:var(--es-yellow);cursor:pointer;font-family:inherit;font-weight:600;margin-bottom:8px;padding:0;">← Torna a scegliere lo slot</button>
      <h2>I tuoi dati</h2>
      <div class="recap">
        <strong>📅 \${formatDateIt(state.selectedDate)}</strong> alle <strong>\${state.selectedSlot}</strong> · \${state.data.tipo.durata_min} min
      </div>
      <form id="form-prenota">
        <div class="field">
          <label>Nome e cognome *</label>
          <input type="text" name="ospite_nome" required maxlength="120" autocomplete="name" />
        </div>
        <div class="field">
          <label>Email *</label>
          <input type="email" name="ospite_email" required autocomplete="email" />
          <small>Riceverai conferma a questa email</small>
        </div>
        <div class="field">
          <label>Telefono</label>
          <input type="tel" name="ospite_telefono" maxlength="30" autocomplete="tel" />
        </div>
        <div class="field">
          <label>Azienda</label>
          <input type="text" name="ospite_azienda" maxlength="200" autocomplete="organization" />
        </div>
        <div class="field">
          <label>Note / scopo dell'incontro</label>
          <textarea name="ospite_note" rows="3" maxlength="2000" placeholder="Es. Vorrei discutere di..."></textarea>
        </div>
        <div id="form-msg"></div>
        <button type="submit" class="submit-btn">Invia richiesta di prenotazione</button>
        <p style="text-align:center;color:var(--es-gray);font-size:.78rem;margin-top:10px;">
          La richiesta dev'essere confermata manualmente — riceverai conferma entro \${state.data.tipo.durata_min ? '24-48h' : 'breve'}.
        </p>
      </form>
    </div>
  \`;
  document.getElementById('btn-back').onclick = () => {
    state.selectedSlot = null;
    render();
  };
  document.getElementById('form-prenota').onsubmit = onSubmit;
}

async function onSubmit(ev) {
  ev.preventDefault();
  const form = ev.currentTarget;
  const btn = form.querySelector('.submit-btn');
  const msgBox = form.querySelector('#form-msg');
  msgBox.innerHTML = '';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>Invio in corso…';

  const payload = {
    slot_inizio: state.selectedDate + ' ' + state.selectedSlot,
    ospite_nome: form.elements['ospite_nome'].value.trim(),
    ospite_email: form.elements['ospite_email'].value.trim(),
    ospite_telefono: form.elements['ospite_telefono'].value.trim() || null,
    ospite_azienda: form.elements['ospite_azienda'].value.trim() || null,
    ospite_note: form.elements['ospite_note'].value.trim() || null,
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Errore invio');
    renderSuccess(json.data, payload);
  } catch (err) {
    msgBox.innerHTML = '<div class="alert error">❌ ' + escapeHtml(err.message) + '</div>';
    btn.disabled = false;
    btn.textContent = 'Invia richiesta di prenotazione';
  }
}

function renderSuccess(data, payload) {
  document.getElementById('root').innerHTML = \`
    <div class="success-page">
      <div class="icon">✅</div>
      <h2>Richiesta inviata!</h2>
      <p style="color:var(--es-text);font-size:1rem;margin-bottom:20px;">
        Grazie \${escapeHtml(payload.ospite_nome)}, abbiamo ricevuto la tua richiesta per:<br>
        <strong>\${escapeHtml(state.data.tipo.titolo)}</strong> · \${formatDateIt(state.selectedDate)} alle \${state.selectedSlot}
      </p>
      <div class="alert info" style="text-align:left;">
        📩 Riceverai conferma all'indirizzo <strong>\${escapeHtml(payload.ospite_email)}</strong> entro 24-48h.<br>
        Se non confermata in tempo, la richiesta decadrà automaticamente e potrai riprovare.
      </div>
    </div>
  \`;
}

function todayDateStr() {
  const d = new Date();
  return \`\${d.getFullYear()}-\${String(d.getMonth() + 1).padStart(2, '0')}-\${String(d.getDate()).padStart(2, '0')}\`;
}

function formatDateIt(dateStr) {
  const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  return \`\${GIORNI_ABBR[date.getDay()]} \${d} \${MESI[m - 1]}\`;
}

loadData();
</script>

</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60',
    },
  });
}
