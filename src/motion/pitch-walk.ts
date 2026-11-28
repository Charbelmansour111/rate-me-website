import { sceneAt, stageRanges } from '@/config/journey.config';

import { buildPlay, passPath, type Built, type Frame } from './play-engine';
import { PLAYER_IDS, PLAYS, type PlayerId } from './plays';
import { followStages } from './stages';
import { mirror } from './tactics-data';

/**
 * The phone's background (WEBSITE 27): not the photo walk (its 960 px frames are blurry cropped to a
 * phone, and a slideshow), but the site's own tactics-board drawing, sharp at any screen density,
 * driven by the scroll. A faint pitch pans slowly behind as the page goes down; over it, the hero
 * board's plays, one for each part of the page (the locker room, the tunnel, the tactics, the
 * field): as the page scrolls the players run their routes, the ball is passed, and the passes and
 * run lines draw themselves in orange. No photo is fetched, decoded or drawn on a phone.
 *
 * One draw a frame, only when the scroll moved (or the theme or size changed); everything is built
 * once, so a frame allocates nothing; no filter, no shadow. Light theme: a white ground with black
 * and orange lines; dark: black with white and orange. The panels change colour once a stage
 * (src/motion/stages.ts). Under reduced motion this never runs: CSS shows a still drawing.
 */

/** Which play for which part of the walk (0 to 1), in order. */
const PARTS: { to: number; play: string }[] = [
  { to: stageRanges.locker.to, play: 'rondo' },
  { to: 0.45, play: 'overlap' },
  { to: stageRanges.tunnel.to, play: 'through' },
  { to: 1, play: 'switch' },
];
/** The board, in its own units (src/motion/plays.ts). */
const BOARD_W = 480;
const BOARD_H = 420;
/** The pitch behind, in board units: about two boards long, panned over the whole page. */
const PITCH_H = 1500;
const ORANGE = '#ff5a00';
const COLOURS = {
  light: {
    ground: '#fffcf7',
    line: '#0b0b0c',
    faint: 'rgba(11, 11, 12, 0.14)',
    board: 'rgba(11, 11, 12, 0.32)',
    label: '#fffcf7',
  },
  dark: {
    ground: '#0b0b0c',
    line: '#ffffff',
    faint: 'rgba(255, 255, 255, 0.13)',
    board: 'rgba(255, 255, 255, 0.3)',
    label: '#0b0b0c',
  },
};

/** Where a list of frames is at `t` (0 to 1), into `out`: no allocation. */
function sampleInto(frames: Frame[], t: number, out: [number, number]) {
  let i = 1;
  while (i < frames.length - 1 && frames[i].offset < t) i++;
  const a = frames[i - 1];
  const b = frames[i];
  const span = b.offset - a.offset;
  const k = span > 0 ? Math.min(1, Math.max(0, (t - a.offset) / span)) : 1;
  const e = k * k * (3 - 2 * k);
  out[0] = a.point[0] + (b.point[0] - a.point[0]) * e;
  out[1] = a.point[1] + (b.point[1] - a.point[1]) * e;
}

/** The length of a pass's curve and its arrowhead, for drawing it in by a dash. */
function passLength({ from, bend, to }: Built['passes'][number]) {
  let length = 24;
  let [px, py] = from;
  for (let k = 1; k <= 24; k++) {
    const t = k / 24;
    const x = (1 - t) ** 2 * from[0] + 2 * (1 - t) * t * bend[0] + t * t * to[0];
    const y = (1 - t) ** 2 * from[1] + 2 * (1 - t) * t * bend[1] + t * t * to[1];
    length += Math.hypot(x - px, y - py);
    [px, py] = [x, y];
  }
  return length;
}

type Part = {
  from: number;
  to: number;
  built: Built;
  passes: { path: Path2D; length: number; begin: number; end: number }[];
  /** Each player's route (where it ran), and the frames it runs on. */
  runs: { id: PlayerId; frames: Frame[]; attacker: boolean; label: string }[];
};

export function startPitchWalk(canvas: HTMLCanvasElement, signal: AbortSignal) {
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return;
  const ctx = context;
  const root = document.documentElement;
  const rtl = root.dir === 'rtl';
  const page = canvas.parentElement!;
  const LABELS = ['6', '8', '10', '7'];

  // Everything built once
  let start = 0;
  const parts: Part[] = PARTS.map(({ to, play: id }) => {
    const play = PLAYS.find((p) => p.id === id) ?? PLAYS[0];
    const built = buildPlay(play);
    const part: Part = {
      from: start,
      to,
      built,
      passes: built.passes.map((pass) => {
        // Each pass flies 0.2 to 1.1 s into its phase (src/motion/play-engine.ts)
        const begin = (0.9 + pass.phase * 1.7 + 0.2) / built.duration;
        return {
          path: new Path2D(passPath(pass, rtl)),
          length: passLength(pass),
          begin,
          end: begin + 0.9 / built.duration,
        };
      }),
      runs: PLAYER_IDS.map((pid) => ({
        id: pid,
        frames: built.players[pid].map((f) => ({ ...f, point: mirror(f.point, rtl) })),
        attacker: pid.startsWith('a'),
        label: pid.startsWith('a') ? LABELS[Number(pid[1])] : '',
      })),
    };
    built.ball = built.ball.map((f) => ({ ...f, point: mirror(f.point, rtl) }));
    start = to;
    return part;
  });
  // The board's lines, and the pitch behind, as paths
  const board = new Path2D(
    'M14 30H466V406H14Z M120 30V126H360V30 M184 30V66H296V30 M194 126A52 52 0 0 0 286 126 M184 406A56 56 0 0 1 296 406',
  );
  const goal = new Path2D('M204 30V12H276V30');
  const pitch = new Path2D(
    // Two halves of a pitch, goal to goal, 480 wide and PITCH_H long, with both boxes and the
    // centre circle
    `M0 0H480V${PITCH_H}H0Z M0 ${PITCH_H / 2}H480 M${240 + 70} ${PITCH_H / 2}A70 70 0 1 0 ${240 - 70} ${PITCH_H / 2}A70 70 0 1 0 ${240 + 70} ${PITCH_H / 2} M100 0V150H380V0 M175 0V55H305V0 M100 ${PITCH_H}V${PITCH_H - 150}H380V${PITCH_H} M175 ${PITCH_H}V${PITCH_H - 55}H305V${PITCH_H}`,
  );
  const point: [number, number] = [0, 0];

  // Size: the screen, at up to twice its density
  let width = 0;
  let height = 0;
  let dpr = 1;
  let end = 1;
  const measure = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    width = innerWidth;
    height = innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    end = Math.max(1, page.offsetTop + page.offsetHeight - innerHeight);
    drawn = -1;
  };

  const stages = followStages(signal, () => true);
  // No header line, dim or running line driven from here: measured on a phone at 4x, they cost a
  // third of its frames (WEBSITE 27). The header's line follows the scroll in CSS (a scroll-driven
  // animation, on the compositor); the running line is the still one, every node filled.
  let drawn = -1;
  let theme = '';

  function draw(progress: number) {
    const colours = COLOURS[root.dataset.theme === 'dark' ? 'dark' : 'light'];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = colours.ground;
    ctx.fillRect(0, 0, width, height);
    // The board fits the screen's width, a little inside; the pitch behind is wider still
    const scale = Math.min((width - 24) / BOARD_W, (height * 0.62) / BOARD_H);
    const left = (width - BOARD_W * scale) / 2;
    const top = (height - BOARD_H * scale) / 2;
    // The pitch pans slowly the whole way down
    const pitchScale = (width * 1.15) / 480;
    const pan = progress * (PITCH_H * pitchScale - height);
    ctx.setTransform(
      dpr * pitchScale,
      0,
      0,
      dpr * pitchScale,
      (dpr * (width - 480 * pitchScale)) / 2,
      -dpr * pan,
    );
    ctx.strokeStyle = colours.faint;
    ctx.lineWidth = 2 / pitchScale;
    ctx.stroke(pitch);

    // The part of the walk, and how far through its play
    let n = 0;
    while (n < parts.length - 1 && progress >= parts[n].to) n++;
    const part = parts[n];
    const t = Math.min(1, Math.max(0, (progress - part.from) / (part.to - part.from)));

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * left, dpr * top);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colours.board;
    ctx.lineWidth = 2;
    ctx.stroke(board);
    ctx.strokeStyle = colours.line;
    ctx.lineWidth = 4;
    ctx.stroke(goal);

    // The run lines: where each attacker has run so far
    ctx.strokeStyle = colours.line;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    for (const run of part.runs) {
      if (!run.attacker) continue;
      const frames = run.frames;
      ctx.beginPath();
      ctx.moveTo(frames[0].point[0], frames[0].point[1]);
      for (let i = 1; i < frames.length && frames[i - 1].offset < t; i++) {
        if (frames[i].offset <= t) ctx.lineTo(frames[i].point[0], frames[i].point[1]);
        else {
          sampleInto(frames, t, point);
          ctx.lineTo(point[0], point[1]);
        }
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // The passes, drawn in as they fly
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = 3.5;
    for (const pass of part.passes) {
      if (t <= pass.begin) continue;
      const k = Math.min(1, (t - pass.begin) / (pass.end - pass.begin));
      ctx.setLineDash([pass.length, pass.length]);
      ctx.lineDashOffset = pass.length * (1 - k);
      ctx.stroke(pass.path);
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // The players and the ball
    ctx.font = '600 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const run of part.runs) {
      sampleInto(run.frames, t, point);
      const [x, y] = point;
      ctx.beginPath();
      if (run.attacker) {
        ctx.arc(x, y, 17, 0, Math.PI * 2);
        ctx.fillStyle = colours.line;
        ctx.fill();
        ctx.fillStyle = colours.label;
        ctx.fillText(run.label, x, y + 1);
      } else {
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = colours.ground;
        ctx.fill();
        ctx.strokeStyle = colours.line;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - 5, y - 5);
        ctx.lineTo(x + 5, y + 5);
        ctx.moveTo(x + 5, y - 5);
        ctx.lineTo(x - 5, y + 5);
        ctx.stroke();
      }
    }
    sampleInto(part.built.ball, t, point);
    ctx.beginPath();
    ctx.arc(point[0], point[1], 7, 0, Math.PI * 2);
    ctx.fillStyle = ORANGE;
    ctx.fill();
    ctx.strokeStyle = colours.line;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // One draw a frame, only when the scroll, the size or the theme changed
  let frame = 0;
  const render = () => {
    frame = 0;
    const progress = Math.min(1, Math.max(0, scrollY / end));
    const now = root.dataset.theme ?? '';
    if (progress === drawn && now === theme) return;
    drawn = progress;
    theme = now;
    draw(progress);
    stages(progress);
    if (root.dataset.scene !== sceneAt(progress)) root.dataset.scene = sceneAt(progress);
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  measure();
  render();
  addEventListener('scroll', schedule, { passive: true, signal });
  addEventListener('resize', () => (measure(), schedule()), { signal });
  const themed = new MutationObserver(schedule);
  themed.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  const sized = new ResizeObserver(() => (measure(), schedule()));
  root.dataset.journey = 'on';
  canvas.dataset.vector = '';
  signal.addEventListener('abort', () => {
    cancelAnimationFrame(frame);
    themed.disconnect();
    sized.disconnect();
    delete canvas.dataset.vector;
    delete root.dataset.journey;
    delete root.dataset.scene;
  });
}
