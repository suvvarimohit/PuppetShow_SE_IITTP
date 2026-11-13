# Puppet Story Studio

A browser app that maps an uploaded or pasted story to a live traditional Indian puppet-show performance with spoken dialogue and movement.

## Run the hosted app (macOS/Linux, no Python)

Once GitHub Pages is enabled for the repository, open:

`https://suvvarimohit.github.io/PuppetShow_ProtoType_SE_IITTP/`

On macOS or Linux, `sh ./start-macos-linux.sh` opens the hosted app in the default browser. It needs an internet connection, but no Python, packages, or local server. Browser speech uses the voices available on that device.

To publish updates, the repository owner must enable **Settings → Pages → Build and deployment → GitHub Actions** once. After that, pushes to `main` deploy automatically. The first deployment can take a few minutes.

## Run locally on Windows

Start the app using the script for your computer:

- Windows: double-click `start-windows.bat`. It uses built-in Windows PowerShell and does not require Python.

Speech uses the browser's built-in Web Speech API; available voices, languages, and voice quality depend on the browser and device.

The hosted app can be opened directly on phones, tablets, and computers with internet access.

## Two-page flow

1. The first page starts with an empty story box. Paste a story or open a `.txt` file to see a rough rules-based conversion estimate.
2. Choose **Continue to puppet show**. The second page maps the story and automatically performs it once with browser-generated speech. The final frame remains visible after speech and movement finish. The app does not create or offer a downloadable video.

## Current scope

- Stories can produce up to eight minutes of estimated show time. Long inputs are shortened toward the limit while retaining higher-scoring story moments.
- The mapper can identify up to eighteen named story characters, including people, animals, and personified story objects. The puppet library includes distinct illustrated lions, rabbits, elephants, foxes, fish, flowers, the sun, the moon, and a river, alongside the existing people, birds, turtles, and trees.
- Characters visible in each act are arranged side by side at separate stage positions; their lineup adapts to the number of participants in that act.
- Scene backgrounds persist across character turns and change when the story moves to another setting. Daylight shades remain steady until the story gives a new time cue. The act caption appears at the bottom of the show.
- Character identity, costume, both hand slots, and ride slots are composited into a single puppet image. Detailed pre-drawn variants include sword-and-shield guards, horse and boat riders, basket carriers, archers, and lantern bearers; other recognized tools and rides are drawn into the generated character image. Movement includes entrance and exit, baseline forward and backward steps, upper-line and baseline travel, meetings, and attack lunges with a reaction from the adjacent character.
- Each setting gets its own baseline/upper-line point count, sized to the largest cast present in that setting's acts. The act timeline shows the active point and that setting's total points.
- Play/Pause controls the live performance and browser speech. Afterward, the final frame remains visible and the show does not loop.
- Base story parsing, conversion estimates, character assignment, motion, and scene choices use local heuristics. Optional Cloudflare AI enrichment can add scene, time-of-day, and movement-description suggestions for stories the rules flag as difficult.
- Action narration is spoken by an off-screen narrator; quoted dialogue is spoken by the identified character. Narrator is not added to the on-stage cast. Animals are not assigned hand props. The act timeline includes a generated movement description.
- Six illustrated backdrops are selected by story setting and time-of-day shades. They are not AI-generated images.
- Browser voices are device-specific and require browser speech-synthesis support. No audio or video file is rendered or downloaded.

## Optional open-model story enrichment

Story conversion always runs in the browser first. For stories with ambiguous reasoning, many characters, or complex action/speech cues, the app can ask the Cloudflare Worker for extra scene, time-of-day, and movement-description suggestions. These suggestions are accepted only when they match the app's allowed settings and confidence threshold. If the Worker is not configured, is unavailable, or reaches a provider limit, the browser's local conversion continues without interruption.

The Worker uses Qwen 3.8 27B through Cloudflare Workers AI. The model is available under Apache 2.0 terms; Cloudflare's hosted inference still has service limits. The Workers Free plan currently includes 10,000 Neurons per day, after which inference calls fail until the quota resets or a paid plan is used. To conserve that allowance, the app only sends eligible stories up to 6,000 characters and 30 acts, and requests a bounded output. [Cloudflare model details](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/) · [Cloudflare AI pricing and limits](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [Qwen model license](https://huggingface.co/Qwen/Qwen3.8-27B).

To enable AI enrichment:

1. Create a Cloudflare account, then from the project directory run `cd worker`, `npx wrangler@latest login`, and `npx wrangler@latest deploy`.
2. If you reuse this Worker configuration for another Worker in the same Cloudflare account, give it an unused `ratelimits[0].namespace_id`. Add your published site origin to `ALLOWED_ORIGINS` if it differs from the listed GitHub Pages origin.
3. Copy the deployed `workers.dev` URL into `ai-config.js` as `window.PUPPETSHOW_AI_ENDPOINT`. This is a public endpoint URL, not a secret. The AI binding and model access remain on Cloudflare; do not put account tokens or model credentials in browser files.

The Worker allows five enrichment calls per minute per client IP and story-enrichment route. Cloudflare documents this rate limiter as approximate and location-based, so it reduces casual overuse but is not a strict global quota. The AI daily quota is separately enforced by Cloudflare. If it is reached, the browser uses local conversion instead.

## Files

- `index.html`, `input.js`: story input and conversion estimate.
- `puppet-show.html`, `app.js`, `style.css`: cast mapping, show rendering, and playback.
- `server.ps1`: Windows local web server using built-in PowerShell.
- `server.py`: optional local server using Python's standard library.
- `start-windows.bat`: Windows local launcher; does not require Python.
- `start-macos-linux.sh`: opens the hosted app; does not require Python.
- `.github/workflows/pages.yml`: publishes the static app to GitHub Pages after Pages is enabled.
- `ai-config.js`: public Worker URL used for optional AI enrichment; it contains no credential.
- `worker/`: Cloudflare Worker source, Workers AI binding, CORS allowlist, and request rate limit.
- `assets/puppets/`, `assets/backgrounds/`: reusable puppet figures and illustrated scenes.
- No default story or bundled sample-story files.

