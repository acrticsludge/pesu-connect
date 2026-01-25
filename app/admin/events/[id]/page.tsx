import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

import Event from "@/lib/models/Event";
import Club from "@/lib/models/Club";

import EditEventClient from "./EditEventClient";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const token = (await cookies()).get("auth_token")?.value;
  if (!token) redirect("/login");

  const rawUser = verifyToken(token);
  if (!rawUser) redirect("/dashboard");

  const user = {
    srn: rawUser.srn,
    isAdmin: rawUser.role === "admin",
  };

  await connectDB();

  const event = await Event.findById(id).lean();
  if (!event) redirect("/admin/events");

  const clubs = await Club.find().lean();

  return (
    <EditEventClient
      event={JSON.parse(JSON.stringify(event))}
      clubs={JSON.parse(JSON.stringify(clubs))}
      user={user}
    />
  );
}
