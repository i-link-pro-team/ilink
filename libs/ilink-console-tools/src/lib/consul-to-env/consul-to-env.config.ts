export interface ConsulToEnvConfig {
  consulToEnv: {
    path?: string;
    clear?: boolean;
    trimPaths?: boolean;
    consulHost?: string;
    consulPort?: number;
    consulDc?: string;
    consulSecure?: boolean;
    consulKey?: string;
    consulToken: string;
  };
}

export const DEFAULT_CONSUL_TO_ENV_CONFIG: {
  consulToEnv: Omit<
    ConsulToEnvConfig['consulToEnv'],
    'consulDc' | 'consulToken'
  >;
} = {
  consulToEnv: {
    path: '.env',
    clear: false,
    trimPaths: false,
    consulHost: 'localhost',
    consulPort: 8500,
    consulSecure: false,
    consulKey: '',
  },
};
