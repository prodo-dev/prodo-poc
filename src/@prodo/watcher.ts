export const join = (arr: any[]): string => "/" + arr.join("/");

const lengthWatcher = (arr: any, mem: any, path: any) => {
  return new Proxy(arr, {
    get: (target, prop, receiver) => {
      if (prop === "length") {
        mem[join(path.concat("@length"))] = {
          path: path,
          type: "length",
          value: target.length,
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  });
};

export const watchPath = (path: string[], type: string, value: any) => {
  window._prodo.rendering.watching[join(path.concat(`@${type}`))] = {
    path,
    type,
    value,
  };
};

function watcher(object: any, mem: any, plugins: any, path: any = []): any {
  if (typeof object !== "object") return object;
  return new Proxy(object, {
    get(target, prop: string, receiver) {
      if ((plugins[path[0]] || {}).beforeWatcher) {
        try {
          const val = plugins[path[0]].beforeWatcher(object, path, prop);

          if (val != null) {
            return val;
          }
        } catch (e) {
          mem[join(path.concat(prop).concat("@value"))] = {
            path: path.concat(prop),
            type: "value",
            value: target[prop],
          };
          throw e;
        }
      }
      if (Array.isArray(target[prop])) {
        return lengthWatcher(
          target[prop].map((o: any, i: any) =>
            watcher(o, mem, plugins, path.concat([prop, i])),
          ),
          mem,
          path.concat(prop),
        );
      } else if (typeof target[prop] === "object") {
        return watcher(target[prop], mem, plugins, path.concat([prop]));
      } else {
        mem[join(path.concat(prop).concat("@value"))] = {
          path: path.concat(prop),
          type: "value",
          value: target[prop],
        };
        return Reflect.get(target, prop, receiver);
      }
    },
    ownKeys(target) {
      mem[join(path.concat("@keys"))] = {
        path,
        type: "keys",
        value: Object.keys(target),
      };
      return Reflect.ownKeys(target);
    },
  });
}

export default watcher;
