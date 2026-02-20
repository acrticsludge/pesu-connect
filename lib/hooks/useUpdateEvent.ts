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

      // Extract the event from nested structure if needed
      return data.event || data;
    },
    onMutate: () => {
      toast.loading("Saving changes…", { id: "update-event" });
    },
    onSuccess: (updatedEvent) => {
      // Update individual event cache
      queryClient.setQueryData([EVENTS_KEY, id], updatedEvent);

      // Update list cache if it exists
      queryClient.setQueryData([EVENTS_KEY], (old: any) => {
        if (!old) return old;
        return old.map((event: any) =>
          event._id === id ? updatedEvent : event,
        );
      });

      toast.success("Event updated successfully", { id: "update-event" });
      router.push(`/events/${id}`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "update-event" });
    },
  });
}
