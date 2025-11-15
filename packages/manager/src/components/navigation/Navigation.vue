<script setup lang="ts">
import { Button } from "../ui/button";
import { FileText, Grid2x2, LogOut, Menu, Waypoints, X } from "lucide-vue-next";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { ref } from "vue";
import { RouterLink, useRoute } from "vue-router";

const authStore = useAuthStore();
const route = useRoute();

const isOpen = ref(false);

const handleLogout = () => {
  authStore.logout(true);
};

const toggleSidebar = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <Button
    variant="ghost"
    size="icon"
    :class="cn('absolute left-6 top-6 z-50 md:hidden', isOpen ? 'hidden' : '')"
    @click="toggleSidebar"
  >
    <X v-if="isOpen" />
    <Menu v-else />
  </Button>

  <div
    :class="
      cn(
        'fixed inset-y-0 left-0 z-40 shrink-0 grow-0 basis-(--sidebar-width) transform bg-sidebar transition-transform duration-200 ease-in-out md:relative md:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )
    "
  >
    <div class="flex h-full flex-col">
      <div class="flex h-16 items-center border-b px-6">
        <div class="flex items-center gap-2">
          <div class="h-8">
            <img
              src="@/assets/logo.svg"
              alt="OutClimb - Queer Climbing"
              class="h-8"
            />
          </div>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-4">
        <RouterLink
          to="/dashboard"
          :class="
            cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              route.path.startsWith('/dashboard')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )
          "
        >
          <Grid2x2 class="mr-3 h-5 w-5" />
          Dashboard
        </RouterLink>
        <RouterLink
          to="/form"
          :class="
            cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              route.path.startsWith('/form')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )
          "
        >
          <FileText class="mr-3 h-5 w-5" />
          Forms
        </RouterLink>
        <RouterLink
          to="/redirect"
          :class="
            cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
              route.path.startsWith('/redirect')
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )
          "
        >
          <Waypoints class="mr-3 h-5 w-5" />
          Redirects
        </RouterLink>
      </nav>

      <div class="mt-auto border-t px-3 py-4">
        <button
          class="cursor-pointer flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors w-full hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          @click="handleLogout"
        >
          <LogOut class="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  </div>

  <!-- Overlay for mobile -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-30 bg-black/50 md:hidden"
    @click="toggleSidebar"
  />
</template>
