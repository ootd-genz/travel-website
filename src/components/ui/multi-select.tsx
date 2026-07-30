"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MultiSelectOption = {
  label: string;
  value: string;
};

export function MultiSelect({
  defaultValues = [],
  id,
  name,
  options,
  placeholder = "Pilih opsi",
}: {
  defaultValues?: string[];
  id: string;
  name: string;
  options: MultiSelectOption[];
  placeholder?: string;
}) {
  const validValues = new Set(options.map((option) => option.value));
  const [selected, setSelected] = useState(() =>
    defaultValues.filter((value) => validValues.has(value)),
  );
  const [pickerValue, setPickerValue] = useState("");
  const selectedSet = new Set(selected);
  const availableOptions = options.filter(
    (option) => !selectedSet.has(option.value),
  );

  function addValue(value: string) {
    setSelected((current) =>
      current.includes(value) ? current : [...current, value],
    );
    setPickerValue("");
  }

  function removeValue(value: string) {
    setSelected((current) => current.filter((item) => item !== value));
  }

  return (
    <div className="grid gap-2">
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}
      <Select
        value={pickerValue}
        onValueChange={addValue}
        disabled={availableOptions.length === 0}
      >
        <SelectTrigger id={id}>
          <SelectValue
            placeholder={
              availableOptions.length === 0 ? "Semua opsi dipilih" : placeholder
            }
          />
        </SelectTrigger>
        <SelectContent>
          {availableOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2" aria-label="Pilihan terpilih">
          {selected.map((value) => {
            const option = options.find((item) => item.value === value);
            if (!option) return null;
            return (
              <span
                key={value}
                className="inline-flex items-center gap-1 rounded-md border bg-secondary px-2 py-1 text-sm text-secondary-foreground"
              >
                {option.label}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-5 rounded-sm"
                  onClick={() => removeValue(value)}
                  aria-label={`Hapus ${option.label}`}
                >
                  <X className="size-3" aria-hidden="true" />
                </Button>
              </span>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Belum ada opsi dipilih.</p>
      )}
    </div>
  );
}
