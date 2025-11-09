<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navigation from "./components/navigation/Navigation.vue";

const route = useRoute();
const isLogin = computed(() => route.path === "/");
</script>

<template>
  <RouterView v-if="isLogin" />
  <div v-else class="flex min-h-screen w-screen flex-col md:flex-row">
    <Navigation />
    <main
      class="grow shrink basis-full w-full min-h-screen p-6 md:p-10 md:basis-(--body-width) md:w-(--body-width)"
    >
      <RouterView />
    </main>
  </div>
</template>
