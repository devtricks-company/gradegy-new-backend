import { Test, TestingModule } from '@nestjs/testing';
import { AzurestorageController } from './azurestorage.controller';
import { AzurestorageService } from './azurestorage.service';

describe('AzurestorageController', () => {
  let controller: AzurestorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AzurestorageController],
      providers: [AzurestorageService],
    }).compile();

    controller = module.get<AzurestorageController>(AzurestorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
