import Consul from 'consul';
import { Observable, Subscription } from 'rxjs';

export interface NestjsConsulKvRealtimeWatcher {
  key: string;
  interval?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  callback?: (value: unknown, consul: Consul.Consul) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConsulKeyValueOptions<CT = any, T = any> = Omit<
  NestjsConsulKvRealtimeWatcher,
  'callback'
> & {
  stream?: boolean;
  factory?: (newConsulValue: CT, oldValue?: T) => Promise<T>;
};

export interface InjectedStorageItem {
  options: ConsulKeyValueOptions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream?: Observable<any>;
  listenerSubscription?: Subscription;
}
