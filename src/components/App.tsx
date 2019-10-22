import React from "react";
import "./App.css";
import { useData, useActions } from "../store";
import { query } from "../@prodo/realtime-db";

const App: React.FC = () => {
  return (
    <div className="app">
      <div className="full">
        <header>
          <h1 className="title">Chat App</h1>
          <RoomSelector />
        </header>

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
      <span
        className="emoji"
        dangerouslySetInnerHTML={{ __html: db.messages[id].emoji }}
      />
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
  const { state } = useData();
  const { postMessage, setMessage } = useActions();

  return (
    <div className="new-chat-message">
      <form
        onSubmit={e => {
          e.preventDefault();
          postMessage(state.message);
        }}
      >
        <input
          placeholder="say something nice"
          value={state.message}
          onChange={e => setMessage(e.target.value)}
        />
        <button type="submit" disabled={state.message === ""}>
          Post
        </button>
      </form>
    </div>
  );
};

export default App;
