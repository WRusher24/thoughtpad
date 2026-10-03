import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Browser favicon — ink "T." on a parchment tile. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAF9F6",
          border: "4px solid #1A1A1A",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: 36,
          color: "#1A1A1A",
        }}
      >
        T.
      </div>
    ),
    { ...size },
  );
}
