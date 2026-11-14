# Puppet Story Studio

A browser app that maps an uploaded or pasted story to a live traditional Indian puppet-show performance with spoken dialogue and movement.

## Run the hosted app (macOS/Linux, no Python)

Once GitHub Pages is enabled for the repository, open:

`https://suvvarimohit.github.io/PuppetShow_SE_IITTP/`

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
- Character identity, costume, both hand slots, and ride slots are composited into a single puppet image. Detailed pre-drawn variants include sword-and-shield guards, horse and boat riders, basket carriers, archers, and lantern bearers; other recognized tools and rides are drawn into the generated character image. Story actions animate entrances and exits, walking and running travel at different paces with distinct bounce, jumps, waves for human puppets, turns, dances, meetings, sword attacks, repeated fight beats, falls and recovery, horse-riding travel, flight, defensive shield effects, and target reactions. Stage travel and character movement are timed alongside spoken dialogue. Twenty human character templates from the supplied sheets are cropped into transparent PNG assets and selected by story names or roles, including royalty, villagers, children, guards, thieves, demons, and the Ramayana characters. These templates animate as complete figures. The original human-a King rig separately animates its body parts for walking, running, waving, dancing, fighting, and defending when no hand props or ride are assigned.
- Each setting gets its own baseline/upper-line point count, sized to the largest cast present in that setting's acts. The act timeline highlights the current speaker and action; the matching cast card is marked on stage. Scene backdrops preload before playback and crossfade when a story location changes, while time-of-day lighting follows story cues.
- Play/Pause controls the live performance and browser speech. Afterward, the final frame remains visible and the show does not loop.
- Story parsing, cast identity, dialogue voice, and baseline act conversion remain local. Cloudflare Workers AI is called only for complex or uncertain physical actions; any unavailable, rejected, or low-confidence suggestion falls back to the local mapper.
- Twenty-five theatrical backdrops are included and selected from story locations: royal palace, throne hall, queen's chamber, prince's garden, village, market, farmland, riverbank, forest/jungle, forest hut, rishi ashram, mountains, cave, battlefield, Lanka, Ayodhya, Dwarka, Kurukshetra, Panchavati forest, seashore, temple, house interior, jail, night scene, and celestial heaven. Scene changes follow location cues in the story, with time-of-day lighting applied separately.
- Browser voices are device-specific and require browser speech-synthesis support. No audio or video file is rendered or downloaded.


## Optional Cloudflare Workers AI enrichment

The show page sends one bounded request to the Cloudflare Worker only when local rules find complex or uncertain physical actions. Cloudflare Workers AI runs OpenAI's open-weight GPT-OSS 20B model to refine a movement, action description, target, setting, or time cue. The browser validates every result against the existing cast, role, movement list, and already-equipped assets. The Worker cannot add characters, change dialogue speakers, give animals hand props, or invent tools. If Workers AI is unavailable or reaches its allowance, local conversion continues unchanged.

To deploy the Worker from an authenticated machine, run `npx wrangler@latest login` once, then `npx wrangler@latest deploy` from the `worker` directory. `ai-config.js` contains only the public Worker URL. The Pages workflow publishes the app on every push. It also deploys the Worker when `CLOUDFLARE_API_TOKEN` is configured as a GitHub Actions secret.

Workers AI currently includes 10,000 Neurons per day at no charge; limits reset daily, and requests can fail after the free allowance unless billing is enabled. GPT-OSS 20B is priced at $0.20 per million input tokens and $0.30 per million output tokens after the free allocation. The app limits AI requests to stories under 6,000 characters and 30 acts, sends at most twelve uncertain action records in one request, and falls back to local mapping on timeout, rate limit, or low-confidence output. The local mapper remains available as the fallback. [Workers AI pricing and limits](https://developers.cloudflare.com/workers-ai/platform/pricing/) · [GPT-OSS 20B model](https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/)

## Files

- `index.html`, `input.js`: story input and conversion estimate.
- `puppet-show.html`, `app.js`, `style.css`: cast mapping, show rendering, and playback.
- `ai-config.js`, `worker/`: optional Cloudflare Workers AI enrichment and its role/asset validation.
- `server.ps1`: Windows local web server using built-in PowerShell.
- `server.py`: optional local server using Python's standard library.
- `start-windows.bat`: Windows local launcher; does not require Python.
- `start-macos-linux.sh`: opens the hosted app; does not require Python.
- `.github/workflows/pages.yml`: publishes the static app to GitHub Pages after Pages is enabled.
- `assets/puppets/`, `assets/backgrounds/`: reusable puppet figures and illustrated scenes.
- `MOVEMENT_DEMO.txt` is a bundled sample story for trying the boat, horse, bow-and-arrow, animal, travel, and combat scenes.


## Human puppet movement

The human templates use shoulder and hip pivots. Arms overlap the torso at the shoulder; the mechanical hinge pins are hidden for a clean puppet look. Walk, run, enter, exit, and retreat actions swing the arms and legs; wave, fight, defend, jump, and dance use their own poses. Use the included `MOVEMENT_DEMO.txt` to try these actions in the story input screen.

## Animals, rescue actions, and story props

Fourteen animals from the supplied P8 sheet (including the horse) are split into body and four leg parts. Printed pivot dots are removed from animal body art, and leg tops tuck behind the body silhouette. Their legs swing in coordinated walk, trot, run, and riding cycles; the ridden horse animates behind the rider. Other animal sprites retain whole-body movement. The supplied crescent moon is shown for moon and night story cues, with the white image background removed during rendering. Clouds and the sun appear in the sky when mentioned. A sword is anchored to the puppet’s anatomical right hand (the viewer’s left), and a shield is anchored to its anatomical left hand (the viewer’s right). Their positions follow the animated arm pivots during gestures and fighting. The project includes the five P7 stage backgrounds and all twenty-five individual scenes cut from the added BG sheet.

The story mapper recognizes lifting and hoisting, rescue/help/free actions, throwing and pulling a rope, handing over or sharing supplies, and kneeling. These cues animate the speaker’s arm/body pose, add a lifted branch, rope or medicine packet where the story calls for one, and give named recipients a small response. Boat/river rescue cues add a boat at the river scene. Storm/rain wording adds animated rain, while location and time-of-day cues keep scenery and lighting aligned with the narration. Try the complete sequence in `MOVEMENT_DEMO.txt`; action names should be stated clearly (for example, “Hanuman threw a rope to the fisherman”).


## Boats, horses, bows, and scene backdrops

The supplied wooden boat and bow are staged as separate transparent assets. Boat rides keep the puppet standing on the deck and move the boat with the rider; horse rides place a rigged rider over the horse with one leg draped across it. Bow attacks use a right-hand bow and launch an arrow toward the named target. Background location words in each story act select the closest matching backdrop; night scenes use their own illustrated background.
