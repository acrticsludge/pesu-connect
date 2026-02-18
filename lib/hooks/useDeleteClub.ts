import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function useDeleteClub(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clubs/${id}/edit`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete club");
      }
      return true;
    },
    onMutate: () => {
      toast.loading("Deleting club…", { id: "delete-club" });
    },
    onSuccess: () => {
      toast.success("Club deleted", { id: "delete-club" });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      router.refresh();
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "delete-club" });
    },
  });
}
