import React from "react";
import "./App.css";
import { useData, useActions } from "../store";
import { query } from "../@prodo/realtime-db";

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="full">
        <RoomSelector />

        <Messages />
      </div>

      <PostMessage />
    </div>
  );
};

const Messages = () => {
  const { state, db } = useData(() => <div>Loading Messages...</div>);
  const messages = query(db.messages, {
    where: [["roomId", "==", state.roomId]],
  });

  console.log("MESSAGES", messages);

  return (
    <div className="messages">
      {messages.map(m => (
        <Message key={m.id} id={m.id} />
      ))}
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
      <h2>Room</h2>
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
