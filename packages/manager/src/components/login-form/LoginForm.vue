<script setup lang="ts">
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-vue-next";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { ref } from "vue";
import { Spinner } from "../ui/spinner";
import { toTypedSchema } from "@vee-validate/zod";
import { useAuthStore } from "@/stores/auth.store";
import { useForm } from "vee-validate";
import { useRouter } from "vue-router";
import * as z from "zod";

const authStore = useAuthStore();
const router = useRouter();

const error = ref<string | null>(null);
const isLoading = ref(false);

const loginSchema = toTypedSchema(
  z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
);

const { isFieldDirty, handleSubmit } = useForm({
  validationSchema: loginSchema,
});

const onSubmit = handleSubmit(async ({ username, password }) => {
  isLoading.value = true;

  try {
    await authStore.login(username, password);
    router.push("/dashboard");
  } catch (e) {
    if (e instanceof Error) {
      error.value = e.message;
    } else if (typeof e === "string") {
      error.value = e;
    } else {
      error.value = "Unknown error";
    }
  }

  isLoading.value = false;
});
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Login</CardTitle>
    </CardHeader>

    <form @submit="onSubmit">
      <CardContent class="space-y-4">
        <Alert v-if="error" variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <FormField
          v-slot="{ componentField }"
          name="username"
          :validate-on-blur="!isFieldDirty"
        >
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input
                type="text"
                :disabled="isLoading"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>

        <FormField
          v-slot="{ componentField }"
          name="password"
          :validate-on-blur="!isFieldDirty"
        >
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input
                type="password"
                :disabled="isLoading"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </CardContent>
      <CardFooter>
        <Button v-if="isLoading" class="w-full mt-4" type="submit" disabled>
          <Spinner />
          Signing in...
        </Button>
        <Button v-else class="w-full mt-4" type="submit"> Sign in </Button>
      </CardFooter>
    </form>
  </Card>
</template>
