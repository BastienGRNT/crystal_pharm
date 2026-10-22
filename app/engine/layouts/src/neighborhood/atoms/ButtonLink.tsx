import type { JSX } from 'solid-js';

export function ButtonLink(props: { href: string; variant: 'primary' | 'secondary'; children: JSX.Element }) {
  return (
    <a class={`nb-button nb-button--${props.variant}`} href={props.href}>
      {props.children}
    </a>
  );
}
