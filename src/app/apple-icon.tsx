import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — solid parchment tile for the home screen. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAF9F6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 132,
            height: 132,
            border: "7px solid #1A1A1A",
            borderRadius: 30,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: 72,
            color: "#1A1A1A",
          }}
        >
          T.
        </div>
      </div>
    ),
    { ...size },
  );
}
