import render from "./@prodo/render";
import React from "react";
import App from "./components/App";
import initStore from "./store";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

render(React, App, initStore);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
