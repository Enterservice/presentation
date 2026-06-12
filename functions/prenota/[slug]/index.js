/**
 * Cloudflare Pages Function — route /prenota/<slug>
 *
 * Pagina-INDICE pubblica del calendario: lista tutti i tipi di appuntamento
 * attivi per quello user, ognuno cliccabile → porta a /prenota/<slug>/<tipo>.
 *
 * Pensata per il "link unico" condivisibile: un solo URL che mostra al cliente
 * tutte le tipologie disponibili. Per il link specifico di un singolo tipo
 * resta valido /prenota/<slug>/<tipo>.
 *
 * I dati vengono fetched lato client da
 * https://app.enterserviceholding.com/api/public/prenota/<slug>
 * (CORS aperto per enterserviceholding.com).
 */

export async function onRequest(context) {
  const { slug } = context.params;
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return new Response('Not found', { status: 404 });
  }
  return renderIndexPage(slug);
}

export function renderIndexPage(slug) {
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
    .container { max-width: 720px; margin: 0 auto; padding: 32px 20px; }
    h1, h2, h3 { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: var(--es-navy); margin: 0 0 4px; }
    h1 { font-size: 1.6rem; }
    h2 { font-size: 1.1rem; margin-top: 22px; margin-bottom: 12px; }

    .header {
      background: white;
      border-radius: 12px;
      padding: 24px 28px;
      box-shadow: 0 2px 8px rgba(20,12,100,.06);
      margin-bottom: 18px;
    }
    .header .who { color: var(--es-gray); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .benvenuto {
      margin-top: 12px;
      padding: 12px 14px;
      background: var(--es-yellow-light);
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .tipi-list { display: grid; gap: 12px; }
    .tipo-card {
      display: block;
      background: white;
      border: 1px solid var(--es-border);
      border-radius: 12px;
      padding: 18px 20px;
      text-decoration: none;
      color: inherit;
      box-shadow: 0 2px 8px rgba(20,12,100,.04);
      transition: border-color .15s, transform .1s, box-shadow .15s;
    }
    .tipo-card:hover {
      border-color: var(--es-yellow);
      box-shadow: 0 4px 14px rgba(251,168,0,.18);
      transform: translateY(-1px);
    }
    .tipo-card .top-row {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px; flex-wrap: wrap; margin-bottom: 6px;
    }
    .tipo-card .titolo {
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      font-weight: 700; font-size: 1.05rem; color: var(--es-navy);
    }
    .tipo-card .badge {
      display: inline-block; padding: 3px 10px;
      background: var(--es-yellow-light); color: var(--es-navy);
      border-radius: 999px; font-size: 0.74rem; font-weight: 700;
    }
    .tipo-card .meta {
      color: var(--es-gray);
      font-size: 0.88rem;
      margin-top: 2px;
    }
    .tipo-card .desc {
      color: var(--es-text);
      font-size: 0.92rem;
      margin-top: 8px;
      line-height: 1.5;
    }
    .tipo-card .cta {
      display: inline-block;
      margin-top: 12px;
      color: var(--es-navy);
      font-weight: 700;
      font-size: 0.92rem;
    }
    .tipo-card .cta::after {
      content: ' →';
      transition: transform .15s;
      display: inline-block;
    }
    .tipo-card:hover .cta::after { transform: translateX(3px); }

    .footer-info {
      text-align: center;
      color: var(--es-gray);
      font-size: 0.78rem;
      padding: 24px 0 12px;
    }
    .footer-info a { color: inherit; }

    .alert {
      padding: 12px 16px;
      border-radius: 8px;
      margin-top: 14px;
      font-size: 0.92rem;
    }
    .alert.error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

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
const API_URL = 'https://app.enterserviceholding.com/api/public/prenota/' + SLUG;

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function loadData() {
  try {
    const res = await fetch(API_URL);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Errore caricamento');
    render(json.data);
  } catch (err) {
    document.getElementById('page-header').innerHTML = '<div class="alert error">❌ ' + escapeHtml(err.message) + '</div>';
  }
}

const MOD_LABEL = {
  online: { icon: '🎥', label: 'Online (videocall)' },
  presenza: { icon: '🏢', label: 'In presenza' },
  telefono: { icon: '📞', label: 'Telefonica' },
};

function render(data) {
  const { user, benvenuto_md, tipi } = data;

  document.getElementById('page-header').innerHTML = \`
    <div class="who">PRENOTA UN APPUNTAMENTO CON</div>
    <h1>\${escapeHtml(user.nome)}</h1>
    <p style="margin-top:8px;color:var(--es-gray);font-size:.95rem;">Scegli il tipo di appuntamento che preferisci.</p>
    \${benvenuto_md ? \`<div class="benvenuto">\${escapeHtml(benvenuto_md)}</div>\` : ''}
  \`;

  const root = document.getElementById('root');
  if (!tipi || tipi.length === 0) {
    root.innerHTML = '<div class="alert error">Nessun tipo di appuntamento attivo. Contatta direttamente l\\'organizzatore.</div>';
    return;
  }

  root.innerHTML = \`
    <div class="tipi-list">
      \${tipi.map(t => {
        const mod = MOD_LABEL[t.modalita] || { icon: '📅', label: t.modalita || '' };
        const luogoLine = (t.modalita === 'presenza' && t.luogo)
          ? \` · 📍 \${escapeHtml(t.luogo)}\` : '';
        const url = '/prenota/' + encodeURIComponent(SLUG) + '/' + encodeURIComponent(t.slug);
        return \`
          <a href="\${url}" class="tipo-card">
            <div class="top-row">
              <div class="titolo">\${escapeHtml(t.titolo)}</div>
              <span class="badge">\${mod.icon} \${escapeHtml(mod.label)}</span>
            </div>
            <div class="meta">⏱️ \${t.durata_min} minuti\${luogoLine}</div>
            \${t.descrizione_md ? \`<div class="desc">\${escapeHtml(t.descrizione_md)}</div>\` : ''}
            <span class="cta">Prenota</span>
          </a>
        \`;
      }).join('')}
    </div>
  \`;
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
