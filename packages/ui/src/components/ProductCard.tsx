interface ProductCardProps {
  name: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string;
  href?: string;
}

function formatToman(rial: number): string {
  const toman = Math.floor(rial / 10);
  return new Intl.NumberFormat("fa-IR").format(toman) + " تومان";
}

export function ProductCard({
  name,
  price,
  salePrice,
  imageUrl,
  href,
}: ProductCardProps) {
  const displayPrice = salePrice ?? price;
  const onSale = salePrice != null && salePrice < price;

  const content = (
    <div className="rounded-lg overflow-hidden border border-foreground/10 bg-background">
      <div className="aspect-square bg-foreground/5">
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-foreground truncate">{name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-body text-primary font-semibold">
            {formatToman(displayPrice)}
          </span>
          {onSale && (
            <span className="font-body text-foreground/50 text-sm line-through">
              {formatToman(price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return href ? <a href={href}>{content}</a> : content;
}
