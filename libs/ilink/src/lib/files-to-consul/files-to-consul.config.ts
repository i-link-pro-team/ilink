export interface EnvToConsulConfig {
  envToConsul: {
    path?: string;
    consulHost?: string;
    consulPort?: number;
    consulDc?: string;
    consulSecure?: boolean;
    consulKey?: string;
    consulToken: string;
    consulClear?: boolean;
  };
}

export const DEFAULT_ENV_TO_CONSUL_CONFIG: {
  envToConsul: Omit<
    EnvToConsulConfig['envToConsul'],
    'consulDc' | 'consulToken'
  >;
} = {
  envToConsul: {
    path: '.env',
    consulHost: 'localhost',
    consulPort: 8500,
    consulSecure: false,
    consulClear: false,
    consulKey: '',
  },
};
