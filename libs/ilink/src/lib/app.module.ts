import { Module } from '@nestjs/common';
import { EnvToConsulModule } from './env-to-consul/env-to-consul.module';

@Module({
  imports: [EnvToConsulModule.forRoot()],
})
export class AppModule {}
