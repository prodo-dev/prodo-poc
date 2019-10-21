declare global {
  interface Window {
    _prodo: any;
  }
}

export interface Query {
  where?: Array<[string, string, any]>; // field, op, value
}
