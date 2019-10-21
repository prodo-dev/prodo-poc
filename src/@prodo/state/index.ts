export const state: any = {
  init(store: any, config: any) {
    store.universe.state = config.state;
  },
  dataProxy: {
    get(field: string) {
      // @ts-ignore
      return window._prodo.universe.state[field];
    },
    set(field: string, value: any) {
      // @ts-ignore
      return Reflect.set(window._prodo.universe.state, field, value);
    }
  }
};
