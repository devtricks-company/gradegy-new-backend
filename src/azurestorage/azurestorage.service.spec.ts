import { Test, TestingModule } from '@nestjs/testing';
import { AzurestorageService } from './azurestorage.service';

describe('AzurestorageService', () => {
  let service: AzurestorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AzurestorageService],
    }).compile();

    service = module.get<AzurestorageService>(AzurestorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
