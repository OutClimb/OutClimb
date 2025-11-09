import type { JwtClaims } from "@/types/auth";
import { jwtDecode } from "jwt-decode";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token"));
  const user = computed(() => {
    if (!token.value) {
      return null;
    }

    const claims = jwtDecode<JwtClaims>(token.value);
    return claims.usr;
  });

  const router = useRouter();
  function logout(redirect: boolean = true) {
    token.value = null;
    localStorage.removeItem("token");
    if (redirect) {
      router.push("/");
    }
  }

  async function login(username: string, password: string) {
    const response = await fetch("/api/v1/token", {
      body: JSON.stringify({
        username,
        password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newToken = await response.text();
    token.value = newToken;
    localStorage.setItem("token", newToken);
  }

  return {
    login,
    logout,
    token,
    user,
  };
});
