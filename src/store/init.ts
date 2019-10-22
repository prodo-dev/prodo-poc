import { Data } from "./model";
import { initMockDB } from "../@prodo/realtime-db/mock-db";

const init: Data = {
  state: {
    roomId: "typescript",
    message: "",
  },
  auth: {
    username: "Alice",
  },
  db: {
    messages: {
      M1: {
        text: "Hello",
        likes: 0,
        emoji: "😃",
        author: "Alice",
        roomId: "typescript",
      },
      M2: {
        text: "How are you",
        likes: 1,
        emoji: "👾",
        author: "Ted",
        roomId: "typescript",
      },
    },
  },
};

initMockDB({
  messages: {
    ...init.db.messages,
  },
});

export default init;
