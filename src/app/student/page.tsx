'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import MindmapViewer from '@/components/MindmapViewer';

// --- INTERFACES ---
export interface Slide {
  type: 'content' | 'quiz_mcq' | 'flashcard' | 'simulation' | 'embed' | 'extension';
  title: string;
  content?: string;
  question?: string;
  options?: string[];
  answer?: number | string;
  explanation?: string;
  simulationUrl?: string;
  simulationInstructions?: string;
  embedUrl?: string;
  embedHtml?: string;
  embedType?: 'url' | 'html';
  formula?: string;
  term?: string;
  definition?: string;
  extraKnowledge?: string;
}

export interface MindmapNode {
  title: string;
  children?: string[];
}

export interface LessonData {
  id: string;
  title: string;
  grade: string;
  slides: Slide[];
  mindmap?: MindmapNode[];
  simulationUrl?: string;
  curriculum?: string;
  createdAt?: string;
  teacherNote?: string;
}

interface LearningHistory {
  lessonId: string;
  score: number;
  total: number;
  date: string;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export interface SimulationItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  url?: string;
  embedUrl?: string;
  embedHtml?: string;
  embedType?: 'url' | 'html';
  description: string;
  guideSteps?: string[];
  isTeacherCreated?: boolean;
}

// Component hiển thị Khung Thí Nghiệm an toàn (Hỗ trợ cả URL và mã nhúng iFrame/HTML)
const SimulationViewer = ({ simulationUrl, html, title }: { simulationUrl?: string; html?: string; title?: string }) => {
  if (html) {
    return (
      <iframe
        srcDoc={html}
        className="w-full h-full border-0 bg-white"
        title={title || 'Mô phỏng thí nghiệm'}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }
  return (
    <iframe
      src={simulationUrl || 'about:blank'}
      className="w-full h-full border-0 bg-white"
      title={title || 'Mô phỏng thí nghiệm'}
      allowFullScreen
    />
  );
};

// --- DỮ LIỆU MÔ PHỎNG MẶC ĐỊNH HỆ THỐNG (PHET LABS) ---
const DEFAULT_SIMULATIONS: SimulationItem[] = [
  {
    id: 'sim-acid-base',
    title: 'Dung dịch Acid - Base & Độ pH',
    subject: 'Hóa học',
    grade: '8',
    url: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_all.html?locale=vi',
    embedType: 'url',
    description: 'Khám phá sự phân ly của Acid/Base, so sánh độ dẫn điện và đo độ pH dung dịch.',
    guideSteps: [
      'Nhúng giấy chỉ thị pH hoặc đầu đo điện cực vào dung dịch.',
      'Thay đổi loại chất (Acid mạnh, Acid yếu, Base mạnh, Base yếu).',
      'Quan sát mật độ các ion H3O+ và OH- trong cốc.'
    ]
  },
  {
    id: 'sim-circuit',
    title: 'Lắp ráp Mạch điện Một chiều (DC)',
    subject: 'Vật lý',
    grade: '8',
    url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html?locale=vi',
    embedType: 'url',
    description: 'Tự tay thiết kế mạch điện, đo cường độ dòng điện (Ampe kế) và hiệu điện thế (Vôn kế).',
    guideSteps: [
      'Kéo dây dẫn, pin, và bóng đèn ra thảm đấu nối.',
      'Đóng công tắc để kiểm tra độ sáng bóng đèn.',
      'Dùng Vôn kế đo điện áp giữa 2 đầu bóng đèn.'
    ]
  },
  {
    id: 'sim-density',
    title: 'Khối lượng riêng & Lực đẩy Archimedes',
    subject: 'Vật lý',
    grade: '6',
    url: 'https://phet.colorado.edu/sims/html/density/latest/density_all.html?locale=vi',
    embedUrl: 'https://phet.colorado.edu/sims/html/density/latest/density_all.html?locale=vi',
    embedType: 'url',
    description: 'Thả các vật thể chất liệu khác nhau vào nước để tìm hiểu về khối lượng riêng và sự nổi.',
    guideSteps: [
      'Chọn vật liệu (Gỗ, Băng, Thạch anh, Nhôm...).',
      'Thả vật vào bể nước và xem thể tích nước dâng lên.',
      'So sánh khối lượng riêng của vật với khối lượng riêng của nước (1 kg/L).'
    ]
  }
];

export default function StudentPage() {
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null);
  const [activeTab, setActiveTab] = useState<'study' | 'mindmap' | 'simulation' | 'lab_explorer'>('study');
  const [currentIndex, setCurrentIndex] = useState(0);

  // Thao tác làm bài
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFlashcard, setShowFlashcard] = useState(false);
  const [score, setScore] = useState(0);

  // Lịch sử & Tiến độ
  const [history, setHistory] = useState<LearningHistory[]>([]);

  // Danh sách Thí nghiệm ảo
  const [simulations, setSimulations] = useState<SimulationItem[]>(DEFAULT_SIMULATIONS);
  const [activeSim, setActiveSim] = useState<SimulationItem>(DEFAULT_SIMULATIONS[0]);
  const [labNotes, setLabNotes] = useState<string>('');

  // Chatbot AI
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Chào em! Em cần hỗ trợ gì về các bài học hay thí nghiệm mô phỏng hôm nay không? 🤖' },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Hàm tải dữ liệu bài học (Kết hợp từ Server API + LocalStorage)
  const loadTeacherData = async () => {
    let combinedLessons: LessonData[] = [];

    // 1. Tải từ Server API /api/lessons
    try {
      const res = await fetch('/api/lessons');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.lessons)) {
          combinedLessons = data.lessons;
        }
      }
    } catch (e) {
      console.error('Không thể kết nối API bài học server:', e);
    }

    // 2. Tải bài học từ LocalStorage (dự phòng)
    const savedLessons = localStorage.getItem('khtn_saved_lessons');
    if (savedLessons) {
      try {
        const localLessons = JSON.parse(savedLessons);
        if (Array.isArray(localLessons)) {
          // Trộn bài học, ưu tiên theo ID
          localLessons.forEach((localItem: LessonData) => {
            if (!combinedLessons.some((item) => item.id === localItem.id)) {
              combinedLessons.push(localItem);
            }
          });
        }
      } catch (e) {
        console.error('Lỗi tải bài học local:', e);
      }
    }

    setLessons(combinedLessons);

    // 3. Tải thí nghiệm tự làm/thêm mới của giáo viên
    const customSims = localStorage.getItem('khtn_custom_simulations') || localStorage.getItem('khtn_teacher_simulations');
    if (customSims) {
      try {
        const parsedCustomSims = JSON.parse(customSims).map((item: any) => ({
          id: item.id || `sim_${Date.now()}`,
          title: item.title,
          subject: item.subject || 'Khoa học',
          grade: item.grade || 'Mọi lớp',
          url: item.embedUrl || item.url || '',
          embedUrl: item.embedUrl || item.url || '',
          embedHtml: item.embedHtml || '',
          embedType: item.embedType || 'url',
          description: item.description || `Thí nghiệm mô phỏng do Thầy/Cô thiết lập. (${item.subject || 'KHTN'})`,
          guideSteps: item.guideSteps || ['Tương tác trực tiếp với các thiết bị và quan sát kết quả.'],
          isTeacherCreated: true,
        }));

        const combinedSims = [...parsedCustomSims, ...DEFAULT_SIMULATIONS];
        setSimulations(combinedSims);
        if (parsedCustomSims.length > 0) {
          setActiveSim(parsedCustomSims[0]);
        }
      } catch (e) {
        console.error('Lỗi tải thí nghiệm giáo viên:', e);
      }
    }

    // 4. Tải lịch sử làm bài
    const savedHistory = localStorage.getItem('khtn_student_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Lỗi tải lịch sử:', e);
      }
    }
  };

  useEffect(() => {
    loadTeacherData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'khtn_teacher_simulations' || e.key === 'khtn_custom_simulations' || e.key === 'khtn_saved_lessons') {
        loadTeacherData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    async function fetchSimulations() {
      try {
        const res = await fetch('/api/simulations');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setSimulations(data);
          }
        }
      } catch (error) {
        console.error('Lỗi tải danh sách thí nghiệm từ API:', error);
      }
    }
    fetchSimulations();
  }, []);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const handleSelectLesson = (lesson: LessonData) => {
    setSelectedLesson(lesson);
    setCurrentIndex(0);
    setScore(0);
    setActiveTab('study');
    resetState();
  };

  const resetState = () => {
    setSelectedOption(null);
    setShowAnswer(false);
    setShowFlashcard(false);
  };

  const handleNextSlide = () => {
    if (!selectedLesson) return;
    if (currentIndex < selectedLesson.slides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      resetState();
    }
  };

  const handlePrevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      resetState();
    }
  };

  const handleFinishLesson = () => {
    if (!selectedLesson) return;
    const totalMcq = selectedLesson.slides.filter((s) => s.type === 'quiz_mcq').length || 1;

    const newRecord: LearningHistory = {
      lessonId: selectedLesson.id,
      score: score,
      total: totalMcq,
      date: new Date().toLocaleDateString('vi-VN'),
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('khtn_student_history', JSON.stringify(updatedHistory));
    alert(`🎉 Em đã hoàn thành bài học! Điểm trắc nghiệm: ${score}/${totalMcq}`);
    setSelectedLesson(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');

    setChatMessages((prev) => [
      ...prev,
      { sender: 'bot', text: 'Thầy/cô AI đang phản hồi... ⏳' },
    ]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          lessonTitle: selectedLesson?.title || activeSim.title,
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: 'bot', text: data.reply || data.message || 'Thầy/cô sẵn sàng giải đáp thắc mắc của em!' },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev.slice(0, -1),
        { sender: 'bot', text: 'Kết nối gián đoạn, em thử lại sau nhé!' },
      ]);
    }
  };

  const handleExportSimulations = (singleSim?: SimulationItem) => {
    const dataToExport = singleSim ? [singleSim] : simulations;
    const filename = singleSim
      ? `thi-nghiem-${singleSim.title.toLowerCase().replace(/\s+/g, '-')}.json`
      : `danh-sach-thi-nghiem-khtn.json`;

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentSlide = selectedLesson?.slides[currentIndex];
  const totalCompleted = history.length;
  const avgAccuracy =
    history.length > 0
      ? Math.round(
          (history.reduce((acc, curr) => acc + (curr.total ? curr.score / curr.total : 0), 0) / history.length) * 100
        )
      : 0;

  const currentSimUrl =
    currentSlide?.simulationUrl ||
    currentSlide?.embedUrl ||
    selectedLesson?.simulationUrl ||
    activeSim.embedUrl ||
    activeSim.url;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-4 md:p-8 font-sans relative pb-24">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg hover:opacity-80 transition font-medium"
            >
              ← Trang chủ
            </Link>
            <h1 className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              🎓 Góc Học Tập & Phòng Thí Nghiệm
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Dashboard Tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <p className="text-xs text-slate-400 font-medium">Bài học đã hoàn thành</p>
              <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalCompleted} bài</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-xs text-slate-400 font-medium">Độ chính xác trung bình</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{avgAccuracy}%</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-sm flex items-center gap-3">
            <span className="text-3xl">🔬</span>
            <div>
              <p className="text-xs text-slate-400 font-medium">Kho thí nghiệm hiện có</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {simulations.length} mô hình
              </p>
            </div>
          </div>
        </div>

        {/* MENU CHÍNH KHI CHƯA CHỌN BÀI HỌC CỤ THỂ */}
        {!selectedLesson ? (
          <div className="space-y-6">
            <div className="flex border-b border-slate-200 dark:border-slate-700 gap-4">
              <button
                onClick={() => setActiveTab('study')}
                className={`pb-2 text-sm font-bold border-b-2 transition ${
                  activeTab === 'study'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                📚 Bài học từ Thầy/Cô ({lessons.length})
              </button>
              <button
                onClick={() => setActiveTab('lab_explorer')}
                className={`pb-2 text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'lab_explorer'
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                🧪 Kho Thí nghiệm Ảo ({simulations.length})
              </button>
            </div>

            {/* TAB 1: DANH SÁCH BÀI HỌC */}
            {activeTab === 'study' && (
              <div>
                {lessons.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                    Chưa có bài học nào được tải lên. Em hãy chuyển qua tab <strong>"Kho Thí nghiệm Ảo"</strong> để trải nghiệm nhé!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lessons.map((item, index) => (
                      <div
                        key={item.id || index}
                        onClick={() => handleSelectLesson(item)}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl cursor-pointer hover:border-emerald-500 hover:shadow-md transition space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                            KHTN Lớp {item.grade}
                          </span>
                          <span className="text-xs text-slate-400">
                            {item.slides?.length || 0} phần học
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: KHO THÍ NGHIỆM ẢO */}
            {activeTab === 'lab_explorer' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Mô phỏng tương tác trực quan & Đồng bộ trực tiếp từ Giáo viên
                  </span>
                  <button
                    onClick={() => handleExportSimulations()}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm"
                  >
                    📥 Xuất Toàn Bộ Thí Nghiệm (.JSON)
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Chọn bài thí nghiệm:
                    </h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {simulations.map((sim) => (
                        <div
                          key={sim.id}
                          onClick={() => setActiveSim(sim)}
                          className={`p-4 rounded-xl border cursor-pointer transition relative ${
                            activeSim.id === sim.id
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-900 dark:text-purple-200 shadow-sm'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-extrabold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded">
                              {sim.subject || 'Khoa học'} - Lớp {sim.grade || 'Mọi lớp'}
                            </span>

                            {sim.isTeacherCreated && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                                ⭐ Thầy/Cô giao
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-xs">{sim.title}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                            {sim.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-3 flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                              🧪 {activeSim.title}
                            </h3>
                            {activeSim.isTeacherCreated && (
                              <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-semibold">
                                Mô hình Giáo viên thiết lập
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{activeSim.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleExportSimulations(activeSim)}
                            className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg font-medium transition"
                            title="Xuất thí nghiệm này thành tệp JSON"
                          >
                            💾 Xuất tệp
                          </button>
                          {activeSim.embedUrl && (
                            <a
                              href={activeSim.embedUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:opacity-80 font-medium whitespace-nowrap"
                            >
                              Toàn màn hình ↗
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="w-full h-[460px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
                        <SimulationViewer
                          simulationUrl={activeSim.embedUrl || activeSim.url}
                          html={activeSim.embedHtml}
                          title={activeSim.title}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        <div className="bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-xl border border-purple-100 dark:border-purple-900/50 space-y-1.5">
                          <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                            🎯 Nhiệm vụ thực hành:
                          </h4>
                          {activeSim.guideSteps && activeSim.guideSteps.length > 0 ? (
                            <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                              {activeSim.guideSteps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-500 italic">
                              Hãy tự do tương tác với các thiết bị và thành phần trong mô phỏng trên.
                            </p>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                            📝 Sổ tay kết quả quan sát:
                          </label>
                          <textarea
                            value={labNotes}
                            onChange={(e) => setLabNotes(e.target.value)}
                            placeholder="Ghi lại hiện tượng em quan sát được từ thí nghiệm tại đây..."
                            className="w-full h-24 p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 resize-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NỘI DUNG CHI TIẾT BÀI HỌC */
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                onClick={() => setSelectedLesson(null)}
                className="text-xs text-slate-500 hover:underline font-medium"
              >
                ← Chọn bài khác
              </button>

              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button
                  onClick={() => setActiveTab('study')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'study'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  📝 Nội dung & Bài tập
                </button>
                <button
                  onClick={() => setActiveTab('simulation')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'simulation'
                      ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  🧪 Thí nghiệm ảo
                </button>
                <button
                  onClick={() => setActiveTab('mindmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeTab === 'mindmap'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500'
                  }`}
                >
                  🧠 Sơ đồ tư duy
                </button>
              </div>

              <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full">
                {currentIndex + 1} / {selectedLesson.slides.length}
              </span>
            </div>

            {/* SLIDE BÀI HỌC */}
            {activeTab === 'study' && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 min-h-[340px] shadow-sm flex flex-col justify-between space-y-6">
                {currentSlide?.type === 'content' && (
                  <div className="space-y-4">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md">
                      📖 Lý thuyết
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                      {currentSlide.title}
                    </h3>
                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {currentSlide.content}
                    </div>
                  </div>
                )}

                {(currentSlide?.type === 'simulation' || currentSlide?.type === 'embed') && (
                  <div className="space-y-4">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-md">
                      🧪 Thí nghiệm trực quan
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                      {currentSlide.title}
                    </h3>
                    {currentSlide.simulationInstructions && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900">
                        📌 <strong>Hướng dẫn:</strong> {currentSlide.simulationInstructions}
                      </p>
                    )}
                    <div className="w-full h-[450px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner bg-black">
                      <SimulationViewer
                        simulationUrl={currentSlide?.embedUrl || currentSlide?.simulationUrl || currentSimUrl || undefined}
                        html={currentSlide?.embedHtml}
                        title={selectedLesson?.title}
                      />
                    </div>
                  </div>
                )}

                {currentSlide?.type === 'extension' && (
                  <div className="bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 p-5 rounded-2xl space-y-3">
                    <span className="text-xs font-bold bg-purple-600 text-white px-3 py-1 rounded-full uppercase">
                      Nâng cao & STEM
                    </span>
                    <div className="text-slate-800 dark:text-slate-200 font-medium text-sm whitespace-pre-line leading-relaxed">
                      {currentSlide.extraKnowledge}
                    </div>
                  </div>
                )}

                {currentSlide?.type === 'quiz_mcq' && (
                  <div className="space-y-4">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-md">
                      ❓ Câu hỏi ôn tập
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                      {currentSlide.question || currentSlide.title}
                    </h3>
                    <div className="space-y-2">
                      {currentSlide.options?.map((opt, idx) => {
                        const targetAns = Number(currentSlide.answer);
                        let btnStyle =
                          'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200';

                        if (showAnswer) {
                          if (idx === targetAns) {
                            btnStyle =
                              'bg-green-100 dark:bg-green-950 border-green-500 text-green-800 dark:text-green-300 font-bold';
                          } else if (idx === selectedOption) {
                            btnStyle =
                              'bg-red-100 dark:bg-red-950 border-red-500 text-red-800 dark:text-red-300';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            disabled={showAnswer}
                            onClick={() => {
                              setSelectedOption(idx);
                              setShowAnswer(true);
                              if (idx === targetAns) setScore((s) => s + 1);
                            }}
                            className={`w-full text-left p-3 rounded-xl border text-xs transition ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {showAnswer && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-900 dark:text-blue-200">
                        💡 <strong>Giải thích:</strong>{' '}
                        {currentSlide.explanation || 'Hãy đọc lại nội dung bài học để nắm chắc kiến thức.'}
                      </div>
                    )}
                  </div>
                )}

                {currentSlide?.type === 'flashcard' && (
                  <div className="flex flex-col items-center justify-center space-y-4 my-auto text-center min-h-[220px]">
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-md">
                      🎴 Flashcard Kiến thức
                    </span>
                    <div
                      onClick={() => setShowFlashcard(!showFlashcard)}
                      className="w-full max-w-md p-8 border-2 border-purple-200 dark:border-purple-800 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 cursor-pointer hover:shadow-md transition flex flex-col items-center justify-center min-h-[160px]"
                    >
                      {!showFlashcard ? (
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-base">
                          {currentSlide.term || currentSlide.title || currentSlide.question}
                        </p>
                      ) : (
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                          {currentSlide.definition || currentSlide.content || currentSlide.explanation}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-4">
                        (Bấm để {showFlashcard ? 'quay lại câu hỏi' : 'xem câu trả lời'})
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={handlePrevSlide}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                  >
                    ← Trang trước
                  </button>

                  {currentIndex === selectedLesson.slides.length - 1 ? (
                    <button
                      onClick={handleFinishLesson}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                    >
                      🏁 Hoàn thành
                    </button>
                  ) : (
                    <button
                      onClick={handleNextSlide}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition"
                    >
                      Trang sau →
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'simulation' && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 min-h-[500px] shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    🧪 Thí nghiệm mô phỏng gắn kèm bài học
                  </h3>
                  {currentSimUrl && (
                    <a
                      href={currentSimUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-purple-600 dark:text-purple-400 underline hover:opacity-80"
                    >
                      Mở toàn màn hình ↗
                    </a>
                  )}
                </div>
                <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-md">
                  <SimulationViewer
                    simulationUrl={currentSlide?.embedUrl || currentSlide?.simulationUrl || currentSimUrl || undefined}
                    html={currentSlide?.embedHtml}
                    title={selectedLesson?.title}
                  />
                </div>
              </div>
            )}

            {activeTab === 'mindmap' && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 min-h-[340px] shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                  🧠 Sơ đồ tư duy
                </h3>
                {!selectedLesson.mindmap || (Array.isArray(selectedLesson.mindmap) && selectedLesson.mindmap.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Chưa có sơ đồ tư duy cho bài học này.</p>
                ) : Array.isArray(selectedLesson.mindmap) ? (
                  <div className="space-y-4">
                    {selectedLesson.mindmap.map((node, i) => (
                      <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50">
                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mb-2">
                          📌 {node.title}
                        </h4>
                        {node.children && node.children.length > 0 && (
                          <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300 pl-2">
                            {node.children.map((child, j) => (
                              <li key={j}>{child}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full h-[400px] border rounded-xl overflow-hidden">
                    <MindmapViewer data={selectedLesson.mindmap} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen ? (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-lg transition flex items-center gap-2 text-xs font-bold"
          >
            💬 Trợ lý AI
          </button>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-80 sm:w-96 flex flex-col h-[420px] overflow-hidden">
            <div className="bg-emerald-600 text-white p-3.5 flex justify-between items-center font-bold text-xs">
              <span>🤖 Trợ lý KHTN</span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="hover:opacity-80 text-base leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-2.5 rounded-xl leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-br-none'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <input
                type="text"
                placeholder="Hỏi về bài học hay thí nghiệm..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-semibold transition"
              >
                Gửi
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}