"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitBookingAction,
  type SubmitBookingActionState,
} from "@/actions/booking";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const INITIAL_STATE: SubmitBookingActionState = {
  message: null,
  code: null,
  fieldErrors: {},
};

function FieldError({
  id,
  messages,
}: {
  id: string;
  messages?: string[];
}) {
  if (!messages?.length) return null;
  const uniqueMessages = Array.from(new Set(messages));
  return (
    <div id={id} className="grid gap-1" aria-live="polite">
      {uniqueMessages.map((message, index) => (
        <p key={`${id}-${index}`} className="text-xs text-destructive">
          {message}
        </p>
      ))}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      className="w-full sm:w-auto"
      size="lg"
      type="submit"
      disabled={pending}
    >
      {pending ? "Mengirim pemesanan..." : "Kirim Bukti & Pemesanan"}
    </Button>
  );
}

export function BookingSubmissionForm({
  token,
  travelerCount,
  totalAmount,
}: {
  token: string;
  travelerCount: number;
  totalAmount: number;
}) {
  const submitWithToken = submitBookingAction.bind(null, token);
  const [state, formAction] = useActionState(submitWithToken, INITIAL_STATE);

  return (
    <form action={formAction} className="grid gap-6" noValidate>
      <Card>
        <CardHeader>
          <p className="text-sm font-medium text-primary">Langkah 3</p>
          <CardTitle>Sudah Transfer? Kirim Detail Pemesananmu.</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="text-sm leading-6 text-muted-foreground">
            Isi data dengan benar agar admin dapat memeriksa pembayaran dan
            perjalananmu tanpa hambatan.
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="customerName">Nama lengkap</Label>
              <Input
                id="customerName"
                name="customerName"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
                aria-invalid={Boolean(state.fieldErrors.customerName)}
                aria-describedby="customerName-error"
              />
              <FieldError
                id="customerName-error"
                messages={state.fieldErrors.customerName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerWhatsapp">Nomor WhatsApp aktif</Label>
              <Input
                id="customerWhatsapp"
                name="customerWhatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Contoh: 0812 3456 7890"
                required
                aria-invalid={Boolean(state.fieldErrors.customerWhatsapp)}
                aria-describedby="customerWhatsapp-help customerWhatsapp-error"
              />
              <p
                id="customerWhatsapp-help"
                className="text-xs text-muted-foreground"
              >
                Admin akan menghubungimu melalui nomor ini bila diperlukan.
              </p>
              <FieldError
                id="customerWhatsapp-error"
                messages={state.fieldErrors.customerWhatsapp}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                aria-invalid={Boolean(state.fieldErrors.customerEmail)}
                aria-describedby="customerEmail-error"
              />
              <FieldError
                id="customerEmail-error"
                messages={state.fieldErrors.customerEmail}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerCity">
                Kota domisili <span className="font-normal">(opsional)</span>
              </Label>
              <Input
                id="customerCity"
                name="customerCity"
                autoComplete="address-level2"
                maxLength={100}
                aria-invalid={Boolean(state.fieldErrors.customerCity)}
                aria-describedby="customerCity-error"
              />
              <FieldError
                id="customerCity-error"
                messages={state.fieldErrors.customerCity}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data peserta</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Masukkan nama lengkap untuk seluruh {travelerCount} traveler.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: travelerCount }, (_, index) => (
              <div className="grid gap-2" key={index}>
                <Label htmlFor={`participant-${index}`}>
                  Nama peserta {index + 1}
                </Label>
                <Input
                  id={`participant-${index}`}
                  name="participantNames"
                  autoComplete={index === 0 ? "name" : "off"}
                  minLength={2}
                  maxLength={100}
                  required
                  aria-invalid={Boolean(state.fieldErrors.participantNames)}
                  aria-describedby="participantNames-error"
                />
              </div>
            ))}
          </div>
          <FieldError
            id="participantNames-error"
            messages={state.fieldErrors.participantNames}
          />

          <div className="grid gap-2">
            <Label htmlFor="customerNotes">
              Catatan khusus <span className="font-normal">(opsional)</span>
            </Label>
            <Textarea
              id="customerNotes"
              name="customerNotes"
              maxLength={2_000}
              placeholder="Contoh: kebutuhan makanan, aksesibilitas, atau informasi penting lain."
              aria-invalid={Boolean(state.fieldErrors.customerNotes)}
              aria-describedby="customerNotes-help customerNotes-error"
            />
            <p id="customerNotes-help" className="text-xs text-muted-foreground">
              Jangan masukkan NIK, nomor paspor, atau data sensitif lain.
            </p>
            <FieldError
              id="customerNotes-error"
              messages={state.fieldErrors.customerNotes}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi transfer</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="senderBankName">
                Bank pengirim <span className="font-normal">(opsional)</span>
              </Label>
              <Input
                id="senderBankName"
                name="senderBankName"
                maxLength={100}
                placeholder="Contoh: BCA"
                aria-invalid={Boolean(state.fieldErrors.senderBankName)}
                aria-describedby="senderBankName-error"
              />
              <FieldError
                id="senderBankName-error"
                messages={state.fieldErrors.senderBankName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="senderAccountName">
                Nama pemilik rekening pengirim
              </Label>
              <Input
                id="senderAccountName"
                name="senderAccountName"
                minLength={2}
                maxLength={100}
                required
                aria-invalid={Boolean(state.fieldErrors.senderAccountName)}
                aria-describedby="senderAccountName-error"
              />
              <FieldError
                id="senderAccountName-error"
                messages={state.fieldErrors.senderAccountName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="declaredTransferAmount">
                Nominal yang ditransfer
              </Label>
              <Input
                id="declaredTransferAmount"
                name="declaredTransferAmount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                defaultValue={totalAmount.toFixed(2)}
                required
                aria-invalid={Boolean(
                  state.fieldErrors.declaredTransferAmount,
                )}
                aria-describedby="declaredTransferAmount-help declaredTransferAmount-error"
              />
              <p
                id="declaredTransferAmount-help"
                className="text-xs text-muted-foreground"
              >
                Harus sama persis dengan total transfer pada instruksi di atas.
              </p>
              <FieldError
                id="declaredTransferAmount-error"
                messages={state.fieldErrors.declaredTransferAmount}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="transferredAt">
                Waktu transfer <span className="font-normal">(opsional)</span>
              </Label>
              <Input
                id="transferredAt"
                name="transferredAt"
                type="datetime-local"
                aria-invalid={Boolean(state.fieldErrors.transferredAt)}
                aria-describedby="transferredAt-help transferredAt-error"
              />
              <p
                id="transferredAt-help"
                className="text-xs text-muted-foreground"
              >
                Gunakan waktu lokal yang tertera pada bukti transfer.
              </p>
              <FieldError
                id="transferredAt-error"
                messages={state.fieldErrors.transferredAt}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="transferProof">Bukti transfer</Label>
            <Input
              className="h-auto cursor-pointer py-2 file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-secondary-foreground"
              id="transferProof"
              name="transferProof"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              required
              aria-invalid={Boolean(state.fieldErrors.transferProof)}
              aria-describedby="transferProof-help transferProof-error"
            />
            <p id="transferProof-help" className="text-xs text-muted-foreground">
              Satu file JPEG, PNG, atau PDF; maksimum 5 MiB. File disimpan
              secara private dan hanya dapat diperiksa admin.
            </p>
            <FieldError
              id="transferProof-error"
              messages={state.fieldErrors.transferProof}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 pt-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consentDataIsCorrect"
              name="consentDataIsCorrect"
              required
              aria-invalid={Boolean(state.fieldErrors.consentDataIsCorrect)}
              aria-describedby="consentDataIsCorrect-error"
            />
            <div className="grid gap-1">
              <Label htmlFor="consentDataIsCorrect" className="leading-5">
                Saya memastikan data yang diisi benar.
              </Label>
              <FieldError
                id="consentDataIsCorrect-error"
                messages={state.fieldErrors.consentDataIsCorrect}
              />
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="consentPaymentRequiresVerification"
              name="consentPaymentRequiresVerification"
              required
              aria-invalid={Boolean(
                state.fieldErrors.consentPaymentRequiresVerification,
              )}
              aria-describedby="consentPaymentRequiresVerification-error"
            />
            <div className="grid gap-1">
              <Label
                htmlFor="consentPaymentRequiresVerification"
                className="leading-5"
              >
                Saya memahami pemesanan baru dikonfirmasi setelah admin
                memverifikasi pembayaran.
              </Label>
              <FieldError
                id="consentPaymentRequiresVerification-error"
                messages={
                  state.fieldErrors.consentPaymentRequiresVerification
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {state.message ? (
        <Alert
          className="border-destructive/40 bg-destructive/5"
          role="alert"
        >
          <AlertTitle>Pemesanan belum terkirim</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
        <p className="max-w-xl text-xs leading-5 text-muted-foreground">
          Jangan menutup halaman sampai proses selesai. Tombol dinonaktifkan
          selama pengiriman untuk mencegah submit ganda.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
