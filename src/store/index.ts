import model from "./model";
import * as actions from "./actions";
import init from "./init";

export const useData = model.useData;
export const useActions = model.useActions(actions);

export default model.createStore(init);
