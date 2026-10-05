import { Button } from "@shop/ui";

export default function Home() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1 className="font-heading text-3xl text-foreground">Welcome</h1>
      <p
        className="font-body text-foreground/70"
        style={{ marginTop: "0.5rem" }}
      >
        Browse our products below.
      </p>
      <div style={{ marginTop: "1.5rem" }}>
        <a href="/products">
          <Button variant="primary">Shop Now</Button>
        </a>
      </div>
    </main>
  );
}
