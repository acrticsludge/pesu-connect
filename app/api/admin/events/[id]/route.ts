import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Event from "@/lib/models/Event";
import Club from "@/lib/models/Club";

/* UPDATE EVENT */
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params; // ✅ REQUIRED IN NEXT 15

    const token = (await cookies()).get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Debug log for received domains
    console.log(
      "PATCH /api/admin/events/[id]: received domains:",
      body.domains,
    );

    await connectDB();

    // Fetch the current event to fill in missing fields
    const currentEvent = await Event.findById(id).lean();

    const updateData: any = {
      title: body.title,
      shortDescription: body.shortDescription,
      description: body.description,
      registrationDeadline: body.registrationDeadline,
      eventDate: body.eventDate,
      venue: body.venue,
      tags: body.tags ?? currentEvent?.tags ?? [],
      isPinned: body.isPinned,
      isActive: body.isActive,
      domains: body.domains ?? currentEvent?.domains ?? [],
      bannerImage: body.bannerImage ??
        currentEvent?.bannerImage ?? { url: "", alt: "" },
    };
    // Debug log for updateData.domains
    console.log(
      "PATCH /api/admin/events/[id]: updateData.domains:",
      updateData.domains,
    );

    if (body.clubId) {
      // Debug log for clubId and club lookup
      console.log("PATCH /api/admin/events/[id]: clubId:", body.clubId);
      const club = await Club.findById(body.clubId);
      console.log("PATCH /api/admin/events/[id]: club found:", club);
      if (club) {
        updateData.club = {
          name: club.name,
          slug: club.slug,
        };
      }
    } else if (currentEvent?.club) {
      updateData.club = currentEvent.club;
    }

    // No need to set domains/bannerImage here, handled above

    // Use $set to ensure domains is always overwritten, even if empty

    const updateResult = await Event.findByIdAndUpdate(id, {
      $set: updateData,
    });
    if (!updateResult) {
      console.error("PATCH /api/admin/events/[id]: update failed for id", id);
      return NextResponse.json(
        { error: "Event not found or update failed" },
        { status: 500 },
      );
    }

    // Fetch the updated event as a Mongoose document (not lean)
    let updatedEventDoc = await Event.findById(id);
    // Debug log for updated event domains
    console.log(
      "PATCH /api/admin/events/[id]: updatedEventDoc.domains:",
      updatedEventDoc?.domains,
    );

    // If domains is undefined, forcibly set it to [] and save again (heals legacy docs)
    if (!updatedEventDoc.domains) {
      console.log(
        "PATCH /api/admin/events/[id]: domains was undefined, healing document...",
      );
      updatedEventDoc.domains = updateData.domains ?? [];
      updatedEventDoc.markModified("domains");
      // Only heal domains, do NOT overwrite club. If club is missing or invalid, return error.
      if (!updatedEventDoc.club || !updatedEventDoc.club.slug) {
        return NextResponse.json(
          {
            error:
              "Event is missing a valid club. Please edit this event and select a club.",
          },
          { status: 400 },
        );
      }
      await updatedEventDoc.save();
    }
    // Log the full updatedEvent object for debugging
    console.log(
      "PATCH /api/admin/events/[id]: full updatedEventDoc:",
      updatedEventDoc,
    );

    // Convert to plain object for response
    const updatedEvent = updatedEventDoc.toObject();

    // Return debug info for troubleshooting, including updated domains
    return NextResponse.json({
      success: true,
      debug: {
        clubId: body.clubId,
        updateClub: updateData.club ?? null,
        sentDomains: body.domains,
        updateDomains: updateData.domains,
        savedDomains: updatedEvent.domains,
      },
      updatedEvent,
    });
  } catch (err) {
    console.error("PATCH /api/admin/events/[id]: error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        details: err,
      },
      { status: 500 },
    );
  }
}

/* DELETE EVENT */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params; // ✅ REQUIRED IN NEXT 15

  const token = (await cookies()).get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  await Event.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
