import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "56px 20px" }}>
      <h1 style={{ fontSize: 28, letterSpacing: "-0.02em" }}>Not found</h1>
      <p style={{ marginTop: 12, color: "rgba(2, 6, 23, 0.62)" }}>The page you requested does not exist.</p>
      <div style={{ marginTop: 18 }}>
        <Link href="/" style={{ textDecoration: "underline" }}>
          Go to search
        </Link>
      </div>
    </div>
  );
}

