# Bore & Barrel

A dummy gunshop storefront built as a Progressive Web App. It runs offline
with an app shell, a web app manifest, and a service worker, and uses React +
Vite + Tailwind CSS.

## Setup

```bash
npm install
npm run dev      # dev server with HMR
```

Other scripts:

```bash
npm run build    # production build to dist/
npm run preview  # serve the production build
npm run lint     # oxlint
```

## Structure

```
.
├── index.html              # HTML shell
├── vite.config.js          # Vite + vite-plugin-pwa (manifest + service worker)
├── public/                 # static assets served at /
│   ├── icon-192.png / icon-512.png / icon.svg
│   └── guns/               # product images
└── src/
    ├── main.jsx            # entry, mounts <App/>
    ├── App.jsx             # app shell: tab state, header/nav/content/footer
    ├── App.css             # app shell styles
    ├── index.css           # global styles
    ├── components/
    │   ├── Header.jsx      # brand + nav
    │   ├── gun/
    │   │   ├── GunCard.jsx
    │   │   └── GunDetail.jsx
    │   └── Footer.jsx
    ├── hooks/
    │   ├── useGuns.js      # cached product queries
    │   └── useReviews.js   # review queries and actions
    ├── services/
    │   ├── archiveService.js # local archive/restore state
    │   ├── gunService.js
    │   └── reviewService.js
    ├── pages/
        ├── Catalog.jsx     # product grid
        ├── ProfilePage.jsx # profile, drafts, archive, about, and contact
        ├── EditProfilePage.jsx
        ├── DemoCartPage.jsx
        ├── About.jsx
        └── Contact.jsx
    ├── data/
    │   └── guns.js         # dummy product data
    └── utils/
        ├── draftStorage.js
        └── queryCache.js
```

## Features

- Catalog items load progressively, and product/review queries are cached for
  30 seconds.
- Product detail links can be shared with the `?gun=<id>` URL parameter.
- Profile sections include drafts, archived items, About, and Contact. Archive
  state, review reactions, and the demo cart are stored in the current browser.
- Reviews can be created, edited, removed, and rated with thumbs up/down.
- The demo cart is local-only and intentionally has no checkout or order flow.
- WhatsApp contact from the demo cart is for general app questions only and does not include cart details.
