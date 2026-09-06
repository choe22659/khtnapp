'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface Slide {
  type: 'content' | 'quiz_mcq' | 'flashcard';
  title: string;
  question?: string;
  options?: string[];
  answer?: number;
  explanation?: string;
}

interface LessonData {
  id: string;
  title: string;
  grade: string;
  slides: Slide[];
}

// 1. Component con chứa toàn bộ logic xử lý dữ liệu và dùng useSearchParams
function PrintLessonContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [lesson, setLesson] = useState<LessonData | null>(null);

  useEffect(() => {
    if (id) {
      const saved = localStorage.getItem('khtn_saved_lessons');
      if (saved) {
        try {
          const list: LessonData[] = JSON.parse(saved);
          const found = list.find((item) => item.id === id);
          if (found) setLesson(found);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [id]);

  if (!lesson) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Không tìm thấy nội dung bài giảng để in!
      </div>
    );
  }

  const mcqSlides = lesson.slides.filter((s) => s.type === 'quiz_mcq');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 print:p-0 print:bg-white text-slate-900">
      {/* Thanh công cụ khi xem trên web (Ẩn khi in) */}
      <div className="max-w-3xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Chế độ xem trước bản in
        </span>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition"
        >
          🖨️ Tiến Hành In / Lưu PDF
        </button>
      </div>

      {/* Khung nội dung tờ giấy A4 */}
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm print:shadow-none print:p-0 print:max-w-full font-serif leading-relaxed">
        {/* Tiêu đề trang in */}
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-xl font-bold uppercase tracking-wide">
            PHIẾU BÀI TẬP & ÔN TẬP KHTN LỚP {lesson.grade}
          </h1>
          <h2 className="text-base font-semibold text-slate-700 mt-1">
            Chủ đề: {lesson.title}
          </h2>
        </div>

        {/* Thông tin học sinh */}
        <div className="flex justify-between items-center text-xs mb-6 pb-2 border-b border-dashed border-slate-300">
          <div>Họ và tên học sinh: ..............................................................</div>
          <div>Lớp: .............</div>
        </div>

        {/* Phần bài tập trắc nghiệm */}
        <div className="space-y-4">
          <h3 className="font-bold text-sm uppercase text-slate-900 border-l-4 border-slate-800 pl-2">
            CÂU HỎI TRẮC NGHIỆM CỦNG CỐ
          </h3>

          {mcqSlides.length === 0 ? (
            <p className="text-xs italic text-slate-500">Chưa có câu hỏi trắc nghiệm trong bài giảng này.</p>
          ) : (
            mcqSlides.map((slide, idx) => (
              <div key={idx} className="text-xs space-y-1.5 page-break-inside-avoid">
                <p className="font-semibold text-slate-900">
                  Câu {idx + 1}: {slide.question}
                </p>
                <div className="grid grid-cols-2 gap-2 pl-4">
                  {slide.options?.map((opt, optIdx) => (
                    <div key={optIdx} className="text-slate-800">
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chân trang in */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          Tài liệu biên soạn tự động từ Trợ Lý AI Bài Giảng KHTN GDPT 2018
        </div>
      </div>
    </div>
  );
}

// 2. Component chính export mặc định được bọc trong Suspense
export default function PrintLessonPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Đang tải trang in...</div>}>
      <PrintLessonContent />
    </Suspense>
  );
}