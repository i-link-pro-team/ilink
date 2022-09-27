import { Module } from '@nestjs/common';
import { EnvToConsulModule } from './files-to-consul/files-to-consul.module';

@Module({
  imports: [EnvToConsulModule.forRoot()],
})
export class AppModule {}
