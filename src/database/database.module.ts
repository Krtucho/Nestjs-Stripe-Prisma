import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './application/database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService]
})
export class DatabaseModule {}
