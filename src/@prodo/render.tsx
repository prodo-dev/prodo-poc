import * as React from "react";
import * as ReactDOM from "react-dom";

const connectedComps = new WeakMap();
export function autoconnect(_React: any) {
  const createElement = _React.createElement;
  _React.createElement = (func: any, ...args: any) => {
    if (!func.name) {
      return createElement(func, ...args);
    }
    if (connectedComps.has(func)) {
      return createElement(connectedComps.get(func), ...args);
    } else {
      console.log("auto-connect: " + func.name);
      connectedComps.set(func, connect(func));
      return createElement(connectedComps.get(func), ...args);
    }
  };
}

const StoreContext = React.createContext(null);
let elemOrder = 0;
let elemCnts: any = {};

function connect(Func: any) {
  return class Connected extends React.Component {
    static contextType = StoreContext;
    id: string;
    order: number;
    rerender: Function;
    eventCnt: number;
    prevRendering: any;

    constructor(props: any) {
      super(props);
      if (!elemCnts[Func.name]) elemCnts[Func.name] = 0;
      this.id = `${Func.name}(${elemCnts[Func.name]++})`;
      this.order = elemOrder++;
      if (this.order > 1000) throw new Error("TOO MANY");
      this.rerender = () => {
        this.setState({ _: Math.random() });
      };
      this.eventCnt = 0;
    }
    componentWillUnmount() {
      delete this.context.components[this.id];
    }
    render() {
      const store = this.context;
      this.prevRendering = window._prodo.rendering;
      window._prodo.rendering = {
        store,
        id: this.id,
        watching: {},
      };
      let element;
      try {
        element = Func(this.props);
      } catch (e) {
        const { handler } = window._prodo.rendering;
        if (handler) {
          element = handler(e);
        } else {
          console.warn(
            `ERROR WHILE RENDERING ${this.id}`,
            this.props,
            e.message,
          );
          throw e;
        }
      }
      const watching = window._prodo.rendering.watching;
      this.context.components[this.id] = {
        id: this.id,
        order: this.order,
        rerender: this.rerender,
        watching,
      };
      window._prodo.rendering = this.prevRendering;
      return element;
    }
  };
}

function render(_React: any, App: any, store: any) {
  autoconnect(_React);
  // @ts-ignore
  window._store = store; // for debugging
  ReactDOM.render(
    <StoreContext.Provider value={store}>
      <App />
    </StoreContext.Provider>,
    document.getElementById("root"),
  );
}

export default render;
