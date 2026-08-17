import type { Metadata } from "next";

const GO_API_BASE = process.env.GO_API_BASE || "https://api.ipl-q.com/api/v1/web";

export async function generateMetadata({ params }: { params: Promise<{ shareId: string }> }): Promise<Metadata> {
  const { shareId } = await params;

  let title = "MyChord - Shared Collection";
  let description = "Lihat koleksi chord dan lirik lagu di MyChord";

  try {
    const res = await fetch(`${GO_API_BASE}/MyChord/Share/${shareId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.error_code === "0" && data.collection) {
        title = `${data.collection.name} - MyChord`;
        if (data.collection.description) {
          description = data.collection.description;
        }
      }
    }
  } catch {
    // fallback to default
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "MyChord",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
