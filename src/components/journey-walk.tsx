import type { ReactNode } from 'react';
import { preload } from 'react-dom';

import { frameUrl, scenes, stillFrame, type SceneId } from '@/config/journey.config';
import { getDictionary, type Locale } from '@/i18n';

const still = (scene: SceneId) => ({ backgroundImage: `url(${frameUrl(stillFrame[scene])})` });

/**
 * The walk from the locker room to the pitch, behind the page. The canvas carries the first frame
 * as its background, so it is there at first paint; src/motion/walk.ts draws the rest.
 */
export function WalkCanvas() {
  preload(frameUrl(0), { as: 'image', fetchPriority: 'high' });
  return <canvas data-walk className="walk" aria-hidden="true" style={still('locker')} />;
}

/** A part of the page. Without scrubbing, one still picture stands behind it. */
export function WalkGroup({ scene, children }: { scene: SceneId; children: ReactNode }) {
  return (
    <div className="walk-group">
      <div className="walk-still" aria-hidden="true" style={still(scene)} />
      <div className="walk-content">{children}</div>
    </div>
  );
}

/**
 * An open view between two sections. The script shows the label of the scene in view, in the
 * first gap of each scene; without it, `label` says which gap has one.
 */
export function WalkGap({ label, locale }: { label?: SceneId; locale: Locale }) {
  const t = getDictionary(locale).journey;
  return (
    <div className="walk-gap" data-walk-gap aria-hidden="true">
      {(Object.keys(scenes) as SceneId[]).map((id) => (
        <p key={id} className="walk-label" data-label={id} data-default={id === label || undefined}>
          {t[id]}
        </p>
      ))}
    </div>
  );
}
