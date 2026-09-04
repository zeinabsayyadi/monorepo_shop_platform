import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.module';
import { PrismaService } from '../prisma/prisma.service';

const CART_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface AvailableCartItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  available: true;
  maxStock: number;
}

export interface UnavailableCartItem {
  productId: string;
  quantity: number;
  available: false;
}

type CartItem = AvailableCartItem | UnavailableCartItem;

export interface CartSummary {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

@Injectable()
export class CartService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  private key(cartId: string): string {
    return `cart:${cartId}`;
  }

  async addItem(cartId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      throw new BadRequestException('Product not found or unavailable');
    }

    const key = this.key(cartId);
    const existingQty = Number((await this.redis.hget(key, productId)) ?? 0);
    const newQty = existingQty + quantity;

    if (newQty > product.stock) {
      throw new BadRequestException(`Only ${product.stock} in stock`);
    }

    await this.redis.hset(key, productId, newQty);
    await this.redis.expire(key, CART_TTL_SECONDS);
    return this.getCart(cartId);
  }

  async updateItem(cartId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) {
      throw new BadRequestException('Product not found or unavailable');
    }
    if (quantity > product.stock) {
      throw new BadRequestException(`Only ${product.stock} in stock`);
    }

    const key = this.key(cartId);
    await this.redis.hset(key, productId, quantity);
    await this.redis.expire(key, CART_TTL_SECONDS);
    return this.getCart(cartId);
  }

  async removeItem(cartId: string, productId: string) {
    await this.redis.hdel(this.key(cartId), productId);
    return this.getCart(cartId);
  }

  async clearCart(cartId: string) {
    await this.redis.del(this.key(cartId));
    return { items: [], subtotal: 0, itemCount: 0 };
  }

  async getCart(cartId: string): Promise<CartSummary> {
    const raw = await this.redis.hgetall(this.key(cartId));
    const productIds = Object.keys(raw);
    if (productIds.length === 0)
      return { items: [], subtotal: 0, itemCount: 0 };

    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { translations: { where: { locale: 'fa' } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let itemCount = 0;
    const items = productIds.map((productId): CartItem => {
      const quantity = Number(raw[productId]);
      const product = productMap.get(productId);

      if (!product || !product.isActive) {
        return { productId, quantity, available: false };
      }

      const unitPrice = product.salePrice ?? product.price;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;
      itemCount += quantity;

      return {
        productId,
        name: product.translations[0]?.name ?? product.sku,
        unitPrice,
        quantity,
        lineTotal,
        available: true,
        maxStock: product.stock,
      };
    });

    return { items, subtotal, itemCount };
  }

  async mergeGuestCartIntoUserCart(guestCartId: string, userCartId: string) {
    const guestKey = this.key(guestCartId);
    const userKey = this.key(userCartId);

    const guestItems = await this.redis.hgetall(guestKey);
    const entries = Object.entries(guestItems);
    if (entries.length === 0) return;

    for (const [productId, qtyStr] of entries) {
      const guestQty = Number(qtyStr);
      const existingQty = Number(
        (await this.redis.hget(userKey, productId)) ?? 0,
      );
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      const cappedQty = product
        ? Math.min(existingQty + guestQty, product.stock)
        : existingQty + guestQty;
      await this.redis.hset(userKey, productId, cappedQty);
    }

    await this.redis.expire(userKey, CART_TTL_SECONDS);
    await this.redis.del(guestKey);
  }
}
