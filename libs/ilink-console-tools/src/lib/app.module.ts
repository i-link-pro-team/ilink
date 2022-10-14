import { Module } from '@nestjs/common';
import { ConsulToEnvModule } from './consul-to-env/consul-to-env.module';
import { EnvToConsulModule } from './env-to-consul/env-to-consul.module';

@Module({
  imports: [EnvToConsulModule.forRoot(), ConsulToEnvModule.forRoot()],
})
export class AppModule {}
