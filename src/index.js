/**
 * Cloudflare Worker entrypoint per il sito pubblico enterserviceholding.com.
 *
 * Routing:
 *   /prenota/<slug>          → renderIndexPage (lista tipi cliccabili, "link unico")
 *   /prenota/<slug>/<tipo>   → renderPrenotaPage (calendario Calendly-like)
 *   <qualsiasi altro path>   → fallback ASSETS (static files: index.html, ecc.)
 *
 * Wrangler config:
 *   main = "src/index.js"
 *   [assets] directory = ".", binding = "ASSETS"
 *
 * NOTA: presentation usa Worker classico con routing imperativo (non Pages
 * Functions auto-routing). Ogni nuovo handler dinamico va registrato qui.
 */

import { renderPrenotaPage } from '../functions/prenota/[slug]/[tipo].js';
import { renderIndexPage } from '../functions/prenota/[slug]/index.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // /prenota/<slug>/<tipo>  (link diretto per singolo tipo)
    const mTipo = url.pathname.match(/^\/prenota\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);
    if (mTipo) {
      const slug = mTipo[1];
      const tipo = mTipo[2];
      return renderPrenotaPage(slug, tipo);
    }

    // /prenota/<slug>  (link UNICO con scelta tipo)
    const mIndex = url.pathname.match(/^\/prenota\/([a-z0-9-]+)\/?$/);
    if (mIndex) {
      const slug = mIndex[1];
      return renderIndexPage(slug);
    }

    // Tutto il resto → static assets
    return env.ASSETS.fetch(request);
  },
};
