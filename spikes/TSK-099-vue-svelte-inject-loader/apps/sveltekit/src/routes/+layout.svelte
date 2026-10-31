<script lang="ts">
  import { onMount } from 'svelte';
  import SvgwormLoader from '../lib/SvgwormLoader.svelte';

  let { children } = $props();
  let shown = $state(true);
  onMount(() => {
    document.documentElement.dataset.mounted = '1';
  });
</script>

{#if shown}<SvgwormLoader />{/if}
<button id="toggle" onclick={() => (shown = !shown)}>toggle loader</button>
{@render children()}
