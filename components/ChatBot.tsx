import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToBot } from '../services/geminiService';
import { ChatMessage } from '../types';
import { ChatIcon, SendIcon, XIcon, SparklesIcon, MicIcon } from './Icons';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1', role: 'model', text: "Namaste! I am your AI Crop Doctor. Ask me anything about plant health.", timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', text: '', timestamp: new Date(), isThinking: true }]);

    try {
      let fullText = '';
      const stream = sendMessageToBot(userMsg.text);
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: fullText, isThinking: false } : m));
      }
    } catch {
       setMessages(prev => prev.map(m => m.id === modelMsgId ? { ...m, text: "Network error. Try again.", isThinking: false } : m));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 btn-liquid ${isOpen ? 'scale-0 opacity-0 translate-y-10' : 'scale-100 opacity-100 bg-emerald-600 text-white shadow-emerald-500/30'}`}
      >
        <ChatIcon className="w-7 h-7" />
      </button>

      <div className={`fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[400px] h-[600px] max-h-[80vh] bg-white rounded-[2rem] shadow-2xl flex flex-col z-50 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none translate-y-10'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 bg-white rounded-t-[2rem] border-b border-gray-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
               <SparklesIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Crop Doctor</h3>
              <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs text-slate-400 font-medium">Online</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 transition-colors"><XIcon className="w-6 h-6" /></button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-slate-600 border border-gray-100 rounded-bl-none'}`}>
                 {msg.isThinking ? (
                    <div className="flex gap-1.5 h-6 items-center px-1">
                        <span className="w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce delay-200"></span>
                    </div>
                 ) : msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white rounded-b-[2rem]">
          <div className="relative flex items-center gap-2 bg-slate-100 rounded-full p-2 pr-2">
             <button className="p-3 text-slate-400 hover:text-emerald-500 hover:bg-white rounded-full transition-all shadow-sm">
                 <MicIcon className="w-5 h-5" />
             </button>
             <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400 font-medium"
            />
            <button 
                onClick={handleSend} 
                disabled={!inputValue.trim()} 
                className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-lg shadow-emerald-500/20 active:scale-90"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};