import model from "./model";
import effects from "./effects";

const { db, state, auth } = model.data;

export const setRoom = (id: string) => {
  state.roomId = id;
};

export const setMessage = (text: string) => {
  state.message = text;
};

export const likeMessage = (id: string) => {
  db.messages[id].likes++;
};

export const postMessage = (text: string) => {
  const id = effects.newId();
  const emoji = effects.randomEmoji();
  db.messages[id] = {
    text,
    author: auth.username,
    likes: 0,
    roomId: state.roomId,
    emoji,
  };
};
