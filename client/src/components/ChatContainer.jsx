import React, { useRef, useEffect, useContext, useState } from 'react';
import assets from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const ChatContainer = () => {
  const { messages, selectedUser, setSelectedUser, sendMessage, getMessages } = useContext(ChatContext);
  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEndRef = useRef();
  const [input, setInput] = useState('');

  // Send text message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === '') return;
    await sendMessage({ text: input.trim() });
    setInput('');
  };

  // Send image
  const handleSendImage = async (e) => {
    const fileInput = e.target;
    const file = fileInput.files[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      fileInput.value = ''; // clear the input
    };
    reader.readAsDataURL(file);
  };

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!selectedUser) {
    return (
      <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full'>
        <img src={assets.logo_icon} className='max-w-16' alt='' />
        <p className='text-lg font-medium text-white'>Chat anytime, anywhere</p>
      </div>
    );
  }

  return (
    <div className='h-full relative overflow-hidden backdrop-blur-lg'>
      {/* Chat Header */}
      <div className='flex items-center gap-3 py-3 px-4 border-b border-stone-500'>
        <img
          src={selectedUser.profilePic || assets.avatar_icon}
          alt=''
          className='w-8 h-8 rounded-full'
        />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className='w-2 h-2 rounded-full bg-green-500'></span>
          )}
        </p>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt=''
          className='md:hidden w-7 cursor-pointer'
        />
        <img src={assets.help_icon} alt='' className='hidden md:block w-5' />
      </div>

      {/* Chat Messages */}
      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>
        {messages.map((msg, index) => {
          const isSender = msg.senderId === authUser._id;
          return (
            <div
              key={index}
              className={`flex items-end gap-2 ${
                isSender ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isSender && (
                <img
                  src={selectedUser.profilePic || assets.avatar_icon}
                  alt=''
                  className='w-7 h-7 rounded-full'
                />
              )}
              {msg.image ? (
                <img
                  src={msg.image}
                  alt='chat-img'
                  className='max-w-[230px] rounded-lg border border-gray-700 mb-2'
                />
              ) : (
                <p
                  className={`p-2 max-w-[200px] break-words rounded-lg mb-2 text-white text-sm font-light ${
                    isSender ? 'bg-voilet-500/30 rounded-br-none' : 'bg-gray-700/30 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </p>
              )}
              {isSender && (
                <img
                  src={authUser.profilePic || assets.avatar_icon}
                  alt=''
                  className='w-7 h-7 rounded-full'
                />
              )}
              <div className='text-xs text-gray-500 text-center'>
                <p>{formatMessageTime(msg.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={scrollEndRef}></div>
      </div>

      {/* Bottom Input */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-gray-900/50'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input
            type='text'
            placeholder='Send a message'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
            className='flex-1 p-3 text-sm bg-transparent border-none outline-none text-white placeholder-gray-400 rounded-lg'
          />
          <input
            type='file'
            id='image'
            accept='image/png, image/jpeg'
            hidden
            onChange={handleSendImage}
          />
          <label htmlFor='image'>
            <img src={assets.gallery_icon} alt='Upload' className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        <img
          src={assets.send_button}
          alt='Send'
          className='w-7 cursor-pointer'
          onClick={handleSendMessage}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
