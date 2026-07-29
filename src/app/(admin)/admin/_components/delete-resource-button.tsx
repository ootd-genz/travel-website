"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Trash2, X } from "lucide-react";
import { useActionState, useState } from "react";

import { deleteCmsResource } from "@/actions/admin-cms";
import { Button } from "@/components/ui/button";
import { INITIAL_CMS_ACTION_STATE, type CmsResource } from "@/types/cms";

type DeleteResourceButtonProps = {
  id: string;
  name: string;
  resource: CmsResource;
};

export function DeleteResourceButton({ id, name, resource }: DeleteResourceButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteCmsResource, INITIAL_CMS_ACTION_STATE);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) setOpen(nextOpen);
      }}
    >
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Hapus ${name}`}
          title={`Hapus ${name}`}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-2xl outline-none">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-semibold">Hapus data ini?</Dialog.Title>
              <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
                <span className="font-medium text-foreground">{name}</span> akan dihapus permanen. Tindakan ini tidak dapat dibatalkan dan dapat ditolak bila data masih memiliki relasi atau riwayat penting.
              </Dialog.Description>
            </div>
          </div>

          {state.message ? (
            <p role="alert" className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <form action={action} className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <input type="hidden" name="resource" value={resource} />
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="confirmation" value="HAPUS" />
            <Dialog.Close asChild>
              <Button type="button" variant="outline" disabled={pending}>Batal</Button>
            </Dialog.Close>
            <Button type="submit" variant="destructive" disabled={pending}>
              <Trash2 className="size-4" aria-hidden="true" />
              {pending ? "Menghapus..." : "Ya, hapus permanen"}
            </Button>
          </form>

          <Dialog.Close
            className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            aria-label="Tutup konfirmasi"
            disabled={pending}
          >
            <X className="size-4" aria-hidden="true" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
