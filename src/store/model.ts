import { model } from "../@prodo/core";
import { state } from "../@prodo/state";
import { auth, db } from "../@prodo/firebase";

const plugins = { state, auth, db };

export type Data = {
  state: {
    roomId: string;
    message: string;
  };
  auth: {
    username: string;
  };
  db: {
    messages: {
      [key: string]: {
        roomId: string;
        text: string;
        author: string;
        emoji: string;
        likes: number;
      };
    };
  };
};

export default model<Data>(plugins);
