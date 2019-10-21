import model from "./model";
import { setRoom, postMessage, likeMessage } from "./actions";
import { initMockDB } from "../@prodo/firebase/mock-db";

const store = model.createStore({
  state: {
    roomId: "LoL",
    message: ""
  },
  auth: {
    username: "Ted"
  },
  db: {
    messages: {
      M1: {
        roomId: "LoL",
        author: "Ted",
        emoji: "?",
        likes: 10,
        text: "hi there"
      }
    }
  }
});

async function test() {
  const { dispatch } = store;
  await dispatch(setRoom, "Dota");
  await dispatch(postMessage, "Hello There!");
  await dispatch(likeMessage, "M1");
  await dispatch(likeMessage, "M2");
}

test();
