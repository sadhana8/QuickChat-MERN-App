/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "./AuthContext";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // Ref to keep track of latest selectedUser inside socket callback
  const selectedUserRef = useRef(selectedUser);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  /** Fetch all users for sidebar */
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch users");
    }
  };

  /** Fetch messages with a specific user */
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch messages");
    }
  };

  /** Send message to selected user */
  const sendMessage = async (messageData) => {
    if (!selectedUser) return;
    try {
      const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
        socket?.emit("sendMessage", data.newMessage); // optional if using socket emit
      } else {
        toast.error(data.message || "Failed to send message");
      }
    } catch (error) {
      toast.error(error.message || "Failed to send message");
    }
  };

  /** Subscribe to incoming socket messages */
  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      const isCurrentChat = selectedUserRef.current?._id === newMessage.senderId;

      if (isCurrentChat) {
        // Mark as seen
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        try {
          await axios.put(`/api/messages/mark/${newMessage._id}`);
        } catch (err) {
          console.error("Failed to mark message as seen", err);
        }
      } else {
        // Increment unseen count
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: prev[newMessage.senderId] ? prev[newMessage.senderId] + 1 : 1,
        }));
      }
    });
  };

  /** Unsubscribe from socket */
  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  /** Handle socket subscriptions on mount & selectedUser change */
  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket]);

  /** Update unseen messages when a user is selected */
  useEffect(() => {
    if (selectedUser) {
      setUnseenMessages((prev) => ({
        ...prev,
        [selectedUser._id]: 0,
      }));
    }
  }, [selectedUser]);

  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
    unseenMessages,
    setUnseenMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
