import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

import { CryptoPriceService } from './crypto-price.service';
import { CryptoPriceEntity } from './crypto-price.entity';

class CryptoPairParam {
  @IsString()
  @Matches(/^[A-Z0-9]+_[A-Z0-9]+$/, {
    message: 'Pair must be in FORMAT_FORMAT format (e.g., BTC_USD)',
  })
  pair: string;
}

class HistoricalPriceQueryDto {
  @IsString()
  @Matches(/^[A-Z0-9]+_[A-Z0-9]+$/, {
    message: 'Pair must be in FORMAT_FORMAT format (e.g., BTC_USD)',
  })
  pair: string;

  @IsString()
  startDate: string;

  @IsString()
  endDate: string;
}

interface PriceResponse {
  pair: string;
  price: number;
  timestamp: number;
}

@Injectable()
@Controller('crypto-price')
@ApiTags('Cryptocurrency')
export class CryptoPriceController {
  constructor(private readonly cryptoPriceService: CryptoPriceService) {}

  @Get('historical')
  @ApiOperation({ summary: 'Get historical cryptocurrency prices' })
  async getHistoricalPrices(
    @Query(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    )
    query: HistoricalPriceQueryDto,
  ): Promise<CryptoPriceEntity[]> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    if (!startDate || !endDate) {
      throw new HttpException(
        'Start date and end date are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (startDate > endDate) {
      throw new HttpException(
        'Start date must be before end date',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.cryptoPriceService.getHistoricalPrices(
      query.pair,
      startDate,
      endDate,
    );
  }

  @Get(':pair')
  @ApiOperation({ summary: 'Get cryptocurrency price for a trading pair' })
  @ApiParam({
    name: 'pair',
    example: 'BTC_USD',
    description: 'Trading pair in FORMAT_FORMAT format',
  })
  @ApiResponse({
    status: 200,
    description: 'Price retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        pair: { type: 'string' },
        price: { type: 'number' },
        timestamp: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid pair format' })
  @ApiResponse({ status: 503, description: 'Price service unavailable' })
  async getCryptoPrice(
    @Param() params: CryptoPairParam,
  ): Promise<PriceResponse> {
    try {
      const price = await this.cryptoPriceService.getCryptoPrice(params.pair);
      return {
        pair: params.pair,
        price,
        timestamp: Date.now(),
      };
    } catch (error) {
      if (error.message === 'Invalid pair format') {
        throw new HttpException(
          'Invalid trading pair format',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Price service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
