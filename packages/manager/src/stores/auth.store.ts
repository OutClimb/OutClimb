import type { JwtClaims } from "@/types/auth";
import { jwtDecode } from "jwt-decode";
import { defineStore } from "pinia";
import { computed } from "vue";
import { useRouter } from "vue-router";

export const useAuthStore = defineStore("auth", () => {
  const token = computed({
    get() {
      return localStorage.getItem("token");
    },
    set(newValue) {
      if (newValue === null) {
        localStorage.removeItem("token");
      } else {
        localStorage.setItem("token", newValue);
      }
    },
  });

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
      const data = await response.json();
      throw new Error(data.error);
    }

    const newToken = await response.text();
    token.value = newToken;
  }

  return {
    login,
    logout,
    token,
    user,
  };
});
