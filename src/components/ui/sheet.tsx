"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const Sheet = Dialog.Root;
const SheetTrigger = Dialog.Trigger;
const SheetClose = Dialog.Close;

function SheetContent({ className, children, ...props }: ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
      <Dialog.Content className={cn("fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm border-r bg-background p-6 shadow-xl outline-none", className)} {...props}>
        {children}
        <Dialog.Close className="absolute right-4 top-4 rounded-md p-2 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Tutup menu</span>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Portal>
  );
}

function SheetTitle(props: ComponentProps<typeof Dialog.Title>) { return <Dialog.Title className="font-semibold" {...props} />; }

export { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger };
