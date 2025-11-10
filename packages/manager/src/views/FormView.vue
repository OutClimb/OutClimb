<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { onMounted, ref } from "vue";
import { Plus } from "lucide-vue-next";

const isLoading = ref(true);

onMounted(async () => {
  isLoading.value = false;
});

const handleCreate = () => {};
</script>

<template>
  <header class="mb-8 ml-12 md:ml-0">
    <h1 class="flex items-center text-3xl font-bold tracking-tight">
      <span class="flex-auto">Forms</span>
      <Button variant="default" @click="{ handleCreate }">
        <Plus />
        Create Form
      </Button>
    </h1>
  </header>
  <div class="rounded-lg border shadow-sm"></div>
</template>
