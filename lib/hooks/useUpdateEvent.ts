import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (eventData: any) => {
      const res = await fetch(`/api/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update event");
      return data;
    },
    onMutate: () => {
      toast.loading("Saving changes…", { id: "update-event" });
    },
    onSuccess: () => {
      toast.success("Event updated successfully", { id: "update-event" });
      queryClient.invalidateQueries({ queryKey: ["events", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "update-event" });
    },
  });
}
