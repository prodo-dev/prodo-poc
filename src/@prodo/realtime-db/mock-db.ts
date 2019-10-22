import * as immer from "immer";
import { Query } from "./types";

const DELAY = 500;

declare global {
  interface Window {
    _mockDb: any;
  }
}

export function initMockDB(data: any) {
  window._mockDb = data;
}

export async function getDoc(collection: string, doc: string) {
  const data = window._mockDb;
  await new Promise(r => setTimeout(r, DELAY));
  if (!data[collection] || !data[collection][doc])
    throw new Error(`404 - document ${collection}.${doc} not found`);
  return data[collection][doc];
}

export async function getDocs(
  collection: string,
  query: Query,
): Promise<any[]> {
  // await new Promise(r => setTimeout(r, DELAY));

  const result = applyQuery(collection, query);
  return result;
}

export async function applyPatches(patches: any) {
  window._mockDb = immer.applyPatches(window._mockDb, patches);
}

export function applyQuery(collection: string, queryVal: Query): any[] {
  const data = window._mockDb;

  const result: any = [];
  Object.keys(data[collection] || {}).forEach(key => {
    const val = { id: key, ...data[collection][key] };

    if (val && match(val, queryVal)) {
      result.push(val);
    }
  });

  return result;
}

function match(value: any, queryVal: Query): boolean {
  return (queryVal.where || []).every(([f, op, v]) => {
    if (op === "==") return value[f] === v;
    if (op === ">=") return value[f] >= v;
    if (op === "<=") return value[f] <= v;
    if (op === "!=") return value[f] !== v;
    if (op === "<") return value[f] < v;
    if (op === ">") return value[f] > v;
    return false;
  });
}
