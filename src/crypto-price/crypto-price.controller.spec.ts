import { Test, TestingModule } from '@nestjs/testing';

import { CryptoPriceController } from './crypto-price.controller';
import { CryptoPriceService } from './crypto-price.service';

describe('CryptoPriceController', () => {
  let controller: CryptoPriceController;
  let service: CryptoPriceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CryptoPriceController],
      providers: [
        {
          provide: CryptoPriceService,
          useValue: {
            getCryptoPrice: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CryptoPriceController>(CryptoPriceController);
    service = module.get<CryptoPriceService>(CryptoPriceService);
  });

  it('should return price for valid pair', async () => {
    const pair = 'TON_USDT';
    const price = 10;
    jest.spyOn(service, 'getCryptoPrice').mockResolvedValue(price);

    const result = await controller.getCryptoPrice(pair);

    expect(result).toEqual({ pair, price });
    expect(service.getCryptoPrice).toHaveBeenCalledWith(pair);
  });

  it('should throw an error for invalid pair format', async () => {
    const pair = 'INVALID PAIR';

    await expect(controller.getCryptoPrice(pair)).rejects.toThrow(
      'Invalid pair format',
    );
  });
});
