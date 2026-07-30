"use client";

import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarDays, Clock3, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function parseInputValue(value: string, withTime: boolean) {
  const match = value.match(
    withTime
      ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
      : /^(\d{4})-(\d{2})-(\d{2})$/,
  );
  if (!match) return undefined;

  const [, year, month, day, hour = "0", minute = "0"] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function inputValue(date: Date | undefined, time: string, withTime: boolean) {
  if (!date) return "";
  return withTime
    ? `${format(date, "yyyy-MM-dd")}T${time}`
    : format(date, "yyyy-MM-dd");
}

type DatePickerProps = {
  ariaDescribedBy?: string;
  ariaInvalid?: boolean;
  defaultValue?: string;
  id: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  withTime?: boolean;
};

export function DatePicker(props: DatePickerProps) {
  return (
    <DatePickerControl
      key={`${props.defaultValue ?? ""}:${props.withTime ? "time" : "date"}`}
      {...props}
    />
  );
}

function DatePickerControl({
  ariaDescribedBy,
  ariaInvalid,
  defaultValue = "",
  id,
  name,
  placeholder,
  required = false,
  withTime = false,
}: DatePickerProps) {
  const initialDate = parseInputValue(defaultValue, withTime);
  const [date, setDate] = useState<Date | undefined>(initialDate);
  const [time, setTime] = useState(
    initialDate ? format(initialDate, "HH:mm") : "09:00",
  );
  const [open, setOpen] = useState(false);
  const value = inputValue(date, time, withTime);

  function selectDate(nextDate: Date | undefined) {
    setDate(nextDate);
    if (nextDate && !withTime) setOpen(false);
  }

  function clearDate() {
    setDate(undefined);
    setOpen(false);
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            aria-describedby={ariaDescribedBy}
            aria-invalid={ariaInvalid}
            aria-required={required}
            data-empty={!date}
            className={cn(
              "w-full justify-start text-left font-normal",
              "data-[empty=true]:text-muted-foreground",
              ariaInvalid && "border-destructive focus-visible:ring-destructive",
            )}
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {date ? (
              <span>
                {format(date, "dd MMMM yyyy", { locale: idLocale })}
                {withTime ? `, ${time}` : ""}
              </span>
            ) : (
              <span>
                {placeholder ??
                  (withTime ? "Pilih tanggal dan waktu" : "Pilih tanggal")}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={selectDate}
            defaultMonth={date}
            locale={idLocale}
            weekStartsOn={1}
            autoFocus
          />
          {withTime ? (
            <div className="border-t p-3">
              <label
                htmlFor={`${id}-time`}
                className="mb-2 flex items-center gap-2 text-sm font-medium"
              >
                <Clock3 className="size-4" aria-hidden="true" />
                Waktu
              </label>
              <Input
                id={`${id}-time`}
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
              <Button
                type="button"
                size="sm"
                className="mt-3 w-full"
                disabled={!date || !time}
                onClick={() => setOpen(false)}
              >
                Selesai
              </Button>
            </div>
          ) : null}
          {!required && date ? (
            <div className="border-t p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={clearDate}
              >
                <X className="size-4" aria-hidden="true" />
                Hapus pilihan
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
