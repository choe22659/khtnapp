'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Printer, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, XCircle, HelpCircle, Eye } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

function MathView({ math, block = false }: { math: string; block?: boolean }) {
  try {
    return block ? <BlockMath math={math} /> : <InlineMath math={math} />;
  } catch (e) {
    return <span>{math}</span>;
  }
}

export function RenderTextWithMath({ text }: { text: string }) {
  if (!text) return null;
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <span className="whitespace-pre-line block">
      {parts.map((part, index) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          return <MathView key={index} math={part.slice(1, -1)} block={false} />;
        }
        const subParts = part.split(/(\*\*[^*]+\*\*)/g);
        return subParts.map((subPart, subIndex) => {
          if (subPart.startsWith('**') && subPart.endsWith('**')) {
            return (
              <strong key={subIndex} className="text-amber-300 font-semibold">
                {subPart.slice(2, -2)}
              </strong>
            );
          }
          return subPart;
        });
      })}
    </span>
  );
}

function PresentContent() {
  const searchParams = useSearchParams();
  const lessonFile = searchParams.get('lesson') || 'base-khtn8.json';

  const [lesson, setLesson] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // State quản lý tương tác
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);

  useEffect(() => {
    async function loadLesson() {
      try {
        const res = await fetch(`/lessons/${lessonFile}`);
        if (res.ok) {
          const data = await res.json();
          setLesson(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải bài giảng:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [lessonFile]);

  // Reset trạng thái tương tác mỗi khi chuyển Slide
  useEffect(() => {
    setSelectedOption(null);
    setShowFlashcardAnswer(false);
  }, [currentIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-lg animate-pulse">Đang tải bài giảng...</p>
      </div>
    );
  }

  if (!lesson || !lesson.slides || lesson.slides.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg font-semibold">Không tìm thấy bài giảng!</p>
        <Link href="/" className="text-blue-400 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const currentSlide = lesson.slides[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-10 select-none">
      {/* Header trình chiếu */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            title="Trở về Trang chủ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-blue-400">{lesson.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/print?lesson=${lessonFile}`}
            target="_blank"
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
          >
            <Printer className="w-4 h-4" /> In / PDF
          </Link>

          <span className="text-sm font-semibold bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-slate-300">
            Slide {currentIndex + 1} / {lesson.slides.length}
          </span>
        </div>
      </div>

      {/* Nội dung Slide */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-blue-300 mb-6 border-l-4 border-blue-500 pl-4">
          {currentSlide.title}
        </h2>

        {/* 1. Dạng Nội dung kiến thức */}
        {currentSlide.type === 'content' && (
          <div className="space-y-6 text-lg md:text-xl leading-relaxed text-slate-200">
            <RenderTextWithMath text={currentSlide.content} />

            {currentSlide.formula && (
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl my-4 text-emerald-400 text-center">
                <MathView math={currentSlide.formula} block={true} />
              </div>
            )}

            {currentSlide.note && (
              <div className="p-4 bg-amber-950/30 border-l-4 border-amber-500 text-amber-200 text-base rounded-r-xl">
                <RenderTextWithMath text={currentSlide.note} />
              </div>
            )}
          </div>
        )}

        {/* 2. Dạng Trắc nghiệm MCQ TƯƠNG TÁC */}
        {currentSlide.type === 'quiz_mcq' && (
          <div className="space-y-6">
            <p className="text-xl font-semibold text-slate-200">
              <RenderTextWithMath text={currentSlide.question} />
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentSlide.options?.map((opt: string, idx: number) => {
                const isSelected = selectedOption === idx;
                const isCorrect = currentSlide.answer !== undefined ? idx === currentSlide.answer : false;

                let cardStyle = "bg-slate-900 border-slate-800 text-slate-200 hover:border-blue-500";
                
                if (selectedOption !== null) {
                  if (isSelected) {
                    cardStyle = isCorrect
                      ? "bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-lg shadow-emerald-900/30"
                      : "bg-rose-950/80 border-rose-500 text-rose-200 shadow-lg shadow-rose-900/30";
                  } else if (isCorrect) {
                    cardStyle = "bg-emerald-950/40 border-emerald-600/60 text-emerald-300";
                  } else {
                    cardStyle = "bg-slate-900/50 border-slate-800/50 text-slate-500 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedOption(idx)}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 text-base font-medium cursor-pointer ${cardStyle}`}
                  >
                    <div className="flex-1">
                      <RenderTextWithMath text={opt} />
                    </div>

                    {selectedOption !== null && isSelected && (
                      <div>
                        {isCorrect ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Phản hồi kết quả & Giải thích */}
            {selectedOption !== null && (
              <div className="mt-6 p-4 rounded-xl border animate-fade-in bg-slate-900 border-slate-800">
                {currentSlide.answer !== undefined && selectedOption === currentSlide.answer ? (
                  <p className="text-emerald-400 font-bold flex items-center gap-2 text-lg">
                    🎉 Chính xác!
                  </p>
                ) : (
                  <p className="text-rose-400 font-bold flex items-center gap-2 text-lg">
                    ❌ Chưa chính xác, hãy kiểm tra lại nhé!
                  </p>
                )}

                {currentSlide.explanation && (
                  <div className="mt-2 text-slate-300 text-sm border-t border-slate-800 pt-2">
                    <span className="font-semibold text-amber-400">💡 Giải thích: </span>
                    <RenderTextWithMath text={currentSlide.explanation} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Dạng Flashcard / Vận dụng TƯƠNG TÁC */}
        {currentSlide.type === 'flashcard' && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" /> Câu hỏi thảo luận:
              </h3>
              <p className="text-xl text-slate-200">
                <RenderTextWithMath text={currentSlide.question} />
              </p>
            </div>

            <hr className="border-slate-800" />

            <div>
              {!showFlashcardAnswer ? (
                <button
                  onClick={() => setShowFlashcardAnswer(true)}
                  className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-xl font-semibold transition flex items-center gap-2 text-sm"
                >
                  <Eye className="w-4 h-4" /> Xem gợi ý đáp án
                </button>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <h3 className="text-lg font-bold text-emerald-400">💡 Gợi ý trả lời:</h3>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-lg text-slate-300">
                    <RenderTextWithMath text={currentSlide.answer} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Điều khiển Slide */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-4">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
          className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl font-semibold transition flex items-center gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" /> Trang trước
        </button>

        <button
          onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, lesson.slides.length - 1))}
          disabled={currentIndex === lesson.slides.length - 1}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl font-semibold transition flex items-center gap-1 cursor-pointer"
        >
          Trang sau <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default function PresentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">Đang khởi tạo trình chiếu...</div>}>
      <PresentContent />
    </Suspense>
  );
}