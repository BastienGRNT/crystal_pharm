import type { JSX } from 'solid-js';

export function ArrowLink(props: { href: string; children: JSX.Element }) {
  return (
    <a class="at-arrow-link" href={props.href}>
      <span>{props.children}</span>
      <span class="at-arrow-link__arrow" aria-hidden="true">
        →
      </span>
    </a>
  );
}
