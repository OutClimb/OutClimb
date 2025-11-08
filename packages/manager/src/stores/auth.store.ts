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
    return claims.user;
  });

  const router = useRouter();
  function logout(redirect: boolean = true) {
    token.value = null;
    localStorage.removeItem("token");
    if (redirect) {
      router.push("/login");
    }
  }

  return {
    logout,
    token,
    user,
  };
});
