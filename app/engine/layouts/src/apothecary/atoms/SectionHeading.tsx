import { Ornament } from './Ornament';

export function SectionHeading(props: { id: string; children: string }) {
  return (
    <div class="ap-heading-group">
      <h2 class="ap-heading" id={props.id}>
        {props.children}
      </h2>
      <Ornament />
    </div>
  );
}
