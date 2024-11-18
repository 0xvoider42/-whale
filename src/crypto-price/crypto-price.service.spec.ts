import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER, CacheModule } from '@nestjs/cache-manager';

import { CryptoPriceService } from './crypto-price.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CryptoPriceService', () => {
  let service: CryptoPriceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      providers: [
        CryptoPriceService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CryptoPriceService>(CryptoPriceService);
  });

  it('should fetch price for TON_USDT pair', async () => {
    const pair = 'TON_USDT';
    const tonPriceInUsd = 2;
    const usdtPriceInUsd = 1;
    const expectedPrice = tonPriceInUsd / usdtPriceInUsd;

    mockedAxios.get.mockResolvedValue({
      data: {
        'the-open-network': { usd: tonPriceInUsd },
        tether: { usd: usdtPriceInUsd },
      },
    });

    const price = await service.getCryptoPrice(pair);

    expect(price).toBe(expectedPrice);
  });

  it('should throw an error if fetching price fails', async () => {
    const pair = 'BTC_USD';

    mockedAxios.get.mockRejectedValue(new Error('API error'));

    await expect(service.getCryptoPrice(pair)).rejects.toThrow('API error');
  });
});
