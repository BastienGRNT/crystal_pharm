<script lang="ts">
	import { phosphorIconPathsByName, type IconName } from './phosphorIcons';

	type IconProps = {
		name: IconName;
		size?: number;
	};

	let { name, size = 18 }: IconProps = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
	{@html phosphorIconPathsByName[name]}
</svg>
