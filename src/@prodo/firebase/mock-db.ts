import * as immer from "immer";

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

export async function applyPatches(patches: any) {
  window._mockDb = immer.applyPatches(window._mockDb, patches);
}

// export async function query(collection: string, Q: any) {
//   const data = window._mockDb;
//   await new Promise(r => setTimeout(r, DELAY));
//   const result: any = [];
//   Object.keys(data[collection] || {}).forEach(key => {
//     const value = data[collection][key];
//     if (match(value, Q)) result.push(key);
//   });
//   return result;
// }

function match(value: any, Q: any) {
  const [f, op, v] = Q;
  if (op === "==") return value[f] === v;
  if (op === ">=") return value[f] >= v;
  if (op === "<=") return value[f] <= v;
  if (op === "!==") return value[f] !== v;
  if (op === "<") return value[f] < v;
  if (op === ">") return value[f] > v;
}
