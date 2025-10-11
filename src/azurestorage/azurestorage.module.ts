import { Module } from '@nestjs/common';
import { AzurestorageService } from './azurestorage.service';
import { AzurestorageController } from './azurestorage.controller';

@Module({
  controllers: [AzurestorageController],
  providers: [AzurestorageService],
})
export class AzurestorageModule {}
