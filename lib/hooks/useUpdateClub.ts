import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const CLUBS_KEY = "clubs";

export function useUpdateClub(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ["update-club", id],
    mutationFn: async (clubData: any) => {
      const res = await fetch(`/api/clubs/${id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clubData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update club");
      return data;
    },
    onMutate: () => {
      toast.loading("Saving changes…", { id: "update-club" });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      queryClient.invalidateQueries({ queryKey: ["clubs", id] });

      toast.success("Club updated successfully", { id: "update-club" });
      queryClient.setQueryData([CLUBS_KEY, id], data);
      queryClient.setQueryData([CLUBS_KEY], (old: any) => {
        if (!old) return old;
        return old.map((club: any) => (club._id === id ? data : club));
      });
      router.push(`/clubs/${id}`);
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "update-club" });
    },
  });
}
