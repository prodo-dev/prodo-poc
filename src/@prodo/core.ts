import { produce, setAutoFreeze } from "immer";
import watcher from "./watcher";

setAutoFreeze(false);

declare global {
  interface Window {
    _prodo: any;
  }
}

type Model<Data> = {
  data: Data;
  useData: (handler?: any) => Data;
  useActions: <Actions>(actions: Actions) => () => Actions;
  createStore: (init: Data) => Store;
};

type Store = {
  plugins: any;
  universe: any;
  dispatch: any;
  components: any;
};

window._prodo = {};

export function model<Data>(plugins: any): Model<Data> {
  return {
    data: dataProxies<Data>(plugins),
    useData: handler => {
      window._prodo.rendering.handler = handler;
      return watcher(
        window._prodo.rendering.store.universe,
        window._prodo.rendering.watching,
        plugins,
      );
    },
    useActions: <A>(actions: A) => () => {
      const connected: any = {};
      const { store, id } = window._prodo.rendering;
      Object.keys(actions).forEach((name: string) => {
        connected[name] = (...args: any) => {
          exec(store, { id }, (actions as any)[name], args);
        };
      });
      return connected;
    },
    createStore: init => {
      let ROOT_ID = 0;
      const store = {
        plugins,
        universe: {},
        components: {},
        dispatch(action: any, ...args: any) {
          return new Promise(resolve => {
            exec(store, { id: "$" + ROOT_ID++ }, action, args, resolve);
          });
        },
      };
      Object.keys(plugins).forEach(key => {
        plugins[key].init(store, init);
      });
      return store;
    },
  };
}

function dataProxies<Data>(plugins: any): Data {
  const get = (_: any, name: string) => dataProxy(name, plugins);
  return new Proxy({}, { get }) as any;
}

function dataProxy(name: string, plugins: any) {
  const get = (_: any, field: string) => {
    return plugins[name].dataProxy.get(field);
  };
  const set = (_: any, field: string, value: string) => {
    return plugins[name].dataProxy.set(field, value);
  };
  return new Proxy({}, { get, set }) as any;
}

type UnPromise<T> = T extends Promise<infer V> ? V : T;
type UnAsync<T> = T extends (...args: infer U) => infer R
  ? (...args: U) => UnPromise<R>
  : never;
type UnAsyncAll<T extends object> = { [K in keyof T]: UnAsync<T[K]> };

function isPromise(value: any) {
  return value && typeof value === "object" && typeof value.then === "function";
}

export function effects<T extends object>(funcs: T): UnAsyncAll<T> {
  const res: any = {};
  Object.keys(funcs).forEach(name => {
    const func: any = (funcs as any)[name];
    res[name] = (...effectArgs: any) => {
      const [store, event, action, args, cb] = window._prodo.executing;
      // use memoized result if already computed
      if (event.effects.index < event.effects.memo.length) {
        const val = event.effects.memo[event.effects.index];
        event.effects.index++;
        return val;
      }
      const result = func(...effectArgs);
      if (isPromise(result)) {
        result.then((value: any) => {
          // memoize result
          event.effects.memo.push(value);
          // memoize restart from top
          event.effects.index = 0;
          exec(store, event, action, args, cb);
        });
        throw new Error("@WAIT!");
      } else {
        event.effects.memo.push(result);
        event.effects.index++;
        return result;
      }
    };
  });
  return res;
}

function prepareEvent(event: any) {
  if (!event.id) throw new Error("missing event id");
  if (!event.effects) event.effects = { memo: [], index: 0 };
}

export function exec(
  store: Store,
  event: any,
  action: Function,
  args: any[],
  cb?: Function,
) {
  prepareEvent(event);
  window._prodo.executing = [store, event, action, args, cb];
  let nextUniverse, patches;
  try {
    nextUniverse = produce(
      store.universe,
      (universe: any) => {
        window._prodo.universe = universe;
        action(...args);
      },
      (p: any) => {
        patches = p;
      },
    );
  } catch (e) {
    if (e.message === "@WAIT!") return;
    throw e;
  }
  sendPatchesToPlugins(patches, store.plugins);
  selectiveRerender(store, event, nextUniverse);
  console.log("action", {
    ...event,
    action: action.name,
    args,
    prev: store.universe,
    next: nextUniverse,
    patches,
  });
  store.universe = nextUniverse;
  if (cb) cb(store);
}

function sendPatchesToPlugins(patches: any, plugins: any) {
  const grouped: any = {};
  patches.forEach((patch: any) => {
    const k = patch.path[0];
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push({ ...patch, path: patch.path.slice(1) });
  });
  Object.keys(grouped).forEach(k => {
    if (plugins[k].applyPatches) {
      plugins[k].applyPatches(grouped[k]);
    }
  });
}

export function pluginExec(store: any, event: any, func: any) {
  let patches;
  const nextUniverse = produce(store.universe, func, p => {
    patches = p;
  });
  console.log("plugin action", {
    ...event,
    patches,
    prev: store.universe,
    next: nextUniverse,
  });
  store.universe = nextUniverse;
  selectiveRerender(store, event, nextUniverse);
}

function hasChanged({ path, type, value }: any, nextUniverse: any) {
  const nextVal = path.reduce((p: any, n: any) => (p || {})[n], nextUniverse);
  if (type === "value") {
    return value !== nextVal;
  } else if (type === "keys") {
    const nextKeys = Object.keys(nextVal);
    return !(
      value.length === nextKeys.length &&
      value.every((v: any, i: any) => v === nextKeys[i])
    );
  } else {
    throw new Error(`NYI - type: ${type}`);
  }
}

function selectiveRerender(store: Store, event: any, nextUniverse: any) {
  Object.keys(store.components)
    .map((id: string) => store.components[id])
    .map(c => ({
      ...c,
      changed: Object.keys(c.watching).find(path =>
        hasChanged(c.watching[path], nextUniverse),
      ),
    }))
    .filter(c => c.changed)
    .sort((c1, c2) => c1.order - c2.order)
    .forEach(c => {
      console.log("rerender", {
        id: c.id,
        changedPath: c.changed,
        triggeredBy: event.id,
      });
      c.rerender();
    });
}
