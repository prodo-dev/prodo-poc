import React from "react";
import "./App.css";
import { useData, useActions } from "../store";

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="full">
        <RoomSelector />

        <Message id="M1" />
        <Message id="M2" />
      </div>

      <PostMessage />
    </div>
  );
};

const Message = ({ id }: { id: string }) => {
  const { db } = useData(() => <div>LOADING...</div>);
  const { likeMessage } = useActions();

  return (
    <div className="message">
      <span className="text">{db.messages[id].text}</span>
      <button className="like-button" onClick={() => likeMessage(id)}>
        {db.messages[id].likes} <span className="heart">♥</span>
      </button>
    </div>
  );
};

const RoomSelector = () => {
  const { state } = useData();
  const { setRoom } = useActions();
  return (
    <div className="room-selector">
      <h1>Room</h1>
      <input
        type="text"
        value={state.roomId}
        onChange={e => setRoom(e.target.value)}
      />
    </div>
  );
};

const PostMessage = () => {
  const { postMessage } = useActions();

  return (
    <div className="new-chat-message">
      <input
        placeholder="say something nice"
        onKeyUp={(e: any) => {
          if (e.keyCode === 13 /* enter */) {
            postMessage(e.target.value);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
};

export default App;
