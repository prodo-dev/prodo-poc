import React from "react";
import "./App.css";
import { useData, useActions } from "../store";

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <RoomSelector />
        <Message id="M1" />
        <Message id="M2" />
        <PostMessage />
      </header>
    </div>
  );
};

function Message({ id }: { id: string }) {
  const { db } = useData(() => <div>LOADING...</div>);
  const { likeMessage } = useActions();
  return (
    <div>
      <h2>{db.messages[id].text}</h2>
      <span>{db.messages[id].likes}</span>
      <button onClick={() => likeMessage(id)}>+1</button>
    </div>
  );
}

const RoomSelector = () => {
  const { state } = useData();
  const { setRoom } = useActions();
  return (
    <input
      type="text"
      value={state.roomId}
      onChange={e => setRoom(e.target.value)}
    />
  );
};

function PostMessage() {
  const { postMessage } = useActions();
  return (
    <input
      placeholder="say something nice"
      onKeyUp={(e: any) => {
        if (e.keyCode === 13 /* enter */) {
          postMessage(e.target.value);
          e.target.value = "";
        }
      }}
    />
  );
}

export default App;
