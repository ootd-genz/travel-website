"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createBookingDraftAction,
  type BookingDraftActionState,
} from "@/actions/booking";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const INITIAL_BOOKING_DRAFT_STATE: BookingDraftActionState = {
  message: null,
  fieldErrors: {},
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="mt-6 w-full" size="lg" type="submit" disabled={pending}>
      {pending ? "Menyiapkan ringkasan..." : "Pesan Sekarang"}
    </Button>
  );
}

export function BookingDraftForm({
  tripId,
  minParticipants,
  maxParticipants,
  departureOptions,
}: {
  tripId: string;
  minParticipants: number;
  maxParticipants: number;
  departureOptions: string[];
}) {
  const [state, formAction] = useActionState(
    createBookingDraftAction,
    INITIAL_BOOKING_DRAFT_STATE,
  );

  return (
    <form action={formAction} className="mt-6" noValidate>
      <input type="hidden" name="tripId" value={tripId} />

      <div className="grid gap-2">
        <Label htmlFor="travelerCount">Jumlah traveler</Label>
        <Input
          id="travelerCount"
          name="travelerCount"
          type="number"
          inputMode="numeric"
          min={minParticipants}
          max={maxParticipants}
          defaultValue={minParticipants}
          required
          aria-describedby="traveler-help traveler-error"
          aria-invalid={Boolean(state.fieldErrors.travelerCount)}
        />
        <p id="traveler-help" className="text-xs text-muted-foreground">
          Kapasitas paket {minParticipants}–{maxParticipants} traveler.
        </p>
        {state.fieldErrors.travelerCount?.map((message) => (
          <p
            id="traveler-error"
            key={message}
            className="text-xs text-destructive"
            role="alert"
          >
            {message}
          </p>
        ))}
      </div>

      {departureOptions.length > 0 ? (
        <div className="mt-4 grid gap-2">
          <Label htmlFor="departureOption">Pilihan keberangkatan</Label>
          <Select
            id="departureOption"
            name="departureOption"
            defaultValue=""
            required
            aria-invalid={Boolean(state.fieldErrors.departureOption)}
            aria-describedby="departure-error"
          >
            <option value="" disabled>
              Pilih keberangkatan
            </option>
            {departureOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          {state.fieldErrors.departureOption?.map((message) => (
            <p
              id="departure-error"
              key={message}
              className="text-xs text-destructive"
              role="alert"
            >
              {message}
            </p>
          ))}
        </div>
      ) : null}

      {state.message ? (
        <Alert
          className="mt-5 border-destructive/40 bg-destructive/5"
          role="alert"
        >
          <AlertTitle>Pemesanan belum dapat dimulai</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <SubmitButton />
    </form>
  );
}
