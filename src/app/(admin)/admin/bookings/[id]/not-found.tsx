import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BookingNotFound() {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle>Booking tidak ditemukan</CardTitle>
        <CardDescription>
          Data mungkin sudah tidak tersedia atau alamat detail booking tidak
          valid.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/admin/bookings">Kembali ke Pemesanan</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
