import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const EVENTS_KEY = "events";

export function useUpdateEvent(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ["update-event", id],
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
    onSuccess: (data) => {
      toast.success("Event updated successfully", { id: "update-event" });
      queryClient.setQueryData([EVENTS_KEY, id], data);
      queryClient.setQueryData([EVENTS_KEY], (old: any) => {
        if (!old) return old;
        return old.map((event: any) => (event._id === id ? data : event));
      });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "update-event" });
    },
  });
}
