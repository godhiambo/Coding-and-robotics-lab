# Milestone Minds Robotics Lab

A virtual robotics lab that runs in the browser (and as an Android app). Learners build, program and test robots
without owning hardware: wheeled robot, robot arm, drone, a 3D breadboard, Kenya-themed missions, a mentor called Mila,
blocks / Python / full Python, teacher tools, camera light sensor, echo sonar and more.

## Run it
Open `site/index.html` through any web server (camera, tilt and offline mode need HTTPS or localhost):

    python3 -m http.server --directory site 8000   # then open http://localhost:8000

## Edit and rebuild
The app is one HTML file assembled from `src/`:

    python3 build.py        # writes site/index.html

| File | What it does |
|---|---|
| `src/core.js` | simulation, robots, sensors, missions, live/manual modes |
| `src/app.js` | 3D scene (Three.js) and main interface |
| `src/mila.js` | mentor hints, quizzes, explanations |
| `src/circuit.js`, `src/bb.js`, `src/bb3d.js` | circuit solver and 3D breadboard |
| `src/pyx.js`, `src/pyglue.py` | simple Python compiler and full Python (Pyodide) bridge |
| `src/echo.js` | echo sonar signal processing |
| `src/extras.js` | scores, Club, teacher tools, export, vibe coding, device features |
| `src/template.html` | page layout and styles |
| `android-app/` | Android wrapper project (Capacitor) |

## Deploy
- **GitHub Pages:** push to `main`. In *Settings > Pages* set *Source* to **GitHub Actions**. The included workflow builds and publishes `site/`.
- **Cloudflare Pages:** Workers & Pages > Create > Pages > Connect to Git, pick this repo. Framework preset **None**, build command empty (or `python3 build.py`), build output directory **`site`**. `site/_headers` sets caching and permission headers. You can also use *Upload assets* and drag the `site/` folder.
- **Netlify / any static host:** upload the `site/` folder.

## Android app
`android-app/` wraps `site/` as a native Android app (Capacitor). See [android-app/README.md](android-app/README.md): build the web app, run `npm install` and `npm run sync` there, then build the APK in Android Studio.

## Notes
- "Ask Mila to code it" uses Claude only inside claude.ai. Elsewhere it falls back to a simple keyword writer.
- Progress and class data are stored in the browser (localStorage); there is no server.
- Full Python downloads about 10 MB from the jsDelivr CDN on first use.
- Third-party: Three.js (MIT), Pyodide (MPL-2.0) loaded from CDN.

No licence file is included yet. Add one before inviting contributions.
