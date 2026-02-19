import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const EVENTS_KEY = "events";

export function useDeleteEvent(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ["delete-event", id],
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
      queryClient.removeQueries({ queryKey: [EVENTS_KEY, id] });
      queryClient.setQueryData([EVENTS_KEY], (oldData: any) => {
        if (!oldData) return oldData;
        return oldData.filter((event: any) => event._id !== id);
      });
      router.push("/events");
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "delete-event" });
    },
  });
}
