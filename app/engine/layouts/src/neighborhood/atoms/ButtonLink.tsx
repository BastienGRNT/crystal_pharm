import type { JSX } from 'solid-js';
import { Icon, type IconName } from './Icon';

export function ButtonLink(props: { href: string; variant: 'primary' | 'secondary' | 'inverted'; icon?: IconName; children: JSX.Element }) {
  return (
    <a class={`nb-button nb-button--${props.variant}`} href={props.href}>
      {props.icon ? <Icon name={props.icon} /> : null}
      <span>{props.children}</span>
    </a>
  );
}
