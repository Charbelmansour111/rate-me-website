'use client';

import { useEffect, useState } from 'react';

/** Section links; the one being read is underlined. On other pages none is. */
export function NavLinks({
  home,
  links,
}: {
  home: string;
  links: { id: string; label: string }[];
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
    <ul className="flex gap-8">
      {links.map(({ id, label }) => (
        <li key={id}>
          <a
            href={`${home}#${id}`}
            aria-current={id === active ? 'location' : undefined}
            className="group block min-w-11 py-2.5 text-center font-medium hover:text-accent-text"
          >
            <span className="border-b-2 border-transparent pb-0.5 group-aria-current:border-accent">
              {label}
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
}
