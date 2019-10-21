declare global {
  interface Window {
    _prodo: any;
    _queries: {
      [key: string]: {
        collection: string;
        query: Query;
        value?: any[];
      };
    };
  }
}

export interface Query {
  where?: [
    [string, string, any] // field, op, value
  ];
}
