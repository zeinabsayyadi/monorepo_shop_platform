import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.address.create({ data: { ...dto, userId } });
  }

  async findAllForUser(userId: string) {
    return this.prisma.address.findMany({ where: { userId } });
  }

  async findOneOwned(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException(`Address ${id} not found`);
    if (address.userId !== userId)
      throw new ForbiddenException('Not your address');
    return address;
  }

  async remove(userId: string, id: string) {
    await this.findOneOwned(userId, id);
    return this.prisma.address.delete({ where: { id } });
  }
}
