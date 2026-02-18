import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ClubFormData {
  name: string;
  shortDescription: string;
  foundedOn: string;
  bannerUrl?: string;
  instagram?: string;
  staffName: string;
  staffDepartment: string;
}

export function useCreateClub() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (formData: ClubFormData) => {
      const res = await fetch("/api/clubs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create club");
      return data;
    },
    onMutate: () => {
      toast.loading("Creating club...", { id: "create-club" });
    },
    onSuccess: (data) => {
      toast.success("Club created successfully!", { id: "create-club" });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      router.push(`/clubs/${data._id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "create-club" });
    },
  });
}
