import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useDeleteEvent(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete event");
      return data;
    },
    onMutate: () => {
      toast.loading("Deleting event…", { id: "delete-event" });
    },
    onSuccess: () => {
      toast.success("Event deleted", { id: "delete-event" });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "delete-event" });
    },
  });
}
