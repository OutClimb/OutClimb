import { computed, reactive } from "vue";
import { defineStore } from "pinia";
import type { Redirect } from "@/types/redirect";
import { useAuthStore } from "./auth.store";

export const useRedirectStore = defineStore("redirect", () => {
  const { token } = useAuthStore();
  const redirectMap = reactive<Record<number, Redirect>>({});

  const redirects = computed(() => {
    return Object.values(redirectMap);
  });

  const create = async (
    fromPath: string,
    startsOn: number,
    stopsOn: number,
    toUrl: string,
  ) => {
    const response = await fetch("/api/v1/redirect", {
      body: JSON.stringify({
        fromPath,
        startsOn,
        stopsOn,
        toUrl,
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newRedirect = (await response.json()) as Redirect;
    redirectMap[newRedirect.id] = newRedirect;
  };

  const get = async (id: number) => {
    const response = await fetch(`/api/v1/redirect/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newRedirect = (await response.json()) as Redirect;
    redirectMap[newRedirect.id] = newRedirect;
  };

  const getAll = async () => {
    const response = await fetch("/api/v1/redirect", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newRedirects = (await response.json()) as Redirect[];
    newRedirects.forEach((redirect) => {
      redirectMap[redirect.id] = redirect;
    });
  };

  const remove = async (id: number) => {
    const response = await fetch(`/api/v1/redirect/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    delete redirectMap[id];
  };

  const update = async (redirect: Redirect) => {
    const response = await fetch(`/api/v1/redirect/${redirect.id}`, {
      body: JSON.stringify(redirect),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newRedirect = (await response.json()) as Redirect;
    redirectMap[newRedirect.id] = newRedirect;
  };

  return {
    create,
    get,
    getAll,
    redirects,
    remove,
    update,
  };
});
