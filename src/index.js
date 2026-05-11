/**
 * Cloudflare Worker entrypoint per il sito pubblico enterserviceholding.com.
 *
 * Routing:
 *   /prenota/<slug>/<tipo>   → renderPrenotaPage (calendario Calendly-like)
 *   <qualsiasi altro path>   → fallback ASSETS (static files: index.html, ecc.)
 *
 * Wrangler config:
 *   main = "src/index.js"
 *   [assets] directory = ".", binding = "ASSETS"
 */

import { renderPrenotaPage } from '../functions/prenota/[slug]/[tipo].js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // /prenota/<slug>/<tipo>  (rotta dinamica)
    const m = url.pathname.match(/^\/prenota\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/);
    if (m) {
      const slug = m[1];
      const tipo = m[2];
      return renderPrenotaPage(slug, tipo);
    }

    // Tutto il resto → static assets
    return env.ASSETS.fetch(request);
  },
};
