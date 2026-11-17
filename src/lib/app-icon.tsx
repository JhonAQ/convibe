import { ImageResponse } from "next/og";

export function appIcon(size: number) {
  const s = size / 512;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e88e5 0%, #4fb3f6 100%)",
        }}
      >
        <svg width={280 * s} height={280 * s} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l7-4 7 4v14" />
          <path d="M12 9v4" />
          <path d="M12 16.5v.01" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
