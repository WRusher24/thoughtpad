import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

const ALLOWED = new Set([192, 512]);

/** Dynamic PNG icons referenced by the web app manifest. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await params;
  const size = Number.parseInt(raw, 10);
  if (!ALLOWED.has(size)) {
    return NextResponse.json({ error: "Unsupported size" }, { status: 400 });
  }

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
            width: "78%",
            height: "78%",
            border: `${Math.round(size * 0.035)}px solid #1A1A1A`,
            borderRadius: Math.round(size * 0.17),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
            fontWeight: 700,
            fontSize: Math.round(size * 0.42),
            color: "#1A1A1A",
          }}
        >
          T.
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
