import { ProductCard, Button } from "@shop/ui";

interface Product {
  id: string;
  price: number;
  salePrice: number | null;
  images: string[];
  translations: { name: string }[];
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch("http://localhost:3000/products", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export default async function Home() {
  const products = await getProducts();

  return (
    <main style={{ padding: "2rem" }}>
      <h1 className="font-heading text-2xl text-foreground">Products</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        {products.map((product) => (
          <ProductCard
            key={product.id}
            name={product.translations[0]?.name ?? "Unnamed"}
            price={product.price}
            salePrice={product.salePrice}
            imageUrl={
              product.images[0]
                ? `http://localhost:3000${product.images[0]}`
                : undefined
            }
          />
        ))}
      </div>
      <div style={{ marginTop: "2rem" }}>
        <Button variant="primary">Primary</Button>
      </div>
    </main>
  );
}
