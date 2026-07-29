import { ImageResponse } from "next/og";

export const alt =
  "Travel Bali — paket perjalanan, destinasi, dan aktivitas pilihan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "linear-gradient(135deg, #073b4c 0%, #0b7285 55%, #14b8a6 100%)",
          color: "white",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: "80px",
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "980px",
          }}
        >
          <div
            style={{
              color: "#ccfbf1",
              display: "flex",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Travel Bali
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              marginTop: 28,
            }}
          >
            Liburan Impian, Lebih Mudah Dimulai di Sini.
          </div>
          <div
            style={{
              color: "#e6fffb",
              display: "flex",
              fontSize: 30,
              lineHeight: 1.4,
              marginTop: 32,
            }}
          >
            Paket pilihan, harga transparan, dan pengalaman Bali yang
            dikurasi.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
