import { getDoc, applyPatches } from "./mock-db";
import { exec, pluginExec } from "../core";

declare global {
  interface Window {
    _prodo: any;
  }
}

export const auth: any = {
  init(store: any, config: any) {
    store.universe.auth = config.auth;
  },
  dataProxy: {
    get(field: string) {
      return window._prodo.universe.auth[field];
    },
    set(field: string, value: any) {
      throw new Error("auth is read-only");
    }
  }
};

export const db: any = {
  init(store: any, config: any) {
    store.universe.db = config.db;
  },
  dataProxy: {
    get(collection: string) {
      return collectionProxy(collection);
    },
    set(field: string, value: any) {
      throw new Error("db collections are read-only");
    }
  },
  beforeWatcher(object: any, path: any, prop: any) {
    if (path.length === 2 && !object[prop]) {
      const { store } = window._prodo.rendering;
      const [collection, doc] = [path[1], prop];
      getDoc(path[1], prop).then(data => {
        pluginExec(store, { id: "(db-fetch)" }, (universe: any) => {
          universe.db[collection][doc] = data;
        });
      });
      throw new Error("@FETCHING!");
    }
  },
  applyPatches
};

function collectionProxy(collection: string) {
  const get = (_: any, doc: string) => {
    const uid = collection + "/" + doc;
    const [store, event, action, args, cb] = window._prodo.executing;
    const col = window._prodo.universe.db[collection];
    if (col[doc]) {
      return col[doc];
    } else if (event.dbFetch && event.dbFetch[uid]) {
      col[doc] = event.dbFetch[uid];
      return col[doc];
    } else {
      getDoc(collection, doc).then(data => {
        if (!event.dbFetch) event.dbFetch = {};
        event.dbFetch[uid] = data;
        exec(store, event, action, args, cb);
      });
      throw new Error("@WAIT!");
    }
  };
  const set = (_: any, doc: string, value: any) => {
    return Reflect.set(window._prodo.universe.db[collection], doc, value);
  };
  return new Proxy({}, { get, set });
}
