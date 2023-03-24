import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./Join.module.css";

const Join = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [roomname, setRoomname] = useState("");

  const joinRoomHandler = () => {
    if (username !== "" && roomname !== "") {
      navigate(`/chat?username=${username}&roomname=${roomname}`);
    }
  };

  return (
    <div className={styles.joinWrapper}>
      <h1>drift</h1>
      <div>
        <input
          type="text"
          placeholder="name"
          onChange={(event) => {
            console.log(event.target.value);
            setUsername(event.target.value);
          }}
        />
      </div>
      <div>
        <input
          type="text"
          placeholder="room ID"
          onChange={(event) => {
            setRoomname(event.target.value);
          }}
        />
      </div>
      <button onClick={joinRoomHandler}>Join room</button>
    </div>
  );
};

export default Join;
