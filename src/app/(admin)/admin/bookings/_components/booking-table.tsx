"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Eye } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminBookingListItem } from "@/types/booking";

import { BookingStatusBadge } from "./booking-status-badge";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

const columnHelper = createColumnHelper<AdminBookingListItem>();
const columns = [
  columnHelper.accessor("bookingCode", {
    header: "Kode Booking",
    cell: ({ row }) => (
      <Link
        href={`/admin/bookings/${row.original.id}`}
        className="font-semibold text-primary underline-offset-4 hover:underline"
      >
        {row.original.bookingCode}
      </Link>
    ),
  }),
  columnHelper.accessor("customerName", {
    header: "Pemesan",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.customerName ?? "Belum submit"}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.customerWhatsapp ?? "Data customer belum tersedia"}
        </p>
      </div>
    ),
  }),
  columnHelper.accessor("packageName", {
    header: "Paket",
    cell: ({ getValue }) => (
      <span className="block max-w-52 truncate">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("departureDate", {
    header: "Berangkat",
    cell: ({ getValue }) =>
      getValue()
        ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(
            new Date(`${getValue()}T00:00:00`),
          )
        : "Belum dipilih",
  }),
  columnHelper.accessor("totalAmount", {
    header: "Total",
    cell: ({ row }) => (
      <span className="whitespace-nowrap font-medium">
        {formatMoney(row.original.totalAmount, row.original.currency)}
      </span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <BookingStatusBadge status={getValue()} />,
  }),
  columnHelper.accessor("whatsappNotificationStatus", {
    header: "Notifikasi",
    cell: ({ getValue }) => {
      const status = getValue();
      if (!status) return <span className="text-muted-foreground">—</span>;

      return (
        <Badge
          variant={
            status === "failed"
              ? "destructive"
              : status === "sent"
                ? "default"
                : "secondary"
          }
        >
          {status === "failed"
            ? "WA gagal"
            : status === "sent"
              ? "WA terkirim"
              : "WA diproses"}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("createdAt", {
    header: "Waktu Masuk",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {formatDate(row.original.submittedAt ?? row.original.createdAt)}
      </span>
    ),
  }),
  columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">Aksi</span>,
    cell: ({ row }) => (
      <Button asChild size="sm" variant="outline">
        <Link href={`/admin/bookings/${row.original.id}`}>
          <Eye className="size-4" aria-hidden="true" />
          Lihat
        </Link>
      </Button>
    ),
  }),
];

export function BookingTable({ items }: { items: AdminBookingListItem[] }) {
  // TanStack Table is the required table engine for admin booking data. React
  // Compiler safely skips this isolated component because the library exposes
  // non-memoizable functions; no table functions cross this component boundary.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualFiltering: true,
    manualPagination: true,
  });

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-lg border bg-background p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link
                  href={`/admin/bookings/${item.id}`}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {item.bookingCode}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(item.submittedAt ?? item.createdAt)}
                </p>
              </div>
              <BookingStatusBadge status={item.status} />
            </div>
            {item.whatsappNotificationStatus ? (
              <Badge
                className="w-fit"
                variant={
                  item.whatsappNotificationStatus === "failed"
                    ? "destructive"
                    : item.whatsappNotificationStatus === "sent"
                      ? "default"
                      : "secondary"
                }
              >
                {item.whatsappNotificationStatus === "failed"
                  ? "Notifikasi WA gagal"
                  : item.whatsappNotificationStatus === "sent"
                    ? "Notifikasi WA terkirim"
                    : "Notifikasi WA diproses"}
              </Badge>
            ) : null}
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Pemesan</dt>
                <dd className="font-medium">
                  {item.customerName ?? "Belum submit"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Paket</dt>
                <dd className="font-medium">{item.packageName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total</dt>
                <dd className="font-medium">
                  {formatMoney(item.totalAmount, item.currency)}
                </dd>
              </div>
            </dl>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/admin/bookings/${item.id}`}>
                <Eye className="size-4" aria-hidden="true" />
                Lihat Detail
              </Link>
            </Button>
          </article>
        ))}
      </div>
    </>
  );
}
