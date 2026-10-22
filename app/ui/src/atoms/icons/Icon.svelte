<script lang="ts">
	import { iconPaths, type IconName } from './icons';

	type IconProps = {
		name: IconName;
		size?: number;
		class?: string;
	};

	let { name, size = 18, class: className = '' }: IconProps = $props();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 256 256"
	fill="currentColor"
	aria-hidden="true"
	class="flex-none {className}"
>
	<path d={iconPaths[name]} />
</svg>
