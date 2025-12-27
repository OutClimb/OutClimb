<script setup lang="ts">
import Button from "@/components/ui/button/Button.vue";
import { useRedirectStore } from "@/stores/redirect.store";
import { onMounted, ref } from "vue";
import { Plus } from "lucide-vue-next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { storeToRefs } from "pinia";

const redirectStore = useRedirectStore();
const { isEmpty, list } = storeToRefs(redirectStore);

const isLoading = ref(true);
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "full",
  timeStyle: "short",
});

onMounted(async () => {
  await redirectStore.getAll();
  isLoading.value = false;
});

const handleCreate = () => {};

const handleEdit = (_id: number) => {};

const handleDelete = (_id: number) => {};
</script>

<template>
  <header class="mb-8 ml-12 md:ml-0">
    <h1 class="flex items-center text-3xl font-bold tracking-tight">
      <span class="flex-auto">Redirects</span>
      <Button variant="default" @click="{ handleCreate }">
        <Plus />
        Create Redirect
      </Button>
    </h1>
  </header>
  <div class="rounded-lg border shadow-sm"></div>
  <div class="overflow-x-auto">
    <div v-if="isEmpty" class="flex items-center justify-center h-32">
      <p class="text-gray-500">No redirects yet.</p>
    </div>
    <Table v-else>
      <TableHeader>
        <TableRow>
          <TableHead>From</TableHead>
          <TableHead>To</TableHead>
          <TableHead>Starts On</TableHead>
          <TableHead>Ends On</TableHead>
          <TableHead><div class="text-right">Actions</div></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="redirect in list" :key="redirect.id">
          <TableCell>{{ redirect.fromPath }}</TableCell>
          <TableCell>{{ redirect.toUrl }}</TableCell>
          <TableCell v-if="redirect.startsOn === 0">-</TableCell>
          <TableCell v-else>{{
            dateFormatter.format(new Date(redirect.startsOn))
          }}</TableCell>
          <TableCell v-if="redirect.stopsOn === 0">-</TableCell>
          <TableCell v-else>{{
            dateFormatter.format(new Date(redirect.stopsOn))
          }}</TableCell>
          <TableCell>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @Click="handleEdit(redirect.id)">
                Edit
              </Button>
              <Button variant="destructive" @Click="handleDelete(redirect.id)">
                Delete
              </Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
