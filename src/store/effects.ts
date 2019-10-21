import { effects } from "../@prodo/core";

function newId(): string {
  return Date.now().toString();
}

async function randomEmoji(): Promise<string> {
  const res = await fetch("https://ranmoji.herokuapp.com/emojis/api/v.1.0/");
  const data = await res.json();
  return data.emoji;
}

export default effects({ newId, randomEmoji });
