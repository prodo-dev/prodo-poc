import { getDocs, getDoc, applyPatches, applyQuery } from "./mock-db";
import { exec, pluginExec } from "../core";
import { Query } from "./types";
import { join } from "../watcher";

const querySymbol = Symbol("query");

interface Universe {
  db: any;
  queries: {
    [key: string]: {
      collection: string;
      query: Query;
      ids: string[];
    };
  };
}

interface Store {
  universe: Universe;
}

const getQueryKey = (collection: string, queryVal: Query): string =>
  `${collection}-${JSON.stringify(queryVal)}`;

const extractData = (
  store: Store,
  collection: string,
  ids: string[],
): any[] => {
  return ids.map(id => store.universe.db[collection][id]);
};

export const query = <T>(
  obj: { [key: string]: T },
  queryVal: Query = {},
): Array<{ id: string } & T> => {
  console.log("QUERYING");

  const { collection, type, store } = (obj as any)[querySymbol] as {
    collection?: string;
    type: string;
    store: Store;
  };

  if (collection == null || typeof collection !== "string") {
    throw new Error("query error");
  }

  const queryKey = getQueryKey(collection, queryVal);

  if (type === "component") {
    const q = store.universe.queries[queryKey];

    const queryPath = ["queries", queryKey, "ids"];

    window._prodo.rendering.watching[join(queryPath.concat("@value"))] = {
      path: queryPath,
      type: "value",
      value: (q || {}).ids,
    };

    if (q == null) {
      getDocs(collection, queryVal).then(data => {
        pluginExec(store, { id: "(db-fetch)" }, (universe: Universe) => {
          console.log("data", data);
          data.forEach(doc => {
            universe.db[collection][doc.id] = doc;
          });

          universe.queries[queryKey] = {
            collection,
            query: queryVal,
            ids: data.map(d => d.id),
          };

          console.log("\n\nIDS", universe.queries[queryKey].ids);
        });
      });

      throw new Error("@FETCHING!");
    } else {
      q.ids.forEach(id => {
        const idPath = ["db", collection, id];
        window._prodo.rendering.watching[join(idPath.concat("@value"))] = {
          path: idPath,
          type: "value",
          value: store.universe.db[collection][id],
        };
      });
    }

    return extractData(store, collection, q.ids);
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
    store.universe.queries = {};
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
  applyPatches(patches: any) {
    applyPatches(patches);

    const store: Store = (window as any)._store;
    const universe: Universe = store.universe;

    Object.values(universe.queries).forEach(({ collection, query }) => {
      getDocs(collection, query).then(data => {
        pluginExec(store, { id: "(db-fetch)" }, (universe: Universe) => {
          const queryKey = getQueryKey(collection, query);
          data.forEach(doc => {
            universe.db[collection][doc.id] = doc;
          });

          universe.queries[queryKey] = {
            collection,
            query,
            ids: data.map(d => d.id),
          };
        });
      });
    });
  },
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
