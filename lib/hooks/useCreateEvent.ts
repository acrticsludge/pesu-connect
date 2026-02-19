import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface CreateEventData {
  name: string;
  shortDescription: string;
  fullDescription: string;
  bannerUrl: string;
  involvedClubs: { club: string; domains: string[] }[];
  categories: string[];
  tags: string[];
  registration: {
    isRegister: boolean;
    deadline?: string;
    link?: string;
    methodText?: string;
  };
  startDate: string;
  endDate: string;
  venue: string;
  campus: "RR" | "EC";
  isPinned?: boolean;
}

const EVENTS_KEY = "events";

export function useCreateEvent(isAdmin: boolean = false) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ["create-event"],
    mutationFn: async (data: CreateEventData) => {
      const endpoint = isAdmin ? "/api/events/create" : "/api/events/request";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create event");
      return result;
    },
    onMutate: () => {
      toast.loading(isAdmin ? "Creating event..." : "Submitting request...", {
        id: "create-event",
      });
    },
    onSuccess: (data) => {
      toast.success(
        isAdmin
          ? "Event created successfully!"
          : "Request submitted successfully!",
        { id: "create-event" },
      );

      if (isAdmin) {
        queryClient.setQueryData([EVENTS_KEY, data._id], data);
        queryClient.invalidateQueries({ queryKey: [EVENTS_KEY] });
        router.push(`/events/${data._id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["event-requests", "user"] });
        router.push("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "create-event" });
    },
  });
}
