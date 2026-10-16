<script setup lang="ts">
import Icon from './components/Icon.vue';
</script>

<template>
  <Icon name="home" title="Home" class="icon" :width="24" data-id="x" />
  <!-- @vue-expect-error an unknown icon name is a type error -->
  <Icon name="nope" />
</template>
