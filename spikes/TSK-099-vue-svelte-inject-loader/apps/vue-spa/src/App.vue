<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Icon from './generated/Icon.vue';
import SvgwormLoader from './generated/SvgwormLoader.vue';

const shown = ref(true);
onMounted(() => {
  document.documentElement.dataset.mounted = '1';
});
</script>

<template>
  <SvgwormLoader v-if="shown" />
  <button id="toggle" @click="shown = !shown">toggle loader</button>
  <span id="icon" style="display: inline-block; color: #ff0000; line-height: 0">
    <Icon name="figma-export" width="48" height="48" />
  </span>
</template>
