import model from "../store/model";
import { setRoom, postMessage, likeMessage } from "../store/actions";

it("makes sense", async () => {
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
  const { dispatch } = store;
  await dispatch(setRoom, "Dota");
  await dispatch(postMessage, "Hello There!");
  await dispatch(likeMessage, "M1");
  await dispatch(likeMessage, "M2");
  expect(store.universe).toEqual({});
});
