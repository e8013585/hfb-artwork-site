# Artwork by HFB

A static portfolio and sales site for 32 original paintings and drawings on paper by HFB.
Buyers text **+1 (925) 518-9256** to purchase. There's no online checkout.

Live site: https://e8013585.github.io/hfb-artwork-site/

## Structure

| Path | Purpose |
| --- | --- |
| `index.html` | Home: hero, filterable gallery, artwork lightbox, about and how-to-buy |
| `contact.html` | Contact & buy page: inquiry list and a prefilled text message |
| `assets/js/artworks.js` | Catalog data (titles, media, sizes, prices, descriptions) |
| `assets/js/common.js` | Theme toggle, inquiry list (localStorage) and shared helpers |
| `assets/js/gallery.js` / `contact.js` | Page-specific behaviour |
| `assets/img/` | Logo/favicon, icon sprite, social preview image |
| `images/full`, `images/thumb` | Web-optimized transparent WebP artwork images generated from the background-removed PNGs (kept locally in `backgrounds-removed/`, not published) |
| `images/hires` | Full-resolution WebPs, loaded only when a visitor opens an artwork (and by its "Full size" link) |
| `redundant/` | Local folder for retired image files; its contents are ignored by git |

Plain HTML, CSS and JavaScript with no build step, so GitHub Pages serves it as-is from the `main` branch.
