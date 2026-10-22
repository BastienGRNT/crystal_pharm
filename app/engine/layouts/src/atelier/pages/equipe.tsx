import { Show } from 'solid-js';
import { definePage } from '@crystal-pharm/renderer';
import type { AtelierSettings } from '../atelierSettingsSchema';
import { AsymmetricGridTemplate } from '../templates/AsymmetricGridTemplate';

export default definePage<AtelierSettings>({
  title: "L'équipe",
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'at-legal-notice' }),
      children: (
        <AsymmetricGridTemplate pharmacy={props.pharmacy} modules={props.modules} accentTone={props.settings.accentTone} currentPath="/equipe">
          <Show when={props.modules.team} fallback={<p class="at-unavailable">Cette page n'est pas disponible.</p>}>
            <props.pageKit.Module name="team" />
          </Show>
        </AsymmetricGridTemplate>
      ),
    }),
});
