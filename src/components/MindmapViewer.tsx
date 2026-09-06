'use client';

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { MindmapData } from '@/types/lesson';

interface MindmapViewerProps {
  data?: MindmapData;
  title?: string;
}

// Component nút tải ảnh (cần nằm bên trong ReactFlowProvider)
function ExportButton({ filename }: { filename: string }) {
  const { getNodes } = useReactFlow();

  const handleDownload = useCallback(() => {
    const nodes = getNodes();
    if (nodes.length === 0) return;

    // Tính toán kích thước tổng thể của toàn bộ các nút
    const nodesBounds = getNodesBounds(nodes);
    const imageWidth = 1920;
    const imageHeight = 1080;

    const viewport = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      0.2
    );

    const viewportElem = document.querySelector('.react-flow__viewport') as HTMLElement;

    if (viewportElem) {
      toPng(viewportElem, {
        backgroundColor: '#020617', // Màu nền ảnh khớp với bg-slate-950
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `${filename || 'so-do-tu-duy'}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Lỗi xuất ảnh sơ đồ tư duy:', err);
        });
    }
  }, [getNodes, filename]);

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 text-xs bg-purple-600 hover:bg-purple-500 text-white font-medium px-3 py-1.5 rounded-lg border border-purple-400/30 transition-all shadow-sm active:scale-95"
      title="Tải sơ đồ tư duy về máy dưới dạng ảnh PNG"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      Tải ảnh PNG
    </button>
  );
}

export default function MindmapViewer({ data, title }: MindmapViewerProps) {
  const initialNodes = data?.nodes || [];
  const initialEdges = data?.edges || [];

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (!data || !data.nodes || data.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] bg-slate-900/60 rounded-2xl border border-slate-800 p-6 text-center">
        <div className="w-12 h-12 mb-3 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xl">
          🧠
        </div>
        <h3 className="text-lg font-semibold text-slate-200">Chưa có Sơ đồ tư duy</h3>
        <p className="text-sm text-slate-400 mt-1">
          Bài học này chưa được khởi tạo sơ đồ tư duy củng cố kiến thức.
        </p>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="w-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900/80 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <h3 className="font-bold text-slate-100 text-sm md:text-base">
              Sơ đồ tư duy: <span className="text-purple-400">{title || 'Bài học'}</span>
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              Kéo thả & Phóng to/thu nhỏ bằng chuột
            </span>
            <ExportButton filename={`So-do-tu-duy-${title || 'bai-hoc'}`} />
          </div>
        </div>

        <div className="w-full h-[500px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background color="#475569" variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls className="bg-slate-900 text-slate-200 border-slate-800 fill-slate-200" />
            <MiniMap
              style={{ backgroundColor: '#0f172a', borderRadius: '12px' }}
              nodeColor="#8b5cf6"
              maskColor="rgba(15, 23, 42, 0.7)"
            />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}