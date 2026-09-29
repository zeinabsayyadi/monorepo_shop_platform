import { Button } from "@shop/ui";

export default function Home() {
  return (
    <main style={{ padding: "2rem", display: "flex", gap: "1rem" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
    </main>
  );
}
