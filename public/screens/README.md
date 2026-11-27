# App screenshots

Drop portrait screenshots here and rebuild; no code changes. Until a file exists, the site draws a
sketch in its place. Which screens show, and in which order, is set in `src/config/screens.config.ts`.

| Coach view                    | Player view         |
| ----------------------------- | ------------------- |
| `coach-calendar.webp`         | `player-home.webp`  |
| `coach-whiteboard-roles.webp` | `player-event.webp` |
| `coach-match.webp`            |                     |

- `.png` and `.jpg` work too; webp, 780 px wide and under 120 KB is what ships. Size: 9:19.5,
  such as 780 x 1688 px.
- For the Arabic page add `coach-home.ar.webp` and so on. Without them it uses the files above.
- Demo data only: no real players' names, photos or ratings.
- Players have no channel in the app, so there is no channel in the player view.
