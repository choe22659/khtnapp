'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { InlineMath, BlockMath } from 'react-katex';
import { QRCodeSVG } from 'qrcode.react';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- THƯ VIỆN BỔ SUNG CHO SƠ ĐỒ TƯ DUY ---
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- INTERFACES ---
interface Slide {
  id?: string;
  type?: 'content' | 'quiz_mcq' | 'flashcard' | 'embed' | 'extension' | 'theory' | 'experiment' | 'exercise' | 'discussion' | 'mindmap';
  title?: string;
  content?: string;
  formula?: string;
  term?: string;
  definition?: string;
  question?: string;
  options?: string[];
  answer?: number;
  explanation?: string;
  embedUrl?: string;
  embedHtml?: string;
  embedType?: 'url' | 'html';
  extraKnowledge?: string;
  boxContent?: string;
  interactiveContent?: string;
  example?: string;
  note?: string;
  simulationUrl?: string;
}

interface MindmapNode {
  id: string;
  data: { label: string };
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

interface MindmapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

interface LessonData {
  id: string;
  title: string;
  grade: string;
  curriculum: string;
  createdAt: string;
  teacherNote?: string;
  studentLevel?: string;
  yccd?: string;
  unit?: string;
  objectives?: string[];
  slides: Slide[];
  mindmap?: MindmapData;
}

interface CustomSimulation {
  id: string;
  title: string;
  subject: string;
  embedUrl?: string;
  embedHtml?: string;
  embedType: 'url' | 'html';
  createdAt: string;
}

// --- BỘ XỬ LÝ & COMPONENT RENDER CÔNG THỨC TOÁN / HÓA HỌC / KHTN ---
const MathRenderer = ({ mathText, isBlock = false }: { mathText?: string; isBlock?: boolean }) => {
  if (!mathText) return null;

  const cleanMath = mathText.trim();

  const canRenderKaTeX = (str: string) => {
    return /[\\^{}_]|(?:\b[A-Z][a-z]?\d*)/.test(str);
  };

  try {
    if (canRenderKaTeX(cleanMath)) {
      if (isBlock) {
        return <BlockMath math={cleanMath} />;
      }
      return <InlineMath math={cleanMath} />;
    }
  } catch (err) {
    console.warn('Lỗi Render KaTeX, chuyển về hiển thị văn bản an toàn:', err);
  }

  return (
    <span className="font-mono bg-slate-100 text-blue-900 px-2 py-0.5 rounded text-sm font-semibold border border-slate-200 inline-block my-0.5">
      {cleanMath}
    </span>
  );
};

// --- COMPONENT CHỈNH SỬA & TẠO SƠ ĐỒ TƯ DUY (MINDMAP EDITOR) ---
const defaultInitialNodes: Node[] = [
  {
    id: 'root',
    data: { label: '🧠 Chủ đề bài học' },
    position: { x: 250, y: 150 },
    style: {
      background: '#2563eb',
      color: '#ffffff',
      fontWeight: 'bold',
      borderRadius: '12px',
      padding: '10px 18px',
      border: '2px solid #3b82f6',
    },
  },
];

function MindmapEditor({
  initialData,
  onSave,
  readOnly = false,
}: {
  initialData?: MindmapData;
  onSave?: (data: MindmapData) => void;
  readOnly?: boolean;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (initialData?.nodes as Node[]) || defaultInitialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (initialData?.edges as Edge[]) || []
  );

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeLabel, setNodeLabel] = useState<string>('');

  useEffect(() => {
    if (initialData?.nodes && initialData.nodes.length > 0) {
      setNodes(initialData.nodes as Node[]);
    }
    if (initialData?.edges) {
      setEdges(initialData.edges as Edge[]);
    }
  }, [initialData, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    if (readOnly) return;
    setSelectedNode(node);
    setNodeLabel((node.data?.label as string) || '');
  };

  const handleUpdateLabel = () => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: { ...node.data, label: nodeLabel },
          };
        }
        return node;
      })
    );
  };

  const handleAddChildNode = () => {
    const parent = selectedNode || nodes[0];
    if (!parent) return;

    const newId = `node_${Date.now()}`;
    const newNode: Node = {
      id: newId,
      data: { label: 'Ý tưởng mới' },
      position: {
        x: parent.position.x + 180,
        y: parent.position.y + (Math.random() * 100 - 50),
      },
      style: {
        background: '#ffffff',
        color: '#0f172a',
        border: '2px solid #3b82f6',
        borderRadius: '10px',
        padding: '8px 14px',
        fontWeight: '600',
      },
    };

    const newEdge: Edge = {
      id: `e_${parent.id}_${newId}`,
      source: parent.id,
      target: newId,
      animated: true,
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
  };

  const handleDeleteNode = () => {
    if (!selectedNode || selectedNode.id === 'root') return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    setNodeLabel('');
  };

  const handleSave = () => {
    const exportData: MindmapData = {
      nodes: nodes as unknown as MindmapNode[],
      edges: edges as unknown as MindmapEdge[],
    };
    if (onSave) {
      onSave(exportData);
    }
  };

  return (
    <div className="w-full flex flex-col rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm my-2">
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddChildNode}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition shadow-sm"
            >
              ➕ Thêm nhánh mới
            </button>

            {selectedNode && selectedNode.id !== 'root' && (
              <button
                type="button"
                onClick={handleDeleteNode}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl transition shadow-sm"
              >
                🗑️ Xóa nhánh
              </button>
            )}
          </div>

          {selectedNode && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nodeLabel}
                onChange={(e) => setNodeLabel(e.target.value)}
                placeholder="Nội dung nút..."
                className="px-3 py-1 text-xs bg-white border border-slate-300 text-slate-800 rounded-lg focus:outline-none focus:border-blue-600 font-bold"
              />
              <button
                type="button"
                onClick={handleUpdateLabel}
                className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-xs text-white rounded-lg font-bold"
              >
                Cập nhật
              </button>
            </div>
          )}

          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition"
            >
              💾 Lưu sơ đồ
            </button>
          )}
        </div>
      )}

      <div className="w-full h-[400px] bg-slate-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onNodeClick={onNodeClick}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          fitView
        >
          <Background color="#cbd5e1" variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls className="bg-white border-slate-200 fill-slate-700" />
          <MiniMap
            style={{ backgroundColor: '#f8fafc', borderRadius: '12px' }}
            nodeColor="#3b82f6"
            maskColor="rgba(241, 245, 249, 0.7)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---
const SimulationViewer = ({ url, html, title }: { url?: string; html?: string; title?: string }) => {
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
      src={url}
      className="w-full h-full border-0 bg-white"
      title={title || 'Mô phỏng thí nghiệm'}
      allowFullScreen
    />
  );
};

export default function TeacherPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passError, setPassError] = useState(false);

  // Form states
  const [topic, setTopic] = useState('');
  const [bookSeries, setBookSeries] = useState('Chân trời sáng tạo');
  const [grade, setGrade] = useState('7');
  const [studentLevel, setStudentLevel] = useState('Khá giỏi / Ôn thi HSG');
  const [yccd, setYccd] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [selectedPresetSim, setSelectedPresetSim] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'editor' | 'simulations' | 'analytics'>('editor');
  const [savedLessons, setSavedLessons] = useState<LessonData[]>([]);
  const [lesson, setLesson] = useState<LessonData | null>(null);

  const [customSims, setCustomSims] = useState<CustomSimulation[]>([]);
  const [simTitle, setSimTitle] = useState('');
  const [simSubject, setSimSubject] = useState('Vật Lý');
  const [simCode, setSimCode] = useState('');

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // --- LỚP CHUẨN HÓA DỮ LIỆU TỔNG QUÁT ---
  const normalizedSlides = useMemo(() => {
    if (!lesson || !Array.isArray(lesson.slides)) return [];

    return lesson.slides.map((slide, index) => {
      const title = slide.title || `Slide ${index + 1}`;
      const content = slide.content || slide.extraKnowledge || slide.definition || "";

      const rawExtra = 
        slide.boxContent ?? 
        slide.interactiveContent ?? 
        slide.example ?? 
        slide.note ?? 
        slide.term ??
        "";

      let boxContent = "";
      if (typeof rawExtra === 'string') {
        boxContent = rawExtra;
      } else if (rawExtra && typeof rawExtra === 'object') {
        boxContent = JSON.stringify(rawExtra);
      }

      return {
        ...slide,
        id: slide.id || `slide_${index + 1}`,
        title,
        content,
        formula: slide.formula || '',
        boxContent: boxContent.trim(),
      };
    });
  }, [lesson]);

  const currentSlide = normalizedSlides[currentSlideIndex] || {};

  // Hàm tải dữ liệu
  const fetchLessonsSafely = async () => {
    try {
      let localLessons: LessonData[] = [];
      const localData = localStorage.getItem('khtn_saved_lessons');
      if (localData) {
        localLessons = JSON.parse(localData);
      }

      let serverLessons: LessonData[] = [];
      const response = await fetch('/api/lessons', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        serverLessons = Array.isArray(data.lessons) ? data.lessons : [];
      }

      const combined = [...localLessons];
      serverLessons.forEach((serverLesson) => {
        if (!combined.some((savedLesson) => savedLesson.id === serverLesson.id)) {
          combined.push(serverLesson);
        }
      });

      if (combined.length > 0) {
        setSavedLessons(combined);
        setLesson((currentLesson) => currentLesson || combined[0]);
        localStorage.setItem('khtn_saved_lessons', JSON.stringify(combined));
        return;
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách bài giảng:', e);
    }

    const defaultLessons: LessonData[] = [
      {
        id: 'lesson_ctst_1',
        title: 'Bài 2. Nguyên tử',
        grade: '7',
        curriculum: 'Chân trời sáng tạo',
        createdAt: new Date().toLocaleDateString('vi-VN'),
        teacherNote: 'Tiến trình dạy học KHTN 7: Mở đầu -> Khám phá cấu tạo nguyên tử -> Mô phỏng trực quan -> Luyện tập hạt hạ nguyên tử.',
        mindmap: {
          nodes: [
            { id: 'root', data: { label: '⚛️ Nguyên Tử' }, position: { x: 250, y: 150 }, style: { background: '#2563eb', color: '#fff', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold' } },
            { id: 'n1', data: { label: 'Hạt nhân (P+, N)' }, position: { x: 50, y: 270 }, style: { background: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '6px 12px' } },
            { id: 'n2', data: { label: 'Vỏ Electron (e-)' }, position: { x: 420, y: 270 }, style: { background: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '6px 12px' } },
          ],
          edges: [
            { id: 'e1', source: 'root', target: 'n1', animated: true },
            { id: 'e2', source: 'root', target: 'n2', animated: true },
          ],
        },
        slides: [
          {
            type: 'content',
            title: '1. Lý Thuyết Trọng Tâm (SGK KHTN 7)',
            content: 'Nguyên tử là hạt vô cùng nhỏ bé và trung hòa về điện. Nguyên tử gồm hạt nhân mang điện tích dương nằm ở tâm và lớp vỏ gồm một hay nhiều electron mang điện tích âm chuyển động xung quanh.',
            formula: 'Z = P = E \\quad | \\quad A = P + N',
          },
          {
            type: 'mindmap',
            title: '2. Sơ Đồ Tư Duy Bài Học',
            content: 'Tổng quan kiến thức nguyên tử qua sơ đồ tư duy tương tác.',
          },
          {
            type: 'extension',
            title: '3. Mở Rộng Kiến Thức & Tích Hợp STEM',
            extraKnowledge: '• Lịch sử khám phá: Từ mô hình hành tinh nguyên tử của Rutherford - Bohr đến mô hình hiện đại.\n• Ứng dụng thực tiễn: Khối lượng nguyên tử vô cùng nhỏ, tính theo đơn vị amu (1\\text{ amu} \\approx 1.6605 \\times 10^{-24}\\text{ g}).',
            formula: '1\\text{ amu} = 1.6605 \\times 10^{-24}\\text{ g}',
          },
          {
            type: 'flashcard',
            title: '4. Thẻ Ghi Nhớ Thuật Ngữ KHTN',
            term: 'Proton & Electron',
            definition: 'Proton (p) mang điện tích dương (+1) nằm trong hạt nhân. Electron (e) mang điện tích âm (-1) chuyển động ở lớp vỏ nguyên tử.',
          },
          {
            type: 'embed',
            title: '5. Mô Phỏng Cấu Tạo Nguyên Tử PhET',
            embedUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html?locale=vi',
            embedType: 'url',
          },
          {
            type: 'quiz_mcq',
            title: '6. Câu Hỏi Củng Cố Năng Lực',
            question: 'Theo SGK KHTN 7, hạt nhân nguyên tử được tạo thành từ những loại hạt nào?',
            options: [
              'A. Proton và Neutron',
              'B. Proton và Electron',
              'C. Neutron và Electron',
              'D. Chỉ gồm các hạt Electron'
            ],
            answer: 0,
            explanation: 'Hạt nhân nguyên tử nằm ở tâm, gồm hạt proton (mang điện tích dương) và hạt neutron (không mang điện). Các electron nằm ở lớp vỏ.',
          },
        ],
      },
    ];
    setSavedLessons(defaultLessons);
    setLesson(defaultLessons[0]);
    localStorage.setItem('khtn_saved_lessons', JSON.stringify(defaultLessons));
  };

  useEffect(() => {
    const authStatus = sessionStorage.getItem('teacher_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }

    fetchLessonsSafely();

    const localSims = localStorage.getItem('khtn_custom_simulations');
    if (localSims) {
      try {
        setCustomSims(JSON.parse(localSims));
      } catch (e) {
        console.error('Lỗi tải mô phỏng tùy chỉnh:', e);
      }
    } else {
      const defaultSims: CustomSimulation[] = [
        {
          id: 'sim_1',
          title: 'Mô Phỏng Cấu Tạo Nguyên Tử (PhET)',
          subject: 'Hóa Học',
          embedUrl: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html?locale=vi',
          embedType: 'url',
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
        {
          id: 'sim_2',
          title: 'Chuyển Động & Lực (PhET)',
          subject: 'Vật Lý',
          embedUrl: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html?locale=vi',
          embedType: 'url',
          createdAt: new Date().toLocaleDateString('vi-VN'),
        },
      ];
      setCustomSims(defaultSims);
      localStorage.setItem('khtn_custom_simulations', JSON.stringify(defaultSims));
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '050998') {
      setIsAuthenticated(true);
      sessionStorage.setItem('teacher_authenticated', 'true');
      setPassError(false);
    } else {
      setPassError(true);
    }
  };

  const processEmbedInput = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return { type: 'url' as const, url: '', html: '' };

    if (/^https?:\/\//i.test(trimmed) && !trimmed.includes('<iframe') && !trimmed.includes('<div')) {
      return { type: 'url' as const, url: trimmed, html: '' };
    }

    if (trimmed.includes('<iframe')) {
      const srcMatch = trimmed.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
        return { type: 'url' as const, url: srcMatch[1], html: trimmed };
      }
    }

    return { type: 'html' as const, url: '', html: trimmed };
  };

  const handleDeleteLesson = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa bài giảng này khỏi kho lưu trữ?')) {
      const updatedList = savedLessons.filter((item) => item.id !== id);
      setSavedLessons(updatedList);
      localStorage.setItem('khtn_saved_lessons', JSON.stringify(updatedList));

      if (lesson?.id === id) {
        setLesson(updatedList.length > 0 ? updatedList[0] : null);
        setCurrentSlideIndex(0);
      }
    }
  };

  const handleAddCustomSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simTitle.trim() || !simCode.trim()) {
      alert('Vui lòng điền đầy đủ Tên bài thí nghiệm và Mã nhúng / Đường link!');
      return;
    }

    const processed = processEmbedInput(simCode);
    const newSim: CustomSimulation = {
      id: Date.now().toString(),
      title: simTitle.trim(),
      subject: simSubject,
      embedUrl: processed.url,
      embedHtml: processed.html,
      embedType: processed.type,
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    const updatedSims = [newSim, ...customSims];
    setCustomSims(updatedSims);
    
    localStorage.setItem('khtn_custom_simulations', JSON.stringify(updatedSims));
    localStorage.setItem('khtn_teacher_simulations', JSON.stringify(updatedSims));

    setSimTitle('');
    setSimCode('');
    alert('🎉 Đã lưu thí nghiệm mới vào thư viện!');
  };

  const handleDeleteSim = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa thí nghiệm này khỏi thư viện?')) {
      const updated = customSims.filter((s) => s.id !== id);
      setCustomSims(updated);
      localStorage.setItem('khtn_custom_simulations', JSON.stringify(updated));
      localStorage.setItem('khtn_teacher_simulations', JSON.stringify(updated));
    }
  };

  const handleExportLesson = (exportLesson: LessonData) => {
    const filename = `bai-giang-${exportLesson.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    const blob = new Blob([JSON.stringify(exportLesson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveMindmap = (updatedMindmapData: MindmapData) => {
    if (!lesson) return;
    const updatedLesson = {
      ...lesson,
      mindmap: updatedMindmapData,
    };
    setLesson(updatedLesson);

    const updatedList = savedLessons.map((item) =>
      item.id === lesson.id ? updatedLesson : item
    );
    setSavedLessons(updatedList);
    localStorage.setItem('khtn_saved_lessons', JSON.stringify(updatedList));
    alert('🎉 Đã cập nhật và lưu sơ đồ tư duy thành công!');
  };

  const handleGenerateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Vui lòng nhập tên bài học hoặc chủ đề!');
      return;
    }

    setLoading(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('Chưa cấu hình NEXT_PUBLIC_GEMINI_API_KEY trong file .env.local!');
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.6-flash',
        systemInstruction:
          'Bạn là một chuyên gia soạn giáo án và bài giảng môn Khoa học tự nhiên theo chương trình GDPT 2018. Mặc định biên soạn nội dung chuẩn xác theo bộ sách Chân trời sáng tạo hoặc Kết nối tri thức. Hãy cung cấp định dạng công thức Toán/Hóa chuẩn LaTeX cho thuộc tính formula.',
      });

      let processedEmbed = processEmbedInput(embedUrl);
      let targetSimUrl = selectedPresetSim || processedEmbed.url;

      if (!targetSimUrl) {
        const lowerTopic = topic.toLowerCase();
        if (lowerTopic.includes('nguyên tử') || lowerTopic.includes('hạt')) {
          targetSimUrl = 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html?locale=vi';
        } else if (lowerTopic.includes('tốc độ') || lowerTopic.includes('lực')) {
          targetSimUrl = 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html?locale=vi';
        } else {
          targetSimUrl = 'https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_all.html?locale=vi';
        }
      }

      const prompt = `Bạn là một giáo viên Khoa học tự nhiên giỏi. Biên soạn bài giảng cho chủ đề: "${topic}".
Bộ sách SGK: "${bookSeries}", Khối lớp: ${grade}, Đối tượng học sinh: "${studentLevel}".
Yêu cầu cần đạt: "${yccd || "Tự động xác định theo chuẩn chương trình GDPT 2018 KHTN lớp " + grade}".
Ghi chú sư phạm: "${note || "Không có"}".

HÃY TRẢ VỀ DUY NHẤT MỘT CHUỖI JSON (KHÔNG DÙNG MARKDOWN CODEBLOCK \`\`\`json, KHÔNG THÊM LỜI DẪN):
{
  "title": "Tên bài học đầy đủ chuẩn SGK",
  "unit": "Tên Chương/Chủ đề chuẩn SGK",
  "objectives": [
    "Mục tiêu kiến thức",
    "Mục tiêu năng lực",
    "Mục tiêu phẩm chất"
  ],
  "slides": [
    {
      "type": "content",
      "title": "1. Khởi động & Mở đầu",
      "content": "Tình huống mở đầu thực tế dẫn dắt bài học...",
      "formula": "Công thức toán hoặc hóa dạng LaTeX nếu có"
    },
    {
      "type": "content",
      "title": "2. Lý thuyết trọng tâm",
      "content": "Nội dung kiến thức cốt lõi chuẩn SGK...",
      "formula": "Z = P = E \\\\quad | \\\\quad A = P + N"
    },
    {
      "type": "mindmap",
      "title": "3. Sơ đồ tư duy bài học",
      "content": "Hệ thống hóa kiến thức trọng tâm"
    },
    {
      "type": "extension",
      "title": "4. Mở rộng kiến thức & STEM",
      "extraKnowledge": "Kiến thức nâng cao thực tế hoặc ứng dụng STEM...",
      "formula": "1\\\\text{ amu} = 1.6605 \\\\times 10^{-24}\\\\text{ g}"
    },
    {
      "type": "embed",
      "title": "5. Thí nghiệm & Mô phỏng trực quan",
      "embedUrl": "${targetSimUrl}",
      "embedType": "url"
    },
    {
      "type": "quiz_mcq",
      "title": "6. Câu hỏi củng cố & Đánh giá năng lực",
      "question": "Câu hỏi trắc nghiệm kiểm tra kiến thức bài học?",
      "options": ["A. Đáp án A", "B. Đáp án B", "C. Đáp án C", "D. Đáp án D"],
      "answer": 0,
      "explanation": "Lời giải chi tiết chuẩn SGK."
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      let rawText = result.response.text();

      rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Dữ liệu AI trả về chưa đúng định dạng JSON');
      }

      const aiData = JSON.parse(jsonMatch[0]);

      const defaultGeneratedMindmap: MindmapData = {
        nodes: [
          { id: 'root', data: { label: aiData.title || topic }, position: { x: 250, y: 150 }, style: { background: '#2563eb', color: '#fff', borderRadius: '12px', padding: '10px 18px', fontWeight: 'bold' } },
          { id: 'n1', data: { label: 'Khái niệm & Lý thuyết' }, position: { x: 80, y: 260 }, style: { background: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '6px 12px' } },
          { id: 'n2', data: { label: 'Thực hành & Ứng dụng' }, position: { x: 400, y: 260 }, style: { background: '#fff', border: '2px solid #3b82f6', borderRadius: '8px', padding: '6px 12px' } },
        ],
        edges: [
          { id: 'e1', source: 'root', target: 'n1', animated: true },
          { id: 'e2', source: 'root', target: 'n2', animated: true },
        ],
      };

      const generated: LessonData = {
        id: `lesson_${Date.now()}`,
        title: aiData.title || (topic.length < 5 ? `Bài ${topic}: Bài giảng KHTN ${grade}` : topic),
        grade: grade,
        curriculum: bookSeries,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        teacherNote: note.trim() ? note : `Tiến trình KHTN ${grade}: Mở đầu -> Khám phá -> Thí nghiệm -> Luyện tập.`,
        studentLevel: studentLevel,
        yccd: yccd,
        unit: aiData.unit,
        objectives: aiData.objectives,
        slides: aiData.slides || [],
        mindmap: defaultGeneratedMindmap,
      };

      setLesson(generated);
      const updatedList = [generated, ...savedLessons];
      setSavedLessons(updatedList);
      localStorage.setItem('khtn_saved_lessons', JSON.stringify(updatedList));

      try {
        const response = await fetch('/api/lessons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generated),
        });

        if (!response.ok) {
          throw new Error('Không thể lưu bài giảng vào kho server');
        }
      } catch (saveError) {
        console.error('Lỗi lưu bài giảng lên server:', saveError);
        alert('Bài giảng đã lưu trên trình duyệt nhưng chưa ghi được vào file server.');
      }

      setCurrentSlideIndex(0);
      setSelectedOption(null);
    } catch (error: any) {
      console.error('Lỗi AI Generator:', error);
      alert(`⚠️ Không thể kết nối hoặc xử lý dữ liệu AI: ${error.message || 'Vui lòng thử lại!'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto text-4xl shadow-inner">
            🔐
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800">Xác Nhận Quyền Giáo Viên</h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Vui lòng nhập mật mã PIN để truy cập hệ thống biên soạn bài giảng.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                placeholder="Nhập mã PIN (6 số)..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full p-4 text-center text-2xl font-bold tracking-widest border-2 border-slate-200 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition"
              />
              {passError && (
                <p className="text-red-500 text-sm mt-2 font-bold">⚠️ Mật mã không đúng! Vui lòng thử lại.</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl text-base transition shadow-lg shadow-blue-500/30"
            >
              Mở Khóa Bảng Điều Khiển
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 space-y-6">
      <header className="max-w-7xl mx-auto flex justify-between items-center pb-6 border-b-2 border-slate-200 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm bg-white border border-slate-300 px-4 py-2.5 rounded-2xl hover:bg-slate-100 transition text-slate-700 font-bold flex items-center gap-2 shadow-sm"
          >
            ← Trang Chủ
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-blue-700 tracking-tight">
              👩‍🏫 Bảng Soạn Bài Giảng AI Gemini 3.6 Flash
            </h1>
            <p className="text-slate-600 text-sm font-semibold mt-0.5">
              Hệ thống giáo án KHTN Lớp 6 - 9 (Chuẩn SGK, Mô phỏng STEM & Sơ đồ tư duy)
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            sessionStorage.removeItem('teacher_authenticated');
            setIsAuthenticated(false);
          }}
          className="text-sm bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-2xl hover:bg-red-100 transition font-bold"
        >
          🔒 Khóa Hệ Thống
        </button>
      </header>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit space-x-2 flex-wrap gap-y-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-6 py-3 rounded-xl text-sm font-extrabold transition flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✨ Soạn Bài Giảng AI
          </button>
          <button
            onClick={() => setActiveTab('simulations')}
            className={`px-6 py-3 rounded-xl text-sm font-extrabold transition flex items-center gap-2 ${
              activeTab === 'simulations'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧪 Thí Nghiệm Ảo & Nhúng URL
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-xl text-sm font-extrabold transition flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Thống Kê Lớp Học
          </button>
        </div>

        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <span>✨</span> Thiết lập Bài giảng Gemini 3.6
                  </h2>
                </div>

                <form onSubmit={handleGenerateLesson} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Tên bài học / Chủ đề SGK:</label>
                    <input
                      type="text"
                      placeholder="VD: bài 2, Nguyên tử, Tốc độ..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Bộ sách SGK:</label>
                      <select
                        value={bookSeries}
                        onChange={(e) => setBookSeries(e.target.value)}
                        className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none transition"
                      >
                        <option value="Chân trời sáng tạo" className="text-slate-900 bg-white">Chân trời sáng tạo</option>
                        <option value="Kết nối tri thức" className="text-slate-900 bg-white">Kết nối tri thức</option>
                        <option value="Cánh diều" className="text-slate-900 bg-white">Cánh diều</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Khối lớp:</label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none transition"
                      >
                        <option value="6" className="text-slate-900 bg-white">KHTN Lớp 6</option>
                        <option value="7" className="text-slate-900 bg-white">KHTN Lớp 7</option>
                        <option value="8" className="text-slate-900 bg-white">KHTN Lớp 8</option>
                        <option value="9" className="text-slate-900 bg-white">KHTN Lớp 9</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Đối tượng học sinh:</label>
                    <select
                      value={studentLevel}
                      onChange={(e) => setStudentLevel(e.target.value)}
                      className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none transition"
                    >
                      <option value="Đại trà / Trung bình" className="text-slate-900 bg-white">Đại trà / Trung bình</option>
                      <option value="Khá giỏi / Ôn thi HSG" className="text-slate-900 bg-white">Khá giỏi / Ôn thi HSG</option>
                      <option value="Học sinh cần phụ đạo" className="text-slate-900 bg-white">Học sinh cần phụ đạo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Yêu cầu cần đạt (YCCĐ - Chuẩn 5512):</label>
                    <textarea
                      rows={2}
                      placeholder="Nêu các phẩm chất, năng lực KHTN cần đạt..."
                      value={yccd}
                      onChange={(e) => setYccd(e.target.value)}
                      className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Link URL hoặc Mã nhúng HTML (&lt;iframe&gt;):</label>
                    <textarea
                      rows={2}
                      placeholder="Dán URL PhET/YouTube hoặc mã nhúng iframe..."
                      value={embedUrl}
                      onChange={(e) => setEmbedUrl(e.target.value)}
                      className="w-full p-3 text-sm font-mono font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Mô phỏng Thí nghiệm chọn sẵn:</label>
                    <select
                      value={selectedPresetSim}
                      onChange={(e) => setSelectedPresetSim(e.target.value)}
                      className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none transition"
                    >
                      <option value="" className="text-slate-900 bg-white">-- Không chọn / Sử dụng link tự dán --</option>
                      <option value="https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html?locale=vi" className="text-slate-900 bg-white">🧪 Mô phỏng Nguyên tử (PhET)</option>
                      <option value="https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html?locale=vi" className="text-slate-900 bg-white">⚡ Mô phỏng Chuyển động & Lực (PhET)</option>
                      <option value="https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_all.html?locale=vi" className="text-slate-900 bg-white">🔥 Mô phỏng Các trạng thái vật chất (PhET)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">Ghi chú tiến trình sư phạm:</label>
                    <textarea
                      rows={2}
                      placeholder="Dụng cụ thí nghiệm, hoạt động nhóm..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin">🌀</span> Đang tạo bài giảng bằng Gemini 3.6 Flash...
                      </>
                    ) : (
                      <>
                        <span>✨</span> Tạo Bài Giảng Tự Động
                      </>
                    )}
                  </button>
                </form>
              </div>

              {savedLessons.length > 0 && (
                <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-700 flex items-center justify-between">
                    <span>📂 Kho Bài Giảng Đã Tạo</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-bold">
                      {savedLessons.length} bài
                    </span>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {savedLessons.map((item, index) => (
                      <div
                        key={item.id ? `${item.id}-${index}` : `saved-lesson-${index}` }
                        onClick={() => {
                          setLesson(item);
                          setCurrentSlideIndex(0);
                          setSelectedOption(null);
                        }}
                        className={`p-3 rounded-xl border text-sm font-bold cursor-pointer transition flex justify-between items-center group ${
                          lesson?.id === item.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="truncate max-w-[180px]">
                          <p className="truncate">{item.title}</p>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Lớp {item.grade} • {item.curriculum}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportLesson(item);
                            }}
                            className="p-1.5 text-xs text-blue-600 hover:bg-blue-100 rounded-lg transition"
                            title="Xuất bài giảng ra file JSON"
                          >
                            📥
                          </button>
                          <button
                            onClick={(e) => handleDeleteLesson(item.id, e)}
                            className="p-1.5 text-xs text-red-500 hover:bg-red-100 rounded-lg transition"
                            title="Xóa bài giảng này"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 space-y-6">
              {lesson ? (
                <div className="bg-white border-2 border-slate-200 p-6 rounded-3xl shadow-sm space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 flex-wrap gap-2">
                    <div>
                      <div className="flex gap-2 items-center">
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          KHTN Lớp {lesson.grade}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                          {lesson.curriculum}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-slate-900 mt-1">{lesson.title}</h2>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleExportLesson(lesson)}
                        className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black rounded-xl transition flex items-center gap-1 border border-blue-200"
                        title="Xuất bài giảng"
                      >
                        📥 Xuất JSON
                      </button>
                      <button
                        onClick={() => setShowPreviewModal(true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition flex items-center gap-1.5 shadow-sm"
                      >
                        👁️ Xem Trước
                      </button>
                      <button
                        onClick={() => setShowQRModal(true)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition flex items-center gap-1.5"
                      >
                        <span>📱</span> Chia sẻ QR
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-extrabold text-slate-700">
                        Danh sách Slides ({normalizedSlides.length})
                      </h3>
                      <button
                        onClick={() => {
                          const newSlide: Slide = {
                            type: 'content',
                            title: `${lesson.slides.length + 1}. Slide mới`,
                            content: 'Nội dung slide mới...'
                          };
                          setLesson({ ...lesson, slides: [...lesson.slides, newSlide] });
                        }}
                        className="text-xs font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg hover:bg-emerald-100 transition"
                      >
                        + Thêm Slide
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {normalizedSlides.map((s, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setCurrentSlideIndex(index);
                            setSelectedOption(null);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold cursor-pointer text-center truncate transition ${
                            currentSlideIndex === index
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="block text-[10px] text-slate-400 uppercase">SLIDE {index + 1}</span>
                          <span className="truncate block">{s.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KHUNG HIỂN THỊ VÀ CHỈNH SỬA SLIDE */}
                  <div className="min-h-[360px] bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                    {currentSlide && (
                      <div className="space-y-4 my-auto">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-slate-500 uppercase">
                            Chỉnh sửa Slide hiện tại (Slide {currentSlideIndex + 1})
                          </span>
                          <button
                            onClick={() => {
                              if (lesson.slides.length <= 1) {
                                alert('Bài giảng phải có ít nhất 1 slide!');
                                return;
                              }
                              const updated = lesson.slides.filter((_, idx) => idx !== currentSlideIndex);
                              setLesson({ ...lesson, slides: updated });
                              setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
                            }}
                            className="text-xs text-red-500 hover:text-red-700 font-bold"
                          >
                            🗑️ Xóa slide
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">Tiêu đề Slide</label>
                          <input
                            type="text"
                            value={currentSlide.title || ''}
                            onChange={(e) => {
                              const updated = [...lesson.slides];
                              updated[currentSlideIndex].title = e.target.value;
                              setLesson({ ...lesson, slides: updated });
                            }}
                            className="w-full p-2.5 text-sm font-bold border rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none"
                          />
                        </div>

                        {/* HIỂN THỊ SƠ ĐỒ TƯ DUY NẾU TYPE LÀ MINDMAP */}
                        {currentSlide.type === 'mindmap' ? (
                          <div className="space-y-2">
                            <label className="block text-xs font-extrabold text-blue-700">
                              🧠 Trình chỉnh sửa Sơ đồ tư duy Tương tác
                            </label>
                            <MindmapEditor
                              initialData={lesson.mindmap}
                              onSave={handleSaveMindmap}
                            />
                          </div>
                        ) : currentSlide.type === 'embed' ? (
                          <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-300 bg-slate-900 shadow-inner">
                            <SimulationViewer
                              url={currentSlide.embedUrl}
                              html={currentSlide.embedHtml}
                              title={currentSlide.title}
                            />
                          </div>
                        ) : currentSlide.type === 'quiz_mcq' ? (
                          <div className="space-y-3">
                            <p className="font-extrabold text-slate-800 text-base">
                              {currentSlide.question}
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                              {currentSlide.options?.map((opt, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedOption(index)}
                                  className={`p-3 rounded-xl text-left text-sm font-bold border transition ${
                                    selectedOption === index
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'bg-white border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung chính</label>
                              <textarea
                                rows={4}
                                value={currentSlide.content || ''}
                                onChange={(e) => {
                                  const updated = [...lesson.slides];
                                  if (updated[currentSlideIndex].type === 'extension') {
                                    updated[currentSlideIndex].extraKnowledge = e.target.value;
                                  } else {
                                    updated[currentSlideIndex].content = e.target.value;
                                  }
                                  setLesson({ ...lesson, slides: updated });
                                }}
                                className="w-full p-3 text-sm font-medium border rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none"
                              />
                            </div>

                            {/* Ô nhập & Hiển thị Công thức Toán / Hóa học */}
                            <div>
                              <label className="block text-xs font-bold text-slate-600 mb-1">
                                Công thức Toán / Hóa học (LaTeX):
                              </label>
                              <input
                                type="text"
                                placeholder="VD: Z = P = E hoặc 1\text{ amu} = 1.6605 \times 10^{-24}\text{ g}"
                                value={currentSlide.formula || ''}
                                onChange={(e) => {
                                  const updated = [...lesson.slides];
                                  updated[currentSlideIndex].formula = e.target.value;
                                  setLesson({ ...lesson, slides: updated });
                                }}
                                className="w-full p-2.5 text-sm font-mono border rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none mb-2"
                              />
                              {currentSlide.formula && (
                                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-center">
                                  <MathRenderer mathText={currentSlide.formula} isBlock={true} />
                                </div>
                              )}
                            </div>

                            {/* Khung tương tác / Ghi chú / Ví dụ */}
                            {currentSlide.boxContent && (
                              <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                  Khung tương tác / Nội dung mở rộng
                                </label>
                                <textarea
                                  rows={2}
                                  value={currentSlide.boxContent}
                                  onChange={(e) => {
                                    const updated = [...lesson.slides];
                                    updated[currentSlideIndex].boxContent = e.target.value;
                                    setLesson({ ...lesson, slides: updated });
                                  }}
                                  className="w-full p-3 text-sm font-medium border border-blue-200 rounded-xl bg-blue-50/50 text-slate-900 focus:border-blue-600 outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      disabled={currentSlideIndex === 0}
                      onClick={() => {
                        setCurrentSlideIndex((prev) => prev - 1);
                        setSelectedOption(null);
                      }}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-800 text-xs font-black rounded-xl transition"
                    >
                      ← Slide trước
                    </button>
                    <span className="text-xs font-extrabold text-slate-500">
                      Slide {currentSlideIndex + 1} / {normalizedSlides.length}
                    </span>
                    <button
                      disabled={currentSlideIndex === normalizedSlides.length - 1}
                      onClick={() => {
                        setCurrentSlideIndex((prev) => prev + 1);
                        setSelectedOption(null);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-black rounded-xl transition"
                    >
                      Slide sau →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                  <div className="text-4xl">💻</div>
                  <p className="font-bold text-sm">Chưa có bài giảng nào được tạo.</p>
                  <p className="text-xs text-slate-400">Hãy nhập thông tin ở cột bên trái và bấm &quot;Tạo Bài Giảng Tự Động&quot;.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'simulations' && (
          <div className="space-y-8">
            <div className="bg-white border-2 border-blue-200 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <span className="text-2xl">➕</span>
                <div>
                  <h2 className="font-black text-slate-900 text-base">Thêm Thí Nghiệm / Mã Nhúng HTML Tùy Chỉnh</h2>
                  <p className="text-xs text-slate-500 font-semibold">
                    Dán đường link URL (PhET, YouTube, Canva) hoặc mã nhúng <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">&lt;iframe&gt;</code> / HTML tại đây.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddCustomSimulation} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Tên thí nghiệm / tài liệu:</label>
                  <input
                    type="text"
                    placeholder="VD: Mô phỏng Sự truyền nhiệt, Quang hợp..."
                    value={simTitle}
                    onChange={(e) => setSimTitle(e.target.value)}
                    className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">Phân môn KHTN:</label>
                  <select
                    value={simSubject}
                    onChange={(e) => setSimSubject(e.target.value)}
                    className="w-full p-3 text-sm font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-600 outline-none transition"
                  >
                    <option value="Vật Lý" className="text-slate-900 bg-white">⚡ Vật Lý</option>
                    <option value="Hóa Học" className="text-slate-900 bg-white">🧪 Hóa Học</option>
                    <option value="Sinh Học" className="text-slate-900 bg-white">🌿 Sinh Học / Trái Đất</option>
                    <option value="Khác" className="text-slate-900 bg-white">📚 Học Liệu Khác</option>
                  </select>
                </div>

                <div className="md:col-span-12">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Mã nhúng HTML (&lt;iframe ...&gt;&lt;/iframe&gt;), URL hoặc Code HTML gốc:
                  </label>
                  <textarea
                    rows={3}
                    placeholder='Dán https://phet.colorado.edu/... hoặc <iframe src="..."></iframe> hoặc mã HTML custom'
                    value={simCode}
                    onChange={(e) => setSimCode(e.target.value)}
                    className="w-full p-3 text-sm font-mono font-bold border-2 border-slate-200 rounded-xl bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 outline-none transition"
                  ></textarea>
                </div>

                <div className="md:col-span-12 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2"
                  >
                    📥 Lưu Vào Thư Viện
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                  <span>📚</span> Thư Viện Thí Nghiệm & Học Liệu Tương Tác ({customSims.length})
                </h2>
              </div>

              {customSims.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customSims.map((sim) => (
                    <div key={sim.id} className="border-2 border-blue-100 rounded-3xl p-5 bg-white space-y-3 shadow-sm relative group">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-full font-black bg-blue-100 text-blue-700">
                            {sim.subject}
                          </span>
                          <h3 className="font-extrabold text-sm text-slate-800 truncate max-w-[220px]">{sim.title}</h3>
                        </div>
                        <button
                          onClick={() => handleDeleteSim(sim.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition"
                          title="Xóa khỏi thư viện"
                        >
                          🗑️ Xóa
                        </button>
                      </div>

                      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                        <SimulationViewer url={sim.embedUrl} html={sim.embedHtml} title={sim.title} />
                      </div>
                      <p className="text-xs text-slate-400 font-medium text-right">Ngày tạo: {sim.createdAt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold text-sm">Chưa có thí nghiệm nào trong thư viện.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white border-2 border-slate-200 p-8 rounded-3xl shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span>📊</span> Thống Kê & Tiến Độ Lớp Học KHTN
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl text-center space-y-1">
                <p className="text-xs font-extrabold text-blue-600 uppercase">Bài giảng đã tạo</p>
                <p className="text-3xl font-black text-blue-900">{savedLessons.length}</p>
              </div>
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <p className="text-xs font-extrabold text-emerald-600 uppercase">Thí nghiệm ảo</p>
                <p className="text-3xl font-black text-emerald-900">{customSims.length}</p>
              </div>
              <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl text-center space-y-1">
                <p className="text-xs font-extrabold text-purple-600 uppercase">Học sinh hoàn thành</p>
                <p className="text-3xl font-black text-purple-900">142</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showQRModal && lesson && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl max-w-sm w-full space-y-5 text-center shadow-2xl">
            <h3 className="font-black text-slate-800 text-lg">Quét Mã QR Hoặc Sao Chép Link</h3>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl inline-block mx-auto">
              <QRCodeSVG value={typeof window !== 'undefined' ? window.location.href : ''} size={180} />
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Học sinh quét mã QR bằng điện thoại để xem trực tiếp bài giảng: <br />
              <strong className="text-slate-800">{lesson.title} ({lesson.curriculum})</strong>
            </p>
            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition border border-blue-200"
              >
                {copiedLink ? '✅ Đã sao chép liên kết!' : '🔗 Sao chép liên kết bài giảng'}
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 bg-slate-200 hover:bg-slate-300 font-extrabold text-slate-800 rounded-xl text-sm transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC BÀI GIẢNG DÀNH CHO HỌC SINH */}
      {showPreviewModal && lesson && currentSlide && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-xs px-2.5 py-1 rounded-full font-bold">Giao Diện Học Sinh</span>
                <h3 className="font-bold text-sm truncate">{lesson.title} ({lesson.curriculum})</h3>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-white font-black text-lg px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {currentSlide.type === 'mindmap' ? (
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-extrabold text-blue-600 text-lg">
                    {currentSlide.title}
                  </h4>
                  <p className="text-xs text-slate-500 font-semibold">
                    Thầy/cô và học sinh có thể kéo thả, phóng to/thu nhỏ để khám phá các nhánh sơ đồ tư duy bên dưới:
                  </p>
                  <MindmapEditor initialData={lesson.mindmap} readOnly={true} />
                </div>
              ) : currentSlide.type === 'embed' ? (
                <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-300 bg-black shadow-lg">
                  <SimulationViewer
                    url={currentSlide.embedUrl}
                    html={currentSlide.embedHtml}
                    title={currentSlide.title}
                  />
                </div>
              ) : currentSlide.type === 'quiz_mcq' ? (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-blue-600 text-lg">
                    {currentSlide.title}
                  </h4>
                  <p className="font-bold text-slate-800 text-base">
                    {currentSlide.question}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {currentSlide.options?.map((opt, index) => (
                      <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold">
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="font-extrabold text-blue-600 text-lg">
                    {currentSlide.title}
                  </h4>

                  <p className="text-slate-700 font-medium leading-relaxed whitespace-pre-line text-base">
                    {currentSlide.content}
                  </p>

                  {currentSlide.formula && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-blue-200 text-center text-lg font-bold my-3 shadow-inner">
                      <MathRenderer mathText={currentSlide.formula} isBlock={true} />
                    </div>
                  )}

                  {currentSlide.boxContent && (
                    <div className="mt-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl text-slate-800 font-medium text-center">
                      {currentSlide.boxContent}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white flex justify-between items-center">
              <button
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold disabled:opacity-40"
              >
                ← Slide trước
              </button>
              <span className="text-xs font-bold text-slate-500">
                Slide {currentSlideIndex + 1} / {normalizedSlides.length}
              </span>
              <button
                disabled={currentSlideIndex === normalizedSlides.length - 1}
                onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
              >
                Slide sau →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}