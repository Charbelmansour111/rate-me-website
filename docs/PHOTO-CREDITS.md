# Photo credits

All photos are from [Unsplash](https://unsplash.com) under the
[Unsplash License](https://unsplash.com/license): free to use, no permission needed, credit
appreciated. They are stock photos: the people in them are not Rate Me coaches, and no names, quotes
or testimonials go with them.

Authors' names are as Unsplash spells them in the download file names. Check them against each
photo's page.

## On the site

| File                                 | Photo by                           | Unsplash                                | Crop                                                                                                                                                                                                      |
| ------------------------------------ | ---------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/community/coach-1.jpg`       | Mostafa Kordzangeneh               | https://unsplash.com/photos/_tcJW4nqVtw | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/community/coach-2.jpg`       | Josias Garibay                     | https://unsplash.com/photos/rifCUO-4X8k | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/community/coach-3.jpg`       | Vicky Hladynets                    | https://unsplash.com/photos/_gDoyVv5F4c | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/community/coach-4.jpg`       | Artem Kryzhanivskyi                | https://unsplash.com/photos/sEll8Ivzx1w | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/community/coach-5.jpg`       | Alex Suprun                        | https://unsplash.com/photos/UUp9z94QhLA | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/community/coach-6.jpg`       | Arthur Debons                      | https://unsplash.com/photos/Mrql2Og2GU8 | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/community/coach-7.jpg`       | Christian Buehner                  | https://unsplash.com/photos/5YpZpFy8zzU | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/community/coach-8.jpg`       | Lucas Clarysse                     | https://unsplash.com/photos/yMxLAdXh8Wc | Square on the face, 640 px, black and white                                                                                                                                                               |
| `public/features/whiteboard.webp`    | Jasper Benning                     | https://unsplash.com/photos/Ri4FXmD7DPM | 16:10, board only, 1200 px, colour                                                                                                                                                                        |
| `public/features/calendar.webp`      | Alliance Football Club             | https://unsplash.com/photos/g8cK31aYH3E | 16:10, below the shorts (their club name) and away from the child: legs, boots, a cone, 1200 px, colour                                                                                                   |
| `public/community/players.webp`      | Photo by Danylo Suprun on Unsplash | 5CBdeiqh4mI                             | 4:3, the lower half, 960 px, colour                                                                                                                                                                       |
| `public/footer/pitch.webp`           | Photo by Omar Ramadan on Unsplash  | htGM-eEzsdk                             | the turf band only (no faces), 1600 px, colour                                                                                                                                                            |
| `public/features/matchRequests.webp` | Jerome                             | https://unsplash.com/photos/nDHp2Z4rCHw | 16:10, the net against the sky, 1200 px, colour (the Match requests card)                                                                                                                                 |
| `public/features/tournaments.webp`   | Sammy Swae                         | https://unsplash.com/photos/cneBYhGBUtM | 16:10, the squad and the trophy, 1200 px, black and white; every mark under a soft round blur (the arch's tournament name and logos, the trophy's plate, the sponsor and crests on the shirts and shorts) |
| `public/features/assistant.webp`     | Jeffrey F Lin                      | https://unsplash.com/photos/pSHpFB5WNUE | 16:10, the training sheet in two hands only (no faces, no logos), 740 px, colour                                                                                                                          |

The colour rule (WEBSITE 17, WEBSITE 19): a photo where a face is visible is black and white, in
the file itself. A photo with no visible face (from behind, legs, boots, the ball, turf, cones, a
goal, a net, equipment) is in colour, on the "What you get" cards too (WEBSITE 22: the calendar's
cones and the whiteboard back in colour; WEBSITE 19 had made them black and white). `src/config/photos.ts` lists every photo with
`faces` and `tone` (`grey` or `colour`), and `tests/unit/photos.test.ts` checks each file against
it. App screens are not photos and stay as the app shows them. Every file is under 120 KB and
loads lazily. The app's own screens are listed under "App screens (WEBSITE 18)" below. The
community strip shows only the first three portraits (coach-1 to coach-3); the other five files
stay but are not shown.

- The whiteboard crop leaves out the board maker's name; the same file also stands in the tactics
  section on screens where that section is not pinned.
- The squad crop leaves out the coach's shoes and shorts (makers' logos), the banner and the bench
  behind him.
- The cones photo stands for trainings on the "Calendar and events" card: there is no feature called
  training. It shows someone's legs and boots at a cone, from below the shorts.
- The Coach assistant card shows a training sheet in two coaches' hands (WEBSITE 17, in place of a
  stock portrait): the crop stops under the chins and above a maker's name on a shirt.

WEBSITE 17 re-checked the ten stock photos at full size for crops without faces, children or
marks (`review/website-17/stock-candidates.png`, not committed). Picked: the players from behind
(community) and the turf band (footer), both now in colour, and the training sheet in two hands
(assistant card), and the cones with someone's legs (calendar card, below the shorts, which carry
the club's name). A maker's logo on a boot or a ball is allowed; faces, children, club names and
league patches are not. Left out: the boots on the line (usable, but the footer already shows legs
on turf), legs walking (too thin a band to read), the ball close up (the same photo as the footer's
turf band).

## App screens (WEBSITE 18)

All own work / Rate Me: the app with demo data only (Sam Demo, Demo FC, Demo United, Demo Park,
Coach Robin Test, Coach Jamie Sample; no real person, club or face). Captured clean at 1170 x 2532
into `site-assets/screens/app` (not committed); here as webp, phones 780 px wide, each under 120 KB
(`tests/unit/app-shots.test.ts`). In colour, as the app shows them.

| File                                         | From (`site-assets/screens/app`) | Where                          | Crop                                                                             |
| -------------------------------------------- | -------------------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| `public/screens/coach-calendar.webp`         | `calendar.png`                   | Inside the app, coach view     | whole screen                                                                     |
| `public/screens/coach-whiteboard-roles.webp` | `whiteboard-roles.png`           | Inside the app, coach view     | whole screen                                                                     |
| `public/screens/coach-match.webp`            | `match-request-received.png`     | Inside the app, coach view     | whole screen                                                                     |
| `public/screens/player-home.webp`            | earlier capture (f5a7437)        | Inside the app, player view    | whole screen, now webp                                                           |
| `public/screens/player-event.webp`           | earlier capture (f5a7437)        | Inside the app, player view    | whole screen, now webp                                                           |
| `public/screens/player-card.webp`            | `player-card.png`                | Inside the app, player view    | whole screen (WEBSITE 20, in place of the drawn card)                            |
| `public/features/squad.webp`                 | `player-card.png`                | Squad card                     | 16:10, the shield only (under the style switch), sides widened with its own rays |
| `public/features/squad-detail.webp`          | `squad.png`                      | Squad dialog, in a phone       | top of the list, seven whole rows, cut above the tab bar                         |
| `public/features/parentReport.webp`          | `report-1.png`                   | Monthly report card, as paper  | the top of page 1                                                                |
| `public/features/parentReport-detail.webp`   | `report-1.png`                   | Report dialog, as paper        | page 1 down to the coach rating                                                  |
| `public/features/parentReport-detail-2.webp` | `report-2.png`                   | Report dialog, as paper        | page 2 down to its footer                                                        |
| `public/features/matchRequests-detail.webp`  | `match-request-card.png`         | Match requests dialog, a phone | whole screen (the Coaches Channel with the request card)                         |

`match-request-form.png` is not used: the received request and the channel say more in two
pictures. Since WEBSITE 19 the community shows these two screens in phones; the Match requests
card shows the goal net, and only its dialog the app. The WEBSITE 15 crops of
Screenshots 519 to 522 are gone, and the old PNG screens in `public/screens` with them.

## All 43 photos supplied

45 files in the download folder; two are byte-identical copies, so 43 photos.

| #   | Photo (Unsplash id)                     | Used                            | If not, why                                         |
| --- | --------------------------------------- | ------------------------------- | --------------------------------------------------- |
| 1   | Adria Crehuet Cano, LIhB1_mAGhY         | no                              | young children (minors)                             |
| 2   | Adria Crehuet Cano, yndHHu2kJAw         | no                              | a child (minor)                                     |
| 3   | Alex Suprun, UUp9z94QhLA                | community, coach-5              |                                                     |
| 4   | Alfonso Scarpa, 9tSPg_o2vHU             | no (was squad; now app screen)  |                                                     |
| 5   | Alliance Football Club, L2gFq37JlsM     | no                              | teenage players (minors), sponsor board             |
| 6   | Alliance Football Club, dHXegHI3Jlc     | no                              | teenage players (minors)                            |
| 7   | Alyona Grishina, BBmi4nJjKk8            | no                              | usable portrait; eight portraits are enough         |
| 8   | Artem Kryzhanivskyi, sEll8Ivzx1w        | community, coach-4              |                                                     |
| 9   | Arthur Debons, Mrql2Og2GU8              | community, coach-6              |                                                     |
| 10  | Beatriz Cattel, az3QxXQ7Fqc             | no (was assistant)              | replaced by the stock crop of a training sheet      |
| 11  | Centre for Ageing Better, 5c5GDBThnoo   | no                              | off topic (a community sports hall)                 |
| 12  | Chris Kursikowski, mkiMSN-beYg          | no                              | a professional stadium: club and venue marks        |
| 13  | Christian Buehner, 5YpZpFy8zzU          | community, coach-7              |                                                     |
| 14  | Colin Lloyd, QyLJpC8rChY                | no                              | a competition ball (its starball pattern)           |
| 15  | Connor Coyne, OgqWLzWRSaI               | no                              | a branded ball (logo)                               |
| 16  | Dong Xie, DH6QJpTG_CY                   | no                              | children (minors)                                   |
| 17  | Emilio Geremia, QIo9nrTceTw             | no                              | children (minors), kit logo                         |
| 18  | Erik Lucatero, d2MSDujJl2g              | no                              | may be under 18                                     |
| 19  | Fernando Cferdophotography, kyjUvRNAgoE | no                              | usable portrait; coloured light does not suit B&W   |
| 20  | James Lee, 0axqBrI8Or4                  | no                              | children (minors)                                   |
| 21  | Jasper Benning, Ri4FXmD7DPM             | feature card: whiteboard        | also in the tactics section                         |
| 22  | Jeffrey F Lin, 82zYqrbBfPA              | no                              | branded boots (logo)                                |
| 23  | Jeffrey F Lin, pSHpFB5WNUE              | no                              | sponsor boards of a professional club               |
| 24  | Jerome, nDHp2Z4rCHw                     | feature card: match requests    |                                                     |
| 25  | Jorge Salvador, iGzHMzRZjRs             | no                              | a logo on the T-shirt                               |
| 26  | Josias Garibay, rifCUO-4X8k             | community, coach-2              |                                                     |
| 27  | Lars Bo Nielsen, zXn5qinCDKg            | no                              | youth match (minors), kit logos                     |
| 28  | Levi Meir Clancy, KIWxM_XvLlI           | no (was the drawn player card)  | replaced by the app's own card screen (WEBSITE 20)  |
| 29  | Lucas Clarysse, yMxLAdXh8Wc             | community, coach-8              |                                                     |
| 30  | Markus Spiske, KWQ2kQtxiKE              | no (now the app's own screen)   |                                                     |
| 31  | Martin Baron, X9WZPIpkbn0               | no                              | may be under 18                                     |
| 32  | Mostafa Kordzangeneh, \_tcJW4nqVtw      | community, coach-1              |                                                     |
| 33  | Nygi, 8IWsvdk2Plw                       | no (was report; now app screen) |                                                     |
| 34  | Oghenovo Egbegbedia, vsJsZmm0zv4        | no (was calendar)               | replaced by a stock crop with a person at the cones |
| 35  | Oghenovo Egbegbedia, xrwEqCaofws        | no                              | the same cones as #34, closer: a duplicate scene    |
| 36  | Omar Ramadan, Z8hTy2q9dGY               | no                              | sponsor marks on the kits, a branded ball           |
| 37  | Omar Ramadan, eEhOyEtBGMQ               | no                              | children (minors); its copy "(1)" is the same file  |
| 38  | Omar Ramadan, htGM-eEzsdk               | no                              | text on the shirts, a printed banner                |
| 39  | Omar Ramadan, wdQz3RbcOgQ               | no                              | sponsor text on a shirt                             |
| 40  | Omar Ramadan, xpMS7Ry_fNY               | no                              | a maker's name on the top, a branded ball           |
| 41  | Quilia, AvcBDbR-LWc                     | no                              | children (minors); its copy "(1)" is the same file  |
| 42  | Some Tale, dJNtSjCDc74                  | no                              | usable portrait; eight portraits are enough         |
| 43  | Vicky Hladynets, \_gDoyVv5F4c           | community, coach-3              |                                                     |

## Screenshots and photos supplied for WEBSITE 15

Screenshots (`site-assets/screens`, not committed) are our own work, Rate Me. Only the app's own
area is taken from them, never a name, a face or a club:

- Screenshots (519) to (522): the Coaches Channel, the Request a match form, a monthly report and
  its player card section. Used in WEBSITE 15, replaced in WEBSITE 18 by the clean demo captures
  above; no longer on the site.
- Screenshot (524): a player card with a real child's name and face. Not used, not even cropped.

The ten Unsplash photos (`site-assets/stock`, not committed):

| Photo (Unsplash id)                 | Used               | If not, why                                                                                    |
| ----------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| Danylo Suprun, 5CBdeiqh4mI          | community          | three players from behind, sharp                                                               |
| Omar Ramadan, htGM-eEzsdk           | footer (turf band) | cropped below the knees: no faces                                                              |
| Alliance Football Club, dHXegHI3Jlc | no                 | children's faces                                                                               |
| Alliance Football Club, g8cK31aYH3E | calendar card      | legs, boots and a cone only; the club name on the shorts, the child and the banner cropped out |
| Jeffrey F Lin, nKcx6jbFE-A          | no                 | a league's patch on the sleeve                                                                 |
| Jeffrey F Lin, pSHpFB5WNUE          | assistant card     | hands and the sheet only; boards, faces and the shirt's maker name cropped out                 |
| Lars Bo Nielsen, xewH-utuFYA        | no                 | recognisable faces, sponsors' logos                                                            |
| Maximilian Müller, TdjvE-SnB34      | no                 | a real club's name across the shirts                                                           |
| Md Mahdi, FSNXh_gQ81Q               | no                 | children's faces, a tournament's branding                                                      |
| Sammy Swae, cneBYhGBUtM             | tournaments card   | adults only; the arch, the trophy's plate, sponsors and crests blurred; black and white        |
