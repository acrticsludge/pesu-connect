import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useUpdateClub(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
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
    onSuccess: () => {
      toast.success("Club updated successfully", { id: "update-club" });
      queryClient.invalidateQueries({ queryKey: ["club", id] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "update-club" });
    },
  });
}
