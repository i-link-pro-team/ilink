import { DynamicModule, Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { UtilsModule } from '../utils/utils.module';
import { ConsulToEnvCommands } from './consul-to-env.commands';
import { ConsulToEnvService } from './consul-to-env.service';

@Module({
  imports: [ConsoleModule, UtilsModule],
  providers: [ConsulToEnvService],
  exports: [ConsulToEnvService],
})
export class ConsulToEnvModule {
  static forRoot(): DynamicModule {
    return {
      module: ConsulToEnvModule,
      providers: [ConsulToEnvCommands],
    };
  }
}
