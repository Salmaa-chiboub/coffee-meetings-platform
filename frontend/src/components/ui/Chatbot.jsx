import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { chatbotResponses, welcomeMessage } from '../../data/chatbotData';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setTimeout(() => {
        setMessages([{
          id: Date.now(),
          text: welcomeMessage.message,
          isBot: true,
          quickReplies: welcomeMessage.quickReplies,
          timestamp: new Date()
        }]);
      }, 500);
    }
  }, [isOpen, messages.length]);

  // Handle bot response with typing simulation
  const handleBotResponse = (userMessage) => {
    setIsTyping(true);

    setTimeout(() => {
      // Normalize the message for better matching
      const normalizedMessage = userMessage.toLowerCase().trim();

      // Try to find exact match first
      let response = chatbotResponses[normalizedMessage];

      // If no exact match, try partial matching
      if (!response) {
        const messageKeys = Object.keys(chatbotResponses);
        const matchedKey = messageKeys.find(key => {
          if (key === 'default' || key === 'greeting') return false;
          return normalizedMessage.includes(key) || key.includes(normalizedMessage);
        });

        if (matchedKey) {
          response = chatbotResponses[matchedKey];
        }
      }

      // Fall back to default if still no match
      if (!response) {
        response = chatbotResponses.default;
      }

      const botMessage = {
        id: Date.now(),
        text: response.message,
        isBot: true,
        quickReplies: response.quickReplies,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  // Handle user message
  const handleUserMessage = (message) => {
    const userMessage = {
      id: Date.now(),
      text: message,
      isBot: false,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    handleBotResponse(message);
  };



  // Handle special actions
  const handleSpecialAction = (action) => {
    switch (action) {
      case 'Sign up now':
      case 'S\'inscrire maintenant':
      case 'Get started':
      case 'Commencer':
        window.open('/register', '_blank');
        break;
      case 'Schedule demo':
      case 'Planifier une démo':
      case 'Yes, schedule demo':
        window.open('https://calendly.com/coffeemeet-demo', '_blank');
        break;
      case 'Contact sales':
      case 'Send email':
        window.open('mailto:sales@coffeemeet.com?subject=CoffeeMeet Inquiry', '_blank');
        break;
      case 'Schedule call':
        window.open('https://calendly.com/coffeemeet-sales', '_blank');
        break;
      default:
        handleUserMessage(action);
    }
  };



  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-96 bg-white rounded-2xl shadow-2xl border border-warmGray-200 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-peach-100 to-peach-200 rounded-t-2xl border-b border-peach-300">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8">
                <img
                  src="/logo.png"
                  alt="CoffeeMeet Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold text-warmGray-800">Assistant CoffeeMeet</h3>
                <p className="text-xs text-warmGray-600">Là pour vous aider à commencer</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-peach-300 rounded-full transition-colors duration-200"
            >
              <XMarkIcon className="w-5 h-5 text-warmGray-600" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-2xl ${
                  message.isBot 
                    ? 'bg-peach-50 text-warmGray-800 border border-peach-200' 
                    : 'bg-peach-600 text-white'
                }`}>
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  
                  {/* Quick Replies */}
                  {message.isBot && message.quickReplies && (
                    <div className="mt-3 space-y-2">
                      {message.quickReplies.map((reply, index) => (
                        <button
                          key={index}
                          onClick={() => handleSpecialAction(reply)}
                          className="block w-full text-left px-3 py-2 text-xs bg-white border border-peach-300 rounded-lg hover:bg-peach-50 transition-colors duration-200 text-warmGray-700 hover:border-peach-400"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-peach-50 border border-peach-200 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-peach-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-peach-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-peach-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Chat Bubble */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-gradient-to-br from-peach-500 to-peach-600 hover:from-peach-600 hover:to-peach-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group ${
          isOpen ? 'rotate-0' : 'hover:scale-110'
        }`}
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <div className="relative">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </button>
    </div>
  );
};

export default Chatbot;
