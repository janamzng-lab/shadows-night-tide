# SHADOWS: NIGHT TIDE

A React + Three.js browser-based survival-horror game, configured for independent static hosting. It does not require Google AI Studio to run as a website.

## Build locally

Requirements: Node.js 22 (or a compatible current Node.js release) and npm.

```bash
npm ci
npm run build
npm run preview
```

Vite writes the production website to `dist/`.

## Deploy on Netlify

This repository includes `netlify.toml` with the build command (`npm run build`), publish directory (`dist`), and a single-page-app fallback. Import the project into Netlify from a Git repository. Netlify will install the locked dependencies, build the site, and provide an independent HTTPS URL. The source ZIP itself is not the built website; do not upload the source ZIP as if it were the `dist/` output.

Official guide: https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/

## Mobile notes

- Open the deployed HTTPS URL in a current Android Chrome browser with WebGL enabled.
- The game detects touch input and adjusts the renderer for mobile devices.
- Rotate the phone to landscape for the intended play layout.
- This is a web game, not an Android APK. An APK would require a separate Android packaging/build step.
- Night Coins and unlocked weapons are saved locally in the browser. A new campaign starts with a fresh run state.

## Environment variables

The game source does not currently call the Gemini API or use `APP_URL`; those AI Studio environment variables are not needed for the static website build. Never place private API keys in frontend code.

## Verification

Run `npm ci`, `npm run build`, and `npm run lint` before release. Review the Netlify deploy log if the build fails, and test the deployed URL on an Android device.
