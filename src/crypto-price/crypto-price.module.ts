import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { CryptoPriceService } from './crypto-price.service';
import { CryptoPriceController } from './crypto-price.controller';
import { CryptoPriceEntity } from './crypto-price.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forFeature([CryptoPriceEntity]),
    CacheModule.register({
      ttl: 1800,
    }),
  ],
  providers: [CryptoPriceService],
  controllers: [CryptoPriceController],
})
export class CryptoPriceModule {}
