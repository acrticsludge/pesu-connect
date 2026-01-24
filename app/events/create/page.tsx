"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Club = {
  _id: string;
  name: string;
  domains: { name: string }[];
};

export default function CreateEventPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [type, setType] = useState<"club" | "domain">(
    (params.get("type") as "club" | "domain") || "club",
  );

  const [clubId, setClubId] = useState(params.get("clubId") || "");
  const [domain, setDomain] = useState(params.get("domain") || "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/me/clubs")
      .then((r) => r.json())
      .then(setClubs);
  }, []);

  async function handleSubmit() {
    setError("");

    const url = type === "club" ? "/api/events/club" : "/api/events/domain";

    const body =
      type === "club"
        ? { clubId, title, description }
        : { clubId, domainName: domain, title, description };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/dashboard");
  }

  const selectedClub = clubs.find((c) => c._id === clubId);

  return (
    <div className="max-w-xl mx-auto p-6 space-y-5">
      <h1 className="text-xl font-semibold">Create Event</h1>

      <select
        value={type}
        onChange={(e) => setType(e.target.value as any)}
        className="w-full border rounded p-2"
      >
        <option value="club">Club Event</option>
        <option value="domain">Domain Event</option>
      </select>

      <select
        value={clubId}
        onChange={(e) => setClubId(e.target.value)}
        className="w-full border rounded p-2"
      >
        <option value="">Select club</option>
        {clubs.map((club) => (
          <option key={club._id} value={club._id}>
            {club.name}
          </option>
        ))}
      </select>

      {type === "domain" && selectedClub && (
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">Select domain</option>
          {selectedClub.domains.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
      )}

      <input
        className="w-full border rounded p-2"
        placeholder="Event title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="w-full border rounded p-2"
        placeholder="Event description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleSubmit}
        className="w-full bg-black text-white rounded p-2"
      >
        Create Event
      </button>
    </div>
  );
}
