import { Show } from 'solid-js';
import type { PrescriptionForm } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

function formatPlannedVisit(plannedVisitAt: string): string {
  if (!plannedVisitAt) return 'Dès que c’est prêt';
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(
    new Date(`${plannedVisitAt}:00Z`),
  );
}

/** Ce qui va se passer maintenant, et ce qu'il faudra apporter : la question qu'on se pose juste après avoir envoyé. */
export function PrescriptionSent(props: { form: PrescriptionForm }) {
  return (
    <div class="nb-sent" role="status">
      <span class="nb-sent__check" aria-hidden="true">
        <Icon name="check" />
      </span>
      <h2 class="nb-sent__title">C’est envoyé, merci {props.form.firstName} !</h2>
      <p class="nb-sent__lead">
        L’équipe prépare l’ordonnance de {props.form.firstName} {props.form.lastName}.
        <Show when={props.form.email} fallback={<> Nous vous appelons au {props.form.phone} si nous avons une question.</>}>
          {(email) => <> Un email part à {email()} dès que c’est prêt.</>}
        </Show>
      </p>
      <dl class="nb-recap">
        <div>
          <dt>Passage</dt>
          <dd>{formatPlannedVisit(props.form.plannedVisitAt)}</dd>
        </div>
        <div>
          <dt>Pages envoyées</dt>
          <dd>{1 + props.form.additionalPrescriptionPages.length}</dd>
        </div>
      </dl>
      <div class="nb-sent__bring">
        <strong>À apporter en venant</strong>
        <ul>
          <li>l’ordonnance originale, en papier ;</li>
          <li>votre carte Vitale.</li>
        </ul>
      </div>
      <a class="nb-button nb-button--secondary" href="/">
        Retour à l’accueil
      </a>
    </div>
  );
}
