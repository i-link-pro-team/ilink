import { from, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { NestjsConsulKvRealtimeService } from './nestjs-consul-kv-realtime.service';
import {
  ConsulKeyValueOptions,
  InjectedStorageItem,
} from './nestjs-consul-kv-realtime.types';

export const CONSUL_KEY_VALUE_METADATA = 'consul-key-value:metadata';

export const CONSUL_KEY_VALUE_DECORATOR_STORAGE: InjectedStorageItem[] = [];

export function ConsulKeyValue(options: ConsulKeyValueOptions) {
  return function (target: object, propertyKey: string) {
    const injectedStorageItem: InjectedStorageItem = {
      options,
    };

    const index =
      CONSUL_KEY_VALUE_DECORATOR_STORAGE.push(injectedStorageItem) - 1;

    Object.defineProperty(target, propertyKey, {
      get: function () {
        if (!CONSUL_KEY_VALUE_DECORATOR_STORAGE[index]) {
          throw new Error('injectedStorageItem not set');
        }

        if (CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].options.stream) {
          return CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].stream;
        }

        return CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].value;
      },
    });
  };
}

export async function addAllFirstValuesForDecoratedFields() {
  for (
    let index = 0;
    index < CONSUL_KEY_VALUE_DECORATOR_STORAGE.length;
    index++
  ) {
    if (!CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].stream) {
      CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].stream =
        NestjsConsulKvRealtimeService.getInstance().listen(
          CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].options
        );

      CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].listenerSubscription =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        CONSUL_KEY_VALUE_DECORATOR_STORAGE[index]
          .stream!.pipe(
            mergeMap((value) => {
              const factory =
                CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].options.factory;
              return factory
                ? from(
                    factory(
                      value,
                      CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].value
                    )
                  )
                : of(value);
            }),
            tap(
              (value) =>
                (CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].value = value)
            )
          )
          .subscribe();
    }

    const factory = CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].options.factory;
    const value = await NestjsConsulKvRealtimeService.getInstance().getValue(
      CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].options.key
    );
    CONSUL_KEY_VALUE_DECORATOR_STORAGE[index].value = factory
      ? await factory(value)
      : value;
  }
}
