<script setup lang="ts">
import { LoginForm } from "@/components/login-form";
</script>

<template>
  <main
    class="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50"
  >
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <img
          src="@/assets/logo.svg"
          alt="OutClimb Queer Climbing"
          class="h-24 w-auto mx-auto"
        />
      </div>
      <LoginForm />
    </div>
  </main>
</template>
