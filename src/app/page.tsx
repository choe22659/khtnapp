// src/app/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Share2, Copy, Check } from "lucide-react";

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

  // Hàm tải danh sách bài giảng an toàn từ API
  // Hàm tải danh sách bài giảng an toàn (kết hợp localStorage + API dự phòng)
  const fetchLessons = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Kiểm tra và đọc bài giảng lưu trong localStorage trước
      const localData = localStorage.getItem('khtn_saved_lessons');
      let localLessons: LessonData[] = [];

      if (localData) {
        try {
          localLessons = JSON.parse(localData);
        } catch (e) {
          console.error('Lỗi parse dữ liệu localStorage:', e);
        }
      }

      // 2. Đồng thời gọi API Server để lấy bài giảng (nếu có)
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

      // 3. Gộp bài giảng từ LocalStorage và Server (loại bỏ trùng lặp theo title hoặc id)
      const combined = [...localLessons];
      serverLessons.forEach((sItem) => {
        if (!combined.some((lItem) => lItem.title === sItem.title)) {
          combined.push(sItem);
        }
      });

      setLessons(combined);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Lỗi khi tải danh sách bài giảng:', error);
        setErrorMsg('Lỗi khi tải bài giảng. Vui lòng thử lại sau.');
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
                <Link
                  href="/student"
                  className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black text-center transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>▶</span> Vào Học Ngay
                </Link>
                <Link
                  href="/student?view=practice"
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-black text-center border border-emerald-500/30 transition flex items-center justify-center gap-1.5"
                >
                  <span>🔤</span> Ôn Flashcard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* NÚT TÁC VỤ NỔI BẬT KHÁC */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/teacher?tab=simulations"
            className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800 transition flex items-center gap-4 group"
          >
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 text-2xl group-hover:scale-110 transition-transform">
              🔗
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Thêm URL / Mã Nhúng</h4>
              <p className="text-[11px] text-slate-400 font-medium">Nhúng Canva, YouTube, Quizizz</p>
            </div>
          </Link>

          <Link
            href="/teacher?tab=simulations"
            className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-purple-400 hover:bg-slate-800 transition flex items-center gap-4 group"
          >
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 text-2xl group-hover:scale-110 transition-transform">
              🧫
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Thí Nghiệm PhET</h4>
              <p className="text-[11px] text-slate-400 font-medium">Mô phỏng Lý - Hóa - Sinh</p>
            </div>
          </Link>

          <Link
            href="/teacher?tab=analytics"
            className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-yellow-400 hover:bg-slate-800 transition flex items-center gap-4 group"
          >
            <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-400 text-2xl group-hover:scale-110 transition-transform">
              📊
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">Tiến Độ Học Tập</h4>
              <p className="text-[11px] text-slate-400 font-medium">Theo dõi kết quả học sinh</p>
            </div>
          </Link>
        </section>

        {/* DANH SÁCH BÀI GIẢNG ĐÃ LƯU */}
        <section className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-extrabold text-slate-200 flex items-center gap-2">
              <span className="text-blue-400">📚</span> Danh Sách Bài Giảng KHTN Đã Lưu ({lessons.length})
            </h2>
            <button
              onClick={() => fetchLessons()}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              🔄 {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              ⚠️ {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse space-y-4">
                  <div className="h-5 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-6 bg-slate-800 rounded w-3/4"></div>
                  <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                    <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                    <div className="h-8 bg-slate-800 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : lessons.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             
{lessons.map((item, index) => (
  <div
    key={item.id ? `${item.id}-${index}` : `lesson-item-${index}`}
    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 h-..."
  >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        KHTN Lớp {item.grade}
                      </span>
                      {item.slideCount && (
                        <span className="text-[10px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-md">
                          📄 {item.slideCount} slides
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors leading-snug line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400 font-semibold">
                    <span>📅 {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</span>
                    <Link
                      href={`/student?id=${item.id}`}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold transition shadow-md flex items-center gap-1"
                    >
                      Mở Học ▶
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-800 rounded-3xl p-10 text-center bg-slate-900/40 space-y-3">
              <span className="text-4xl opacity-70" role="img" aria-label="folder">📂</span>
              <p className="text-slate-400 text-xs md:text-sm font-semibold">
                Chưa có bài giảng nào được lưu. Bấm nút <strong className="text-indigo-400">"Soạn Bài Mới Bằng AI"</strong> ở trên để khởi tạo bài giảng đầu tiên!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}