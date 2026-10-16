# Rozalina Handmade

Website za [@rozalina_handmade](https://www.instagram.com/rozalina_handmade/): ručno rađeni pokloni iz Zenice.

Napravljeno u [Astro](https://astro.build) (statički sajt).

- `src/pages/index.astro`: cijela stranica (hero, kolekcije, ponuda, po želji, o meni, kontakt)
- `src/layouts/Base.astro`: `<head>`, fontovi, meta tagovi
- `src/data/products.js`: proizvodi u ponudi (naziv, opis, slika, kategorija)
- `src/styles/global.css`: dizajn i animacije
- `src/scripts/main.js`: slider, filteri, modal proizvoda, omiljeni, latice
- `public/images/`: fotografije proizvoda (WebP) i logo

## Cloudflare Pages

- Framework preset: Astro
- Build command: `npm run build`
- Build output directory: `dist`
- Node: 22 (iz `.nvmrc`)

Svaki push na `main` automatski se objavljuje.

## Lokalno

```bash
npm install
npm run dev
```
