import { notFound } from "next/navigation";

interface ProductDetail {
  id: string;
  price: number;
  salePrice: number | null;
  stock: number;
  images: string[];
  translations: { name: string; description: string | null }[];
}

async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const res = await fetch(`http://localhost:3000/products/slug/fa/${slug}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const translation = product.translations[0];

  return (
    <main style={{ padding: "2rem" }}>
      <h1 className="font-heading text-2xl text-foreground">
        {translation?.name}
      </h1>
      {product.images[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`http://localhost:3000${product.images[0]}`}
          alt={translation?.name}
          style={{ maxWidth: "400px", marginTop: "1rem" }}
        />
      )}
      <p className="font-body text-foreground" style={{ marginTop: "1rem" }}>
        {translation?.description ?? "No description available."}
      </p>
      <p
        className="font-body text-primary font-semibold"
        style={{ marginTop: "1rem" }}
      >
        {new Intl.NumberFormat("fa-IR").format(
          Math.floor((product.salePrice ?? product.price) / 10),
        )}{" "}
        تومان
      </p>
      <p className="font-body text-foreground/60 text-sm">
        {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
      </p>
    </main>
  );
}
