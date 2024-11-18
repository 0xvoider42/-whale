import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import {
  Inject,
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CryptoPriceEntity } from './crypto-price.entity';
import { Between, Repository } from 'typeorm';

interface CryptoPrice {
  price: number;
  lastUpdated: Date;
}

@Injectable()
export class CryptoPriceService {
  private readonly logger = new Logger(CryptoPriceService.name);
  private readonly API_URL = 'https://api.coingecko.com/api/v3/simple/price';
  private readonly SUPPORTED_PAIRS = ['TON_USDT', 'USDT_TON'];
  private readonly CACHE_TIME = 180 * 10000; // 30 minutes

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(CryptoPriceEntity)
    private priceRepository: Repository<CryptoPriceEntity>,
    private configService: ConfigService,
  ) {}

  async getCryptoPrice(pair: string): Promise<number> {
    if (!this.isValidPair(pair)) {
      throw new HttpException(
        `Unsupported trading pair: ${pair}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const cacheKey = `crypto-price-${pair}`;

    try {
      const cachedPrice = await this.cacheManager.get<CryptoPrice>(cacheKey);

      if (this.isValidCachedPrice(cachedPrice)) {
        this.logger.debug(`Cache hit for ${pair}`);
        return cachedPrice.price;
      }

      return await this.fetchAndCachePrice(pair, cacheKey);
    } catch (error) {
      this.handleError(error, pair);
    }
  }

  private async fetchAndCachePrice(
    pair: string,
    cacheKey: string,
  ): Promise<number> {
    this.logger.debug(`Cache miss for ${pair}, fetching fresh price`);

    const [base, quote] = pair.split('_');

    try {
      const price = await this.fetchPrice(base, quote);

      await this.priceRepository.save({
        pair,
        price,
      });

      await this.cacheManager.set(
        cacheKey,
        { price, lastUpdated: new Date() },
        this.CACHE_TIME,
      );

      return price;
    } catch (error) {
      this.logger.error(`Failed to fetch/cache price for ${pair}`, error.stack);
      throw error;
    }
  }

  private async fetchPrice(base: string, quote: string): Promise<number> {
    if (this.isTonUsdtPair(base, quote)) {
      return this.getTonUsdtPrice(base, quote);
    }

    const apiKey = this.configService.get<string>('COINGECKO_API_KEY');
    if (!apiKey) {
      throw new Error('COINGECKO_API_KEY not configured');
    }

    const response = await axios.get(this.API_URL, {
      headers: { 'x-cg-demo-api-key': apiKey },
      params: { ids: base, vs_currencies: quote },
      timeout: 5000,
    });

    const price = response.data[base.toLowerCase()]?.[quote.toLowerCase()];
    if (!price) {
      throw new Error(`Price not found for ${base}_${quote}`);
    }

    return price;
  }

  private async getTonUsdtPrice(base: string, quote: string): Promise<number> {
    try {
      const response = await axios.get(`${this.API_URL}`, {
        headers: {
          'x-cg-demo-api-key': process.env.COINGECKO_API_KEY,
        },
        params: {
          ids: 'the-open-network,tether',
          vs_currencies: 'usd',
        },
      });

      const tonPriceInUsd = response?.data['the-open-network'].usd;
      const usdtPriceInUsd = response?.data['tether'].usd;

      if (base === 'TON' && quote === 'USDT') {
        return tonPriceInUsd / usdtPriceInUsd;
      } else if (base === 'USDT' && quote === 'TON') {
        return usdtPriceInUsd / tonPriceInUsd;
      } else {
        throw new Error(`Invalid pair: ${base}_${quote}`);
      }
    } catch (error) {
      this.logger.error('Failed to fetch TON/USDT price', error.stack);
      throw new Error('Failed to fetch TON/USDT price');
    }
  }

  async getHistoricalPrices(
    pair: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CryptoPriceEntity[]> {
    if (!this.isValidPair(pair)) {
      throw new HttpException(
        `Unsupported trading pair: ${pair}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.priceRepository.find({
      where: {
        pair,
        timestamp: Between(startDate, endDate),
      },
      order: {
        timestamp: 'DESC',
      },
    });
  }

  private isValidPair(pair: string): boolean {
    return this.SUPPORTED_PAIRS.includes(pair);
  }

  private isValidCachedPrice(cached: CryptoPrice | undefined): boolean {
    if (!cached || !cached.price || !cached.lastUpdated) {
      return false;
    }

    const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
    return cacheAge < this.CACHE_TIME;
  }

  private isTonUsdtPair(base: string, quote: string): boolean {
    return (
      (base === 'TON' && quote === 'USDT') ||
      (base === 'USDT' && quote === 'TON')
    );
  }

  private handleError(error: any, pair: string): never {
    this.logger.error(`Error fetching price for ${pair}:`, error.stack);

    if (error instanceof HttpException) {
      throw error;
    }

    if (error.response?.status === 429) {
      throw new HttpException(
        'Rate limit exceeded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (error.code === 'ECONNABORTED') {
      throw new HttpException(
        'External API timeout',
        HttpStatus.GATEWAY_TIMEOUT,
      );
    }

    throw new HttpException(
      'Failed to fetch cryptocurrency price',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
