<script lang="ts">
	let { label }: { label: string } = $props();
</script>

<span>{label}</span>

<style>
	span {
		font-size: 0.7rem;
		letter-spacing: 0.45em;
		color: #a1a1aa;
	}
</style>
