import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaComment, FaTimes, FaPaperPlane } from 'react-icons/fa';

export const ChatWidget = ({ role = 'user' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: `Hello! I am your ${role === 'admin' ? 'admin' : 'support'} assistant. How can I help you today?`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const toggleChat = () => setIsOpen((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const endpoint = role === 'admin' ? '/api/chat/admin' : '/api/chat/user';
      
      // Ensure backend URL is used. If proxy is set up in Vite, relative path works.
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${endpoint}`, 
        { prompt: userMessage.text },
        { 
          // Assuming your auth tokens are in localStorage
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          } 
        }
      );

      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.data.response || 'No response received.',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: 'Sorry, I encountered an error while processing your request.',
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl transition-transform hover:scale-110 z-50 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          aria-label="Open chat"
        >
          <FaComment size={24} />
        </button>
      )}

      {/* Chat Window */}
      <div
        className={`fixed z-50 flex flex-col bg-slate-900 border border-slate-700 shadow-2xl transition-all duration-300 ease-in-out
          ${
            isOpen
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-10 opacity-0 pointer-events-none'
          }
          /* Desktop */
          sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:rounded-2xl
          /* Mobile Full Screen */
          bottom-0 right-0 w-full h-full sm:h-auto rounded-none
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 sm:rounded-t-2xl">
          <div>
            <h3 className="text-white font-semibold">
              {role === 'admin' ? 'Admin Assistant' : 'Support Assistant'}
            </h3>
            <p className="text-xs text-slate-400">Powered by Genkit</p>
          </div>
          <button
            onClick={toggleChat}
            className="text-slate-400 hover:text-white transition-colors p-2"
            aria-label="Close chat"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : msg.isError
                    ? 'bg-red-900/50 border border-red-500/50 text-red-200 rounded-bl-sm'
                    : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-400 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 sm:rounded-b-2xl">
          <form onSubmit={handleSubmit} className="flex gap-2 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-900 text-white text-sm rounded-full pl-4 pr-12 py-3 border border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center"
              aria-label="Send message"
            >
              <FaPaperPlane size={14} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatWidget;
