CSB — GitHub Pages base patch

Files:
- vite.config.js
- src/routerBase.js
- src/samples/App.patched.jsx

How to apply:
1) Put vite.config.js at project root (client/).
2) Add src/routerBase.js.
3) In src/App.jsx:
   import { routerOptions } from './routerBase.js'
   const router = createBrowserRouter(routes, routerOptions)

Deploy:
npm run predeploy
npm run deploy

Dev:
npm run dev
