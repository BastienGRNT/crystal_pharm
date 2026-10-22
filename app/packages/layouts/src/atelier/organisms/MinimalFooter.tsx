import type { PharmacyInfo } from '@crystal-pharm/schema';

export function MinimalFooter(props: { pharmacy: Readonly<PharmacyInfo> }) {
  return (
    <footer class="at-footer">
      <span>© {props.pharmacy.name}</span>
      <a href="#top">Haut de page ↑</a>
    </footer>
  );
}
