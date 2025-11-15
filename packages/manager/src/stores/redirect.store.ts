import { computed, ref } from "vue";
import { defineStore } from "pinia";
import type { Redirect } from "@/types/redirect";
import { useAuthStore } from "./auth.store";

export const useRedirectStore = defineStore("redirect", () => {
  const authStore = useAuthStore();
  const map = ref<Record<number, Redirect>>({});

  const list = computed(() => {
    return Object.values(map.value).sort((a, b) => a.startsOn - b.startsOn);
  });

  const isEmpty = computed(() => {
    return list.value.length === 0;
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
        Authorization: `Bearer ${authStore.token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newRedirect = (await response.json()) as Redirect;
    map.value[newRedirect.id] = newRedirect;
  };

  const get = async (id: number) => {
    const response = await fetch(`/api/v1/redirect/${id}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newRedirect = (await response.json()) as Redirect;
    map.value[newRedirect.id] = newRedirect;
  };

  const getAll = async () => {
    const response = await fetch("/api/v1/redirect", {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        "Content-Type": "application/json",
      },
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const redirects = (await response.json()) as Redirect[];
    map.value = redirects.reduce<Record<number, Redirect>>(
      (newMap, redirect) => {
        newMap[redirect.id] = redirect;
        return newMap;
      },
      {},
    );
  };

  const remove = async (id: number) => {
    const response = await fetch(`/api/v1/redirect/${id}`, {
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        "Content-Type": "application/json",
      },
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    delete map.value[id];
  };

  const update = async (redirect: Redirect) => {
    const response = await fetch(`/api/v1/redirect/${redirect.id}`, {
      body: JSON.stringify(redirect),
      headers: {
        Authorization: `Bearer ${authStore.token}`,
        "Content-Type": "application/json",
      },
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const newRedirect = (await response.json()) as Redirect;
    map.value[newRedirect.id] = newRedirect;
  };

  return {
    create,
    get,
    getAll,
    isEmpty,
    list,
    map,
    remove,
    update,
  };
});
