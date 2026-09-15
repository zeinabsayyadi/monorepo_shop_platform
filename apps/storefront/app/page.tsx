export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1
        className="font-heading text-2xl"
        style={{ color: "var(--foreground)" }}
      >
        Theme Test
      </h1>
      <div
        className="bg-primary rounded-lg"
        style={{ padding: "2rem", marginTop: "1rem" }}
      >
        <p style={{ color: "var(--background)" }}>
          This box uses the primary color
        </p>
      </div>
    </main>
  );
}
