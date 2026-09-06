import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRedirectDto } from './dto/create-redirect.dto';

@Injectable()
export class RedirectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRedirectDto) {
    const existing = await this.prisma.redirect.findUnique({
      where: { fromPath: dto.fromPath },
    });
    if (existing)
      throw new ConflictException(
        `A redirect from "${dto.fromPath}" already exists`,
      );

    return this.prisma.redirect.create({
      data: {
        fromPath: dto.fromPath,
        toPath: dto.toPath,
        statusCode: dto.statusCode ?? 301,
      },
    });
  }

  async findAll() {
    return this.prisma.redirect.findMany();
  }

  async findByPath(fromPath: string) {
    return this.prisma.redirect.findUnique({ where: { fromPath } });
  }

  async remove(id: string) {
    const redirect = await this.prisma.redirect.findUnique({ where: { id } });
    if (!redirect) throw new NotFoundException('Redirect not found');
    return this.prisma.redirect.delete({ where: { id } });
  }
}
