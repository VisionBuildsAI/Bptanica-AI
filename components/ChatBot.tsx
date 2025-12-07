import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToBot } from '../services/geminiService';
import { ChatMessage } from '../types';
import { ChatIcon, SendIcon, XIcon, SparklesIcon, PhoneIcon } from './Icons';

const CHAT_STORAGE_KEY = 'botanica_chat_history';

interface ChatBotProps {
  onStartLive: () => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ onStartLive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Load from local storage on mount
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const saved = localStorage.getItem(CHAT_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(hydrated);
      } catch (e) {
        console.error("Failed to parse chat history", e);
        setDefaultMessage();
      }
    } else {
      setDefaultMessage();
    }
  }, []);

  const setDefaultMessage = () => {
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm Sprout 🌿. Ask me anything about your garden, plant diseases, or how to grow new plants!",
      timestamp: new Date()
    }]);
  };

  // Save to local storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMsgId,
      role: 'model',
      text: '',
      timestamp: new Date(),
      isThinking: true
    }]);

    try {
      let fullText = '';
      const stream = sendMessageToBot(userMsg.text);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === modelMsgId 
            ? { ...msg, text: fullText, isThinking: false } 
            : msg
        ));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === modelMsgId 
          ? { ...msg, text: "I'm having trouble connecting to the garden network right now. Please try again.", isThinking: false } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple Markdown-like renderer for line breaks and bold
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
          part.startsWith('**') && part.endsWith('**') ? 
          <strong key={j} className="text-emerald-700">{part.slice(2, -2)}</strong> : 
          part
        )}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-emerald-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-emerald-600 text-white'}`}
        aria-label="Open Chat"
      >
        <ChatIcon className="w-8 h-8" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[400px] h-full sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl flex flex-col z-50 transition-all duration-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-emerald-600 text-white sm:rounded-t-2xl">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg">Sprout AI</h3>
              <p className="text-xs text-emerald-100">Gardening Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onStartLive}
              className="p-2 bg-emerald-500 hover:bg-emerald-400 rounded-full transition-colors flex items-center gap-1 pr-3"
              title="Call Live Expert"
            >
              <PhoneIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Live</span>
            </button>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close Chat"
            >
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-emerald-600 text-white rounded-br-none' 
                    : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none'
                }`}
              >
                {msg.isThinking ? (
                  <div className="flex gap-1 h-5 items-center px-1">
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                ) : (
                  renderText(msg.text)
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-stone-100 sm:rounded-b-2xl">
          <div className="relative">
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about plants..."
              className="w-full pl-4 pr-12 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-stone-700"
              rows={1}
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !inputValue.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-emerald-600 hover:text-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
