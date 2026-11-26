'use client';

import { useEffect, useState } from 'react';

/** Section links; the one being read is underlined. On other pages none is. */
export function NavLinks({
  home,
  links,
  stacked = false,
}: {
  home: string;
  links: { id: string; label: string }[];
  /** One under the other, large: the phone's menu. */
  stacked?: boolean;
}) {
  const [active, setActive] = useState('');

  useEffect(() => {
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        setActive([...visible][0] ?? '');
      },
      // A thin line at 40% of the screen: one section crosses it at a time.
      { rootMargin: '-40% 0px -59% 0px' },
    );
    for (const { id } of links) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [links]);

  return (
    <ul className={stacked ? 'menu-links' : 'bar-links'}>
      {links.map(({ id, label }) => (
        <li key={id}>
          <a
            href={`${home}#${id}`}
            aria-current={id === active ? 'location' : undefined}
            className="nav-link"
          >
            <span>{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
