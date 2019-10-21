import { getDocs, getDoc, applyPatches } from "./mock-db";
import { exec, pluginExec } from "../core";
import { Query } from "./types";

const querySymbol = Symbol("query");

window._queries = {};

export const query = <T>(
  obj: { [key: string]: T },
  queryVal: Query = {},
): Array<{ id: string } & T> => {
  const { collection, type, store } = (obj as any)[querySymbol];

  console.log("COLLECTION", collection);

  if (collection == null || typeof collection !== "string") {
    throw new Error("query error");
  }

  if (type === "component") {
    const queryKey = `${collection}-${JSON.stringify(queryVal)}`;
    const q = window._queries[queryKey];

    if (q == null || q.value == null) {
      getDocs(collection, queryVal).then(data => {
        pluginExec(store, { id: "(db-fetch)" }, (universe: any) => {
          data.forEach(doc => {
            universe.db[collection][doc.id] = doc;
          });

          window._queries[queryKey] = {
            collection,
            query: queryVal,
            value: data,
          };
        });
      });

      throw new Error("@FETCHING!");
    }

    return window._queries[queryKey].value!;
  } else if (type === "action") {
    throw new Error("nyi: query action");
  } else {
    throw new Error(`unknown type: ${type}`);
  }
};

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
    },
  },
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
    },
  },
  beforeWatcher(object: any, path: string[], prop: any) {
    const { store } = window._prodo.rendering;

    if (prop === querySymbol) {
      return { collection: path[path.length - 1], type: "component", store };
    }

    if (path.length === 2 && !object[prop]) {
      const [collection, doc] = [path[1], prop];
      getDoc(path[1], prop).then(data => {
        pluginExec(store, { id: "(db-fetch)" }, (universe: any) => {
          universe.db[collection][doc] = data;
        });
      });
      throw new Error("@FETCHING!");
    }
  },
  applyPatches,
};

function collectionProxy(collection: string) {
  const get = (_: any, doc: string | symbol) => {
    console.log("DOC", doc, typeof doc);

    if (doc === querySymbol) {
      return collection;
    }

    if (typeof doc !== "string") {
      throw new Error("symbols not supported");
    }

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
    const res = Reflect.set(window._prodo.universe.db[collection], doc, value);

    return res;
  };
  return new Proxy({}, { get, set });
}
