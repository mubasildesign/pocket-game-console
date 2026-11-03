# Pocket Grid

A pocketful of green-glass afternoons.

Pocket Grid is a tiny handheld you can open in a browser. Same feeling as the chunky LCD brick you used to hide under a school desk: soft pixels, a square-wave beep, and one more game before dinner. Twenty-four cartridges. No login. No download. Just press power.

Made with 🕹️ curiosity and nostalgia by [Mubasil](https://mubasil.me).

## How to play

Pick a nickname when you arrive. That name is what lands on the leaderboard when a game ends. Scores stay on this device, in this browser, like a high-score sticker you wrote yourself.

| Do this | With the keyboard | On the pad |
| --- | --- | --- |
| Move | Arrow keys or W A S D | The yellow cross |
| Act, hop, fire, drop | Z, X, or Space | The big Z |
| Start a game | Z or Enter | Z |
| Back / pause | Esc | |
| Sound | M | SND |
| Reset | R | RST |
| Power | P | PWR |

On a phone the pad sits on the shell, and the leaderboard tucks into the menu button at the top left.

The menu has two shelves, **Classic** and **Arcade**. Left and right switch shelves. Games start gentle and pick up speed about every fifteen seconds, the way a good afternoon slowly gets loud.

## The cartridges

**Classic**

Stack, Race, Snake, Blast, Sub, Tank, Frog, Bird, Brick, Maze, Jump, Climb.

**Arcade**

Tennis, Hockey, Ski, Catch, Mole, Match, Bowl, Ants, Fish, Dart, Heli, Land.

Each one tells you what to do on the screen. Hold a direction when the blurb says hold. Tap Z when it says Z.

## Play it on your computer

You need any tiny static server. Opening the file directly will not load the games.

```bash
./start.sh
```

Then visit [http://localhost:8091](http://localhost:8091).

Or, if you would rather not use the script:

```bash
python3 -m http.server 8091
```

## Put it on Vercel

This is a plain static site. No build step, no framework, no environment variables.

1. Push this folder to a Git repository. `index.html` should sit at the root.
2. In Vercel, choose **Add New → Project** and import that repo.
3. Set the framework preset to **Other**.
4. Leave **Build Command** empty.
5. Leave **Output Directory** empty, or set it to `.`
6. Deploy.

Vercel serves the HTML, CSS, and modules as they are. The first visit asks for a nickname. After that, the console just turns on.

A `vercel.json` in this folder tells Vercel not to hunt for a framework. You can deploy without changing it.

## What stays on the device

Nicknames and scores live in the browser’s local storage. Clearing site data clears the board. There is no account and no server behind the leaderboard, which feels right for a toy that used to run on two batteries.
