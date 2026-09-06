'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatBotModal({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '👋 Chào em! Thầy/Cô AI học tập KHTN đây. Em đang gặp khó khăn hay chưa hiểu phần nào trong bài học, cứ thoải mái hỏi thầy/cô nhé!',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsgText = input.trim();
    setInput('');

    const newUserMessage: Message = { role: 'user', content: userMsgText };
    
    // 1. Cập nhật giao diện UI ngay lập tức với câu hỏi của học sinh
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 2. Chỉ gửi lịch sử hội thoại lên API (Backend sẽ tự xử lý lọc câu chào đầu)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.reply || 'Lỗi từ máy chủ API');
      }

      // 3. Thêm phản hồi THỰC TẾ từ AI vào danh sách tin nhắn
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
        },
      ]);
    } catch (err: any) {
      console.error('Lỗi kết nối Chatbot:', err);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: err.message || '⚠️ Lỗi kết nối mạng hoặc server AI, em bấm gửi lại giúp thầy/cô nhé!' 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[520px] bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl flex flex-col overflow-hidden font-sans z-50 text-white">
      {/* Header */}
      <div className="bg-emerald-600 p-4 flex justify-between items-center font-bold">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <h3 className="text-sm font-extrabold">Trợ Lý Học Tập KHTN</h3>
            <p className="text-[10px] text-emerald-100 font-normal">Giải đáp 24/7 chuẩn SGK KNTT</p>
          </div>
        </div>
        <button
          onClick={onClose}
          type="button"
          className="text-white hover:bg-emerald-700 p-1 rounded-full transition"
        >
          ✕
        </button>
      </div>

      {/* Body: Danh sách tin nhắn */}
      <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-800 text-sm">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl whitespace-pre-wrap leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none'
                  : 'bg-slate-700 text-slate-100 rounded-bl-none border border-slate-600'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 p-3 rounded-2xl rounded-bl-none border border-slate-600 text-slate-300 text-xs flex items-center gap-2">
              <span className="animate-spin">🌀</span> Thầy/Cô AI đang suy nghĩ câu trả lời...
            </div>
          </div>
        )}
      </div>

      {/* Footer: Input gửi tin nhắn */}
      <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          placeholder="Nhập thắc mắc của em..."
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-2xl text-sm font-bold transition"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}