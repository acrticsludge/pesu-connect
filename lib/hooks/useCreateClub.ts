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

const CLUBS_KEY = "clubs";

export function useCreateClub(isAdmin: boolean = false) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationKey: ["create-club"],
    mutationFn: async (formData: ClubFormData) => {
      const endpoint = isAdmin ? "/api/clubs/create" : "/api/club-requests";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create club");
      return data;
    },
    onMutate: () => {
      toast.loading(isAdmin ? "Creating club..." : "Submitting request...", {
        id: "create-club",
      });
    },
    onSuccess: (data) => {
      toast.success(
        isAdmin
          ? "Club created successfully!"
          : "Request submitted successfully!",
        { id: "create-club" },
      );

      if (isAdmin) {
        queryClient.setQueryData([CLUBS_KEY, data._id], data);
        queryClient.invalidateQueries({ queryKey: [CLUBS_KEY] });
        router.push(`/clubs/${data._id}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["club-requests", "user"] });
        router.push("/dashboard");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message, { id: "create-club" });
    },
  });
}
