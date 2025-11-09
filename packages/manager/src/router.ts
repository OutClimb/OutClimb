import { createWebHistory, createRouter } from "vue-router";
import { useAuthStore } from "./stores/auth.store";

import DashboardView from "./views/DashboardView.vue";
import FormDetailView from "./views/FormDetailView.vue";
import FormView from "./views/FormView.vue";
import LoginView from "./views/LoginView.vue";
import NotFoundView from "./views/NotFoundView.vue";
import RedirectDetailView from "./views/RedirectDetailView.vue";
import RedirectView from "./views/RedirectView.vue";

const routes = [
  {
    path: "/",
    component: LoginView,
    meta: { requiresAuth: false },
  },
  {
    path: "/dashboard",
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: "/form",
    component: FormView,
    meta: { requiresAuth: true },
  },
  {
    path: "/form/:formId",
    component: FormDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: "/redirect",
    component: RedirectView,
    meta: { requiresAuth: true },
  },
  {
    path: "/redirect/:redirectId",
    component: RedirectDetailView,
    meta: { requiresAuth: true },
  },
  {
    path: "/:pathMatch(.*)*",
    component: NotFoundView,
    meta: { requiresAuth: false },
  },
];

export const router = createRouter({
  history: createWebHistory("/manage"),
  routes,
});

router.beforeEach((to, _, next) => {
  const { token, logout } = useAuthStore();

  if (to.path === "/" && token) {
    logout(false);
  }

  if (to.meta.requiresAuth) {
    if (token) {
      next();
    } else {
      next("/");
    }
  } else {
    next();
  }
});
