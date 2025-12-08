import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToBot } from '../services/geminiService';
import { ChatMessage } from '../types';
import { ChatIcon, SendIcon, XIcon, SparklesIcon, MicIcon, WaveformIcon } from './Icons';

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1', role: 'model', text: "Namaste! I am your AI Crop Doctor. Ask me anything about plant health, remedies, or daily care.", timestamp: new Date()
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
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 btn-liquid ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-emerald-600 text-white'}`}
      >
        <ChatIcon className="w-8 h-8" />
      </button>

      <div className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-[380px] h-[80vh] sm:h-[600px] bg-white sm:rounded-3xl shadow-2xl flex flex-col z-50 transition-all duration-500 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-[120%] opacity-0'}`}>
        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white sm:rounded-t-3xl shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
               <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Crop Doctor</h3>
              <p className="text-xs text-emerald-100 opacity-90">Instant • Multilingual</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-full"><XIcon className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'}`}>
                 {msg.isThinking ? <div className="flex gap-1 h-5 items-center"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span></div> : msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-gray-100 sm:rounded-b-3xl">
          <div className="relative flex items-center gap-2">
             <button className="p-3 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors group relative">
                 <MicIcon className="w-6 h-6" />
                 {/* Fake waveform animation on hover to imply voice capability */}
                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Voice Chat</div>
             </button>
             <input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask in any language..."
              className="flex-1 py-3 px-4 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
            />
            <button onClick={handleSend} disabled={!inputValue.trim()} className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 transition-transform active:scale-95 shadow-lg">
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};