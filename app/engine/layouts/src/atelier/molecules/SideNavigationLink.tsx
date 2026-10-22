export function SideNavigationLink(props: { href: string; label: string; isCurrent: boolean }) {
  return (
    <a class="at-side-link" classList={{ 'at-side-link--current': props.isCurrent }} href={props.href} aria-current={props.isCurrent ? 'page' : undefined}>
      {props.label}
    </a>
  );
}
