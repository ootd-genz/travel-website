"use client";

import { useActionState } from "react";

import { saveCmsResource } from "@/actions/admin-cms";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import { FormSelect } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIAL_CMS_ACTION_STATE,
  type CmsRelationOptions,
} from "@/types/cms";

function Field({
  children,
  errors,
  label,
  name,
}: {
  children: React.ReactNode;
  errors: Record<string, string[]>;
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={`quick-${name}`}>{label}</Label>
      {children}
      {errors[name]?.map((message) => (
        <p className="text-xs font-medium text-destructive" key={message}>
          {message}
        </p>
      ))}
    </div>
  );
}

export function PromoCodeCreateCard({
  defaultEndsAt,
  defaultStartsAt,
  trips,
}: {
  defaultEndsAt: string;
  defaultStartsAt: string;
  trips: CmsRelationOptions["trips"];
}) {
  const [state, action, pending] = useActionState(
    saveCmsResource,
    INITIAL_CMS_ACTION_STATE,
  );
  const errors = state.fieldErrors;

  return (
    <Card className="border-primary/25">
      <CardHeader>
        <CardTitle>Buat kode promo</CardTitle>
        <CardDescription>
          Tetapkan kode, nilai potongan, paket target, dan periode dari tanggal
          mulai sampai tanggal selesai. Kode baru tidak ditampilkan ke publik.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5">
          <input type="hidden" name="resource" value="promotions" />
          <input type="hidden" name="id" value="" />
          <input type="hidden" name="imagePath" value="" />
          <input type="hidden" name="codePromoQuickCreate" value="1" />

          {state.message ? (
            <Alert className="border-destructive/40 bg-destructive/5">
              <AlertTitle>Kode promo belum tersimpan</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="code" label="Kode promo" errors={errors}>
              <Input
                id="quick-code"
                name="code"
                autoComplete="off"
                autoCapitalize="characters"
                className="uppercase"
                maxLength={32}
                placeholder="Contoh: LIBURAN10"
                required
              />
            </Field>
            <Field name="name" label="Nama promo" errors={errors}>
              <Input
                id="quick-name"
                name="name"
                maxLength={120}
                placeholder="Contoh: Promo Liburan Juli"
                required
              />
            </Field>
            <Field name="discountType" label="Tipe potongan" errors={errors}>
              <FormSelect
                id="quick-discountType"
                name="discountType"
                defaultValue="percentage"
                options={[
                  { value: "percentage", label: "Persentase (%)" },
                  { value: "fixed", label: "Nominal tetap (Rp)" },
                ]}
              />
            </Field>
            <Field name="discountValue" label="Nilai potongan" errors={errors}>
              <Input
                id="quick-discountValue"
                name="discountValue"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </Field>
            <Field name="startsAt" label="Berlaku dari" errors={errors}>
              <DatePicker
                id="quick-startsAt"
                name="startsAt"
                defaultValue={defaultStartsAt}
                withTime
                required
                ariaInvalid={Boolean(errors.startsAt?.length)}
              />
            </Field>
            <Field name="endsAt" label="Berlaku sampai" errors={errors}>
              <DatePicker
                id="quick-endsAt"
                name="endsAt"
                defaultValue={defaultEndsAt}
                withTime
                required
                ariaInvalid={Boolean(errors.endsAt?.length)}
              />
            </Field>
          </div>

          <Field name="tripIds" label="Paket yang mendapat promo" errors={errors}>
            <MultiSelect
              id="quick-tripIds"
              name="tripIds"
              options={trips.map((trip) => ({
                label: trip.label,
                value: trip.id,
              }))}
              placeholder="Pilih paket travel"
            />
          </Field>

          <Field name="terms" label="Syarat promo (opsional)" errors={errors}>
            <Textarea id="quick-terms" name="terms" rows={3} />
          </Field>

          <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
            <input
              className="mt-0.5 size-4 accent-primary"
              type="checkbox"
              name="isActive"
              defaultChecked
            />
            <span>
              <span className="font-medium">Aktifkan kode promo</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Promo tetap hanya dapat dipakai di dalam periode yang ditentukan.
              </span>
            </span>
          </label>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Buat kode promo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
