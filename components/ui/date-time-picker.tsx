"use client";

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateTimePickerProps = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
};

export function DateTimePicker({
  value,
  onChange,
  placeholder,
}: DateTimePickerProps) {
  function setTime(hours: number, minutes: number) {
    if (!value) return;
    const d = new Date(value);
    d.setHours(hours);
    d.setMinutes(minutes);
    onChange(d);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-[#0A0A0A] border-white/10 text-white hover:border-[#7C3AED]/50",
            !value && "text-[#A3A3A3]",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#7C3AED]" />
          {value ? format(value, "yyyy-MM-dd HH:mm") : placeholder}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-4 bg-[#0A0A0A] border-white/10">
        <Calendar
          mode="single"
          required={true}
          selected={value ?? undefined}
          onSelect={onChange}
          initialFocus
          className="text-white"
        />

        {/* Time Picker */}
        <div className="mt-3 flex gap-2">
          <select
            className="bg-[#0A0A0A] border border-white/10 rounded-md px-2 py-1 text-white"
            value={value?.getHours() ?? ""}
            onChange={(e) =>
              setTime(Number(e.target.value), value?.getMinutes() ?? 0)
            }
          >
            {[...Array(24)].map((_, h) => (
              <option key={h} value={h}>
                {h.toString().padStart(2, "0")}
              </option>
            ))}
          </select>

          <select
            className="bg-[#0A0A0A] border border-white/10 rounded-md px-2 py-1 text-white"
            value={value?.getMinutes() ?? ""}
            onChange={(e) =>
              setTime(value?.getHours() ?? 0, Number(e.target.value))
            }
          >
            {[0, 15, 30, 45].map((m) => (
              <option key={m} value={m}>
                {m.toString().padStart(2, "0")}
              </option>
            ))}
          </select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
