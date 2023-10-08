import { AES, enc } from "crypto-js";
import io from "socket.io-client";
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ScrollToBottom from "react-scroll-to-bottom";

import styles from "./Chat.module.css";

const ENDPOINT = "https://secure-messenger-chat-5qsz.vercel.app/";
const socket = io.connect(ENDPOINT);

const Chat = () => {
  const navigate = useNavigate();
  const search = useLocation().search;
  const username = new URLSearchParams(search).get("username");
  const roomname = new URLSearchParams(search).get("roomname");

  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [totalUsersInRoom, setTotalUsersInRoom] = useState(0);
  const secretKey = useRef();

  const timeStamp = () => {
    return `${new Date(Date.now()).getHours()}:${new Date(
      Date.now()
    ).getMinutes()}`;
  };

  const messageHandler = async () => {
    if (currentMessage !== "") {
      console.log("SENDING ENCRYPTED MESSAGE!");
      // console.log("message:", currentMessage, "\n", "key: ", secretKey.current);
      const messageData = {
        uid: new Date().getMilliseconds(),
        message: AES.encrypt(currentMessage, secretKey.current).toString(),
        author: username,
        roomname: roomname,
        time: timeStamp(),
      };

      await socket.emit("send_message", messageData);
      setMessageList((prevList) => [
        ...prevList,
        { ...messageData, message: currentMessage },
      ]);
      setCurrentMessage("");
    }
  };

  const buttonSendMessageHandler = (event) => {
    if (event.key === "Enter") {
      messageHandler();
    }
  };

  useEffect(() => {
    if (username === null || roomname === null) {
      navigate("/");
    } else {
      // create connection
      console.log("Creating connection");
      socket.emit("join_room", { username, roomname }, () => {
        alert("Username already exists!");
        navigate("/");
      });
    }
  }, [username, roomname, navigate]);

  useEffect(() => {
    socket.on("receive_message", (data) => {
      if (data.author !== "admin") {
        console.log("DECRYPTING RECEIVED MESSAGE!");
        // console.log(
        //   "message: ",
        //   data.message,
        //   "\n",
        //   "key: ",
        //   secretKey.current
        // );
        setMessageList((prevList) => [
          ...prevList,
          {
            ...data,
            message: AES.decrypt(data.message, secretKey.current).toString(
              enc.Utf8
            ),
          },
        ]);
      } else {
        // because admin messages are not encrypted
        setMessageList((prevList) => [...prevList, data]);
      }
    });

    return () => {
      console.log("socket disconnection");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    socket.on("meta_info", (data) => {
      setTotalUsersInRoom(data.totalActiveUsers);
      console.log("ROOM INFO RECEIVED!");
      secretKey.current = data.secretKey;
    });
  }, []);

  const styleMessageContainerHandler = () => {
    if (navigator.userAgent.indexOf("Chrome") !== -1) {
      return true;
    } else {
      return false;
    }
  };

  return (
    <div className={styles.chatWrapper}>
      <div className={styles.header}>
        <p>
          {roomname} | {totalUsersInRoom} online
        </p>
        <p>{username}</p>
      </div>
      <div className={styles.body}>
        <ScrollToBottom
          className={
            styleMessageContainerHandler()
              ? styles.CmessageContainer
              : styles.FmessageContainer
          }
        >
          {messageList.map((item) => {
            return (
              <div
                key={item.uid}
                className={`${styles.messageWrapper} ${
                  username === item.author && styles.myMessageWrapper
                } ${item.author === "admin" && styles.adminMessageWrapper}`}
              >
                <div
                  className={`${styles.message} ${
                    item.author === "admin" && styles.adminMessage
                  } ${username === item.author && styles.myMessage}`}
                >
                  <div className={styles.messageContent}>
                    <p>{item.message}</p>
                  </div>
                  <div className={styles.messageMeta}>
                    {/* for author messages */}
                    {item.time && <p id="time">{item.time}</p>}
                    {item.author !== "admin" && (
                      <p id="author">{item.author}</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </ScrollToBottom>
      </div>
      <div className={styles.footer}>
        <input
          type="text"
          value={currentMessage}
          placeholder="Say it here..."
          onChange={(event) => {
            setCurrentMessage(event.target.value);
          }}
          onKeyPress={buttonSendMessageHandler}
        />
        <button onClick={messageHandler}>/Send</button>
      </div>
    </div>
  );
};

export default Chat;
