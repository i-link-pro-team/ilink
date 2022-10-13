import { DynamicModule, Module } from '@nestjs/common';
import { ConsoleModule } from 'nestjs-console';
import { UtilsModule } from '../utils/utils.module';
import { EnvToConsulCommands } from './env-to-consul.commands';
import { EnvToConsulService } from './env-to-consul.service';

@Module({
  imports: [ConsoleModule, UtilsModule],
  providers: [EnvToConsulService],
  exports: [EnvToConsulService],
})
export class EnvToConsulModule {
  static forRoot(): DynamicModule {
    return {
      module: EnvToConsulModule,
      providers: [EnvToConsulCommands],
    };
  }
}
