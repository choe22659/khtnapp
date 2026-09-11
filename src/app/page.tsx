'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Share2, Copy, Check, Search, Filter, BookOpen, Trash2, Calendar, Layers } from "lucide-react";

interface LessonData {
  id: string;
  title: string;
  grade: string;
  createdAt: string;
  slideCount?: number;
}

export default function HomePage() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // State hỗ trợ Lọc & Tìm kiếm
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');

  // State quản lý Modal Mã QR & Chia sẻ
  const [activeQrLesson, setActiveQrLesson] = useState<{ id: string; title: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Hàm tải danh sách bài giảng (kết hợp localStorage + API dự phòng)
  const fetchLessons = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Đọc bài giảng lưu trong localStorage
      const localData = localStorage.getItem('khtn_saved_lessons');
      let localLessons: LessonData[] = [];

      if (localData) {
        try {
          localLessons = JSON.parse(localData);
        } catch (e) {
          console.error('Lỗi parse dữ liệu localStorage:', e);
        }
      }

      // 2. Đồng thời gọi API Server để lấy bài giảng
      let serverLessons: LessonData[] = [];
      try {
        const res = await fetch('/api/lessons', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          signal,
        });

        if (res.ok) {
          const textData = await res.text();
          if (textData) {
            const data = JSON.parse(textData);
            serverLessons = data.lessons || [];
          }
        }
      } catch (apiErr) {
        console.warn('Không thể kết nối API Server, sử dụng dữ liệu LocalStorage:', apiErr);
      }

      // 3. Gộp bài giảng từ LocalStorage và Server (loại bỏ trùng lặp)
      const combined = [...localLessons];
      serverLessons.forEach((sItem) => {
        if (!combined.some((lItem) => lItem.id === sItem.id || lItem.title === sItem.title)) {
          combined.push(sItem);
        }
      });

      setLessons(combined);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Lỗi khi tải danh sách bài giảng:', error);
        setErrorMsg('Lỗi khi tải danh sách bài giảng. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchLessons(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchLessons]);

  // Xóa bài giảng khỏi LocalStorage
  const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm('Bạn có chắc chắn muốn xóa bài giảng này khỏi bộ nhớ máy?')) {
      const updated = lessons.filter((l) => l.id !== id);
      setLessons(updated);
      localStorage.setItem('khtn_saved_lessons', JSON.stringify(updated));
    }
  };

  // Lọc bài giảng theo Từ khóa & Khối lớp
  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = selectedGrade === 'ALL' || lesson.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    });
  }, [lessons, searchQuery, selectedGrade]);

  // Sao chép liên kết bài học
  const handleCopyLink = (lessonId: string) => {
    const url = `${window.location.origin}/lesson/${lessonId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans p-4 md:p-8 space-y-10">
      {/* HEADER TỔNG */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-4xl" role="img" aria-label="space">🌌</span>
            <h1 className="text-2xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 tracking-tight">
              Cổng Học Liệu Số KHTN GDPT 2018
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            Hệ thống quản lý, trình chiếu bài giảng tương tác & phòng thí nghiệm tích hợp AI
          </p>
        </div>

        {/* Nút hành động nhanh cho Giáo viên */}
        <Link
          href="/teacher"
          className="group relative inline-flex items-center justify-center gap-3 px-6 py-3.5 font-extrabold text-white text-sm rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] border border-indigo-400/30 transition-all duration-300 overflow-hidden"
        >
          <span className="text-lg animate-pulse">✨</span>
          <span>Soạn Bài Mới Bằng AI</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </header>

      <main className="max-w-7xl mx-auto space-y-10">
        {/* PHÂN CỔNG TRUY CẬP: DÀNH CHO GIÁO VIÊN & HỌC SINH */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="text-yellow-400">⚡</span> Không Gian Thao Tác Nổi Bật
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* THẺ DÀNH CHO GIÁO VIÊN */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-indigo-500/40 hover:border-indigo-400 transition-all duration-300 shadow-xl space-y-5 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-3xl font-bold group-hover:scale-110 transition-transform">
                  👩‍🏫
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Dành cho Giáo Viên
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                  Bảng Điều Khiển & Biên Soạn
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                  Tích hợp AI tạo Slide tự động, quản lý mã nhúng HTML, liên kết URL học liệu và phòng thí nghiệm ảo PhET.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  href="/teacher"
                  className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black text-center transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>✨</span> Soạn Bài AI
                </Link>
                <Link
                  href="/teacher?tab=simulations"
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-black text-center border border-cyan-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <span>🧪</span> Mã Nhúng / PhET
                </Link>
              </div>
            </div>

            {/* THẺ DÀNH CHO HỌC SINH */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 hover:border-emerald-400 transition-all duration-300 shadow-xl space-y-5 relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-3xl font-bold group-hover:scale-110 transition-transform">
                  👨‍🎓
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Dành cho Học Sinh
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  Góc Học Tập & Trình Chiếu
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-medium leading-relaxed">
                  Tham gia bài học tương tác, thực hành mô phỏng ảo, tự ôn tập với Flashcard và làm bài trắc nghiệm củng cố.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <a
                  href="#lesson-list"
                  className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black text-center transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>📖</span> Danh Sách Bài Học
                </a>
                <Link
                  href="/student/practice"
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-black text-center border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <span>🎯</span> Ôn Tập & Bài Tập
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* DANH SÁCH BÀI GIẢNG ĐÃ TẠO */}
        <section id="lesson-list" className="space-y-6 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-400" />
                Kho Bài Giảng Số Khoa Học Tự Nhiên
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Các bài giảng đã biên soạn sẵn sàng trình chiếu hoặc chia sẻ cho học sinh
              </p>
            </div>

            {/* BỘ LỌC VÀ TÌM KIẾM */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Ô tìm kiếm */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm bài giảng..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              {/* Lọc khối lớp */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 border border-slate-700 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
                {['ALL', '6', '7', '8', '9'].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setSelectedGrade(grade)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                      selectedGrade === grade
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {grade === 'ALL' ? 'Tất cả' : `Lớp ${grade}`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HIỂN THỊ DỮ LIỆU */}
          {loading ? (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
              <div className="inline-block animate-spin text-3xl">🌀</div>
              <p className="text-slate-400 text-sm font-medium">Đang tải danh sách bài giảng...</p>
            </div>
          ) : errorMsg ? (
            <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm text-center">
              {errorMsg}
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-4">
              <span className="text-5xl">📚</span>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-300">Chưa có bài giảng nào</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Hãy nhấn vào nút "Soạn Bài Mới Bằng AI" để bắt đầu tạo bài giảng tương tác đầu tiên của bạn.
                </p>
              </div>
              <Link
                href="/teacher"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition"
              >
                Tạo Bài Giảng Mới
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 space-y-4 transition duration-300 hover:shadow-xl flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {lesson.grade ? `KHTN Lớp ${lesson.grade}` : 'KHTN'}
                      </span>
                      <button
                        onClick={(e) => handleDeleteLesson(lesson.id, e)}
                        className="text-slate-600 hover:text-red-400 p-1 transition rounded-lg hover:bg-red-500/10"
                        title="Xóa bài giảng này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base line-clamp-2 group-hover:text-indigo-300 transition-colors">
                      {lesson.title}
                    </h3>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{lesson.createdAt || 'Mới cập nhật'}</span>
                      </div>
                      {lesson.slideCount && (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          <span>{lesson.slideCount} trang</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      <Link
                        href={`/lesson/${lesson.id}`}
                        className="col-span-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold text-center rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <span>▶</span> Trình Chiếu
                      </Link>
                      <button
                        onClick={() => setActiveQrLesson({ id: lesson.id, title: lesson.title })}
                        className="col-span-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition flex items-center justify-center"
                        title="Tạo mã QR / Chia sẻ"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MODAL MÃ QR & CHIA SẺ BÀI HỌC */}
      {activeQrLesson && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveQrLesson(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 pr-6">
              <h3 className="font-black text-white text-base flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                Chia Sẻ Bài Giảng
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">{activeQrLesson.title}</p>
            </div>

            {/* Mã QR */}
            <div className="bg-white p-4 rounded-2xl flex justify-center items-center shadow-inner max-w-[200px] mx-auto">
              <QRCodeSVG
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/lesson/${activeQrLesson.id}`}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-[11px] text-center text-slate-400">
              Học sinh sử dụng thiết bị di động quét mã QR trên để tham gia học trực tiếp.
            </p>

            {/* Nút Sao Chép Link */}
            <div className="space-y-2">
              <button
                onClick={() => handleCopyLink(activeQrLesson.id)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Đã Sao Chép Liên Kết!' : 'Sao Chép Đường Link'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}