<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from './generated/Icon.svelte';
  import SvgwormLoader from './generated/SvgwormLoader.svelte';

  let shown = $state(true);
  onMount(() => {
    document.documentElement.dataset.mounted = '1';
  });
</script>

{#if shown}<SvgwormLoader />{/if}
<button id="toggle" onclick={() => (shown = !shown)}>toggle loader</button>
<span id="icon" style="display: inline-block; color: #ff0000; line-height: 0">
  <Icon name="figma-export" width="48" height="48" />
</span>
