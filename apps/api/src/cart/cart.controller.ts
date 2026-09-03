import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import type {} from 'cookie-parser';

const GUEST_CART_COOKIE = 'guestCartId';

@Controller('cart')
@UseGuards(OptionalJwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  private resolveCartId(req: Request, res: Response): string {
    const user = (req as any).user;
    if (user) return `user:${user.id}`;

    let guestId = req.cookies?.[GUEST_CART_COOKIE];
    if (!guestId) {
      guestId = crypto.randomUUID();
      res.cookie(GUEST_CART_COOKIE, guestId, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    return `guest:${guestId}`;
  }

  @Get()
  getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.cartService.getCart(this.resolveCartId(req, res));
  }

  @Post('items')
  addItem(
    @Body() dto: AddCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.cartService.addItem(
      this.resolveCartId(req, res),
      dto.productId,
      dto.quantity,
    );
  }

  @Patch('items/:productId')
  updateItem(
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.cartService.updateItem(
      this.resolveCartId(req, res),
      productId,
      dto.quantity,
    );
  }

  @Delete('items/:productId')
  removeItem(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.cartService.removeItem(this.resolveCartId(req, res), productId);
  }

  @Delete()
  clearCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.cartService.clearCart(this.resolveCartId(req, res));
  }
}
