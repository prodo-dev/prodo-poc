import { Data } from "./model";
import { initMockDB } from "../@prodo/firebase/mock-db";

const init: Data = {
  state: {
    roomId: "132",
    message: ""
  },
  auth: {
    username: "Alice"
  },
  db: {
    messages: {
      M1: {
        text: "hello from M1",
        likes: 1,
        emoji: "@",
        author: "Alice",
        roomId: "132"
      }
    }
  }
};

initMockDB({
  messages: {
    ...init.db.messages,
    M2: {
      roomId: "League",
      author: "Ted",
      emoji: "&",
      likes: 10123,
      text: "hi from M2"
    }
  }
});

export default init;
