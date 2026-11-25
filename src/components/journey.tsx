import type { ReactNode } from 'react';

/**
 * The scroll journey: locker room, tunnel, pitch. Each group of sections has its scene behind it,
 * stuck to the screen. That alone works everywhere; motion.css turns the scenes into one layer that
 * crossfades and moves with the scroll where the browser can. All drawings are original.
 */
export type SceneId = 'locker' | 'tunnel' | 'pitch';

const FRAME = {
  viewBox: '0 0 1440 900',
  preserveAspectRatio: 'xMidYMid slice',
  fill: 'none',
  stroke: 'var(--scene)',
  strokeWidth: 2,
  className: 'absolute inset-0 size-full',
} as const;
const HINT = { stroke: 'var(--accent)', opacity: 0.55 };

function Locker() {
  return (
    <>
      <div className="scene-layer locker-back">
        <svg {...FRAME}>
          <path d="M0 120H1440 M0 640H1440" />
          {/* Lockers, either side of the board */}
          {[40, 190, 340, 960, 1110, 1260].map((x, i) => (
            <g key={x}>
              <path
                d={`M${x} 160h130v470h-130Z M${x + 14} 178h102v210h-102Z M${x + 14} 404h102v212h-102Z`}
              />
              <path d={`M${x + 36} 200h58 M${x + 36} 214h58 M${x + 36} 228h58`} />
              <path d={`M${x + 100} 290v26`} {...(i % 3 === 1 ? HINT : {})} strokeWidth="4" />
            </g>
          ))}
          {/* A kit on its hook */}
          <path
            d="M405 178v-14 M405 178l-34 22-18 44 22 8 8-16v96h44v-96l8 16 22-8-18-44Z"
            fill="var(--soft)"
          />
          <path d="M392 262h26v34h-26Z" {...HINT} />
          {/* Tactics board */}
          <path d="M560 180h320v220H560Z M560 290h320 M720 250a40 40 0 1 0 .1 0 M640 180v44h160v-44 M640 400v-44h160v44" />
          <path d="M610 350q40-60 110-50 M706 288l16 12-18 10" {...HINT} strokeWidth="3" />
          <path d="M620 240l16 16 M636 240l-16 16 M820 330l16 16 M836 330l-16 16" />
        </svg>
      </div>
      <div className="scene-layer scene-near locker-front">
        <svg {...FRAME}>
          {/* Bench, boots and a ball on the floor */}
          <path
            d="M120 700H1320V732H120Z M180 732V820 M1260 732V820 M720 732V820"
            fill="var(--soft)"
          />
          <path
            d="M360 698c0-26 4-40 12-46h30c2 16 20 22 46 28 14 4 14 18 10 18Z M368 704v8 M392 704v8 M416 704v8 M440 704v8"
            fill="var(--soft)"
          />
          <path
            d="M470 698c0-26 4-40 12-46h30c2 16 20 22 46 28 14 4 14 18 10 18Z"
            fill="var(--soft)"
          />
          <path d="M372 672h24 M482 672h24" {...HINT} strokeWidth="3" />
          <path
            d="M1010 790a34 34 0 1 1 .1 0Z M1010 744l16 12-6 18h-20l-6-18Z"
            fill="var(--soft)"
          />
          <path d="M0 830H1440 M0 830L-120 900 M300 830L240 900 M720 830V900 M1140 830L1200 900" />
        </svg>
      </div>
    </>
  );
}

/** A doorway of the tunnel, shrinking towards the light. */
const doorway = (k: number) => {
  const [x, y] = [720, 380];
  const [w, up, down] = [760 * k, 420 * k, 560 * k];
  return `M${x - w} ${y + down}V${y - up * 0.7}L${x - w * 0.8} ${y - up}H${x + w * 0.8}L${x + w} ${y - up * 0.7}V${y + down}`;
};

function Tunnel() {
  return (
    <>
      <div className="scene-layer tunnel-walls">
        <svg {...FRAME}>
          <path d="M720 380L-60 980 M720 380L1500 980 M720 380L-60 70 M720 380L1500 70 M720 380L80 -60 M720 380L1360 -60" />
          <path d="M720 380L360 980 M720 380L1080 980" />
          <path d="M720 380L-60 560 M720 380L1500 560" {...HINT} strokeWidth="3" />
        </svg>
      </div>
      <div className="scene-layer scene-near tunnel-doors">
        <svg {...FRAME}>
          {[0.95, 0.62, 0.4, 0.26, 0.17].map((k) => (
            <path key={k} d={doorway(k)} />
          ))}
        </svg>
      </div>
      <div className="scene-layer tunnel-light" />
    </>
  );
}

function Player({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} fill="var(--soft)" strokeLinejoin="round">
      {/* Running: head, shirt, arms, then the legs mid-stride */}
      <path d="M4 -70a8 8 0 1 1 .1 0Z" />
      <path d="M-8 -66L10 -67L8 -38L-9 -36Z" />
      <path d="M-8 -65L-20 -52L-12 -42 M10 -66L20 -54L30 -60" strokeLinecap="round" fill="none" />
      <path d="M-9 -36L8 -38L14 -24L2 -22L-2 -26L-10 -20L-14 -26Z" />
      <path
        d="M9 -23L20 -14L16 -1L23 0 M-12 -22L-22 -10L-34 -12L-37 -7"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function Pitch() {
  return (
    <>
      <div className="scene-layer scene-near pitch-back">
        <svg {...FRAME}>
          {/* Stand and floodlights */}
          <path d="M0 330H1440 M0 270L1440 270 M0 300H1440 M0 240L120 220H1320L1440 240" />
          {[180, 1260].map((x) => (
            <path
              key={x}
              d={`M${x} 330V90 M${x - 50} 50h100v50h-100Z M${x - 25} 50v50 M${x} 50v50 M${x + 25} 50v50 M${x - 50} 75h100`}
            />
          ))}
        </svg>
      </div>
      <div className="scene-layer pitch-front">
        <svg {...FRAME}>
          <path d="M0 360H1440V900H0Z" fill="var(--soft)" stroke="none" />
          {/* Mowed stripes, seen from the touchline */}
          {[0, 2, 4, 6].map((i) => (
            <path
              key={i}
              d={`M${200 + i * 150} 360H${350 + i * 150}L${-700 + (i + 1) * 410} 900H${-700 + i * 410}Z`}
              fill="var(--page)"
              stroke="none"
            />
          ))}
          <path d="M0 360H1440 M720 360L720 900" />
          <path d="M720 470c160 0 290 34 290 76s-130 76-290 76-290-34-290-76 130-76 290-76Z" />
          <path d="M1080 360L1300 480H1440 M1180 360L1290 410H1440" />
          {/* Goal */}
          <path
            d="M1290 396V300H1410V396 M1310 300l-20-14H1390l20 14 M1314 300v90 M1338 300v90 M1362 300v90 M1386 300v90 M1290 324H1410 M1290 348H1410"
            strokeWidth="2.5"
          />
          <path d="M-40 860L1480 860" {...HINT} strokeWidth="4" />
          <Player x={420} y={480} size={1} />
          <Player x={980} y={500} size={1.1} />
          <Player x={1130} y={430} size={0.8} />
          <Player x={250} y={700} size={1.9} />
          <circle
            cx="345"
            cy="690"
            r="16"
            fill="var(--brand-orange)"
            stroke="var(--brand-black)"
            opacity="0.8"
          />
        </svg>
      </div>
    </>
  );
}

const SCENES = { locker: Locker, tunnel: Tunnel, pitch: Pitch };

export function JourneyGroup({
  scene,
  caption,
  children,
}: {
  scene: SceneId;
  caption: string;
  children: ReactNode;
}) {
  const Scene = SCENES[scene];
  return (
    <div className="journey-group" data-journey={scene}>
      <div className="scene" aria-hidden="true">
        <Scene />
      </div>
      <div className="journey-content">
        <div className="journey-opener">
          <p className="journey-caption">{caption}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
