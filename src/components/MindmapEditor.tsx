'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  ReactFlowProvider,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { MindmapData, MindmapNode, MindmapEdge } from '@/types/lesson';

interface MindmapEditorProps {
  initialData?: MindmapData;
  lessonTitle?: string;
  lessonContent?: string;
  onSave?: (data: MindmapData) => void;
}

// Node gốc mặc định
const defaultInitialNodes: Node[] = [
  {
    id: 'root',
    type: 'editable',
    data: { label: '🧠 Chủ đề chính' },
    position: { x: 250, y: 150 },
  },
];

// Custom Node hỗ trợ chỉnh sửa nhãn trực tiếp & nút bấm thêm nhánh
function EditableNode({ id, data, selected }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label || '');

  useEffect(() => {
    setLabel(data.label || '');
  }, [data.label]);

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onChangeLabel) {
      data.onChangeLabel(id, label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const isRoot = id === 'root';

  return (
    <div
      onDoubleClick={() => setIsEditing(true)}
      className={`relative group px-4 py-2 rounded-xl shadow-lg border transition-all ${
        isRoot
          ? 'bg-purple-600 text-white border-purple-400 font-bold'
          : 'bg-slate-900 text-slate-100 border-slate-700 hover:border-purple-500'
      } ${selected ? 'ring-2 ring-purple-400 border-transparent' : ''}`}
    >
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-purple-400" />

      {isEditing ? (
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="bg-slate-800 text-white text-xs px-2 py-1 rounded border border-purple-400 focus:outline-none w-full min-w-[120px]"
        />
      ) : (
        <span className="text-xs md:text-sm whitespace-nowrap cursor-pointer select-none">
          {label || 'Nhấp đúp để nhập...'}
        </span>
      )}

      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-purple-400" />

      {/* Nút thêm nhánh con nhanh khi chọn Node */}
      {selected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (data.onAddChild) data.onAddChild(id);
          }}
          className="absolute -right-3 -top-3 w-6 h-6 bg-purple-500 hover:bg-purple-400 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md transition-transform hover:scale-110"
          title="Thêm nhánh con"
        >
          +
        </button>
      )}
    </div>
  );
}

const nodeTypes = {
  editable: EditableNode,
};

export default function MindmapEditor({
  initialData,
  lessonTitle = '',
  lessonContent = '',
  onSave,
}: MindmapEditorProps) {
  // Trạng thái cho Modal AI
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPromptContent, setAiPromptContent] = useState(lessonContent);
  const [isGenerating, setIsGenerating] = useState(false);

  // Cập nhật nhãn node
  const handleLabelChange = useCallback((nodeId: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, label: newLabel },
          };
        }
        return node;
      })
    );
  }, []);

  // Thêm nhánh từ node cha
  const handleAddChildFromParent = useCallback((parentId: string) => {
    setNodes((nds) => {
      const parent = nds.find((n) => n.id === parentId);
      if (!parent) return nds;

      const newId = `node_${Date.now()}`;
      const newNode: Node = {
        id: newId,
        type: 'editable',
        data: { label: 'Nội dung mới' },
        position: {
          x: parent.position.x + 220,
          y: parent.position.y + (Math.random() * 80 - 40),
        },
      };

      setEdges((eds) => [
        ...eds,
        {
          id: `e_${parentId}_${newId}`,
          source: parentId,
          target: newId,
          animated: true,
          style: { stroke: '#a855f7', strokeWidth: 2 },
        },
      ]);

      return [...nds, newNode];
    });
  }, []);

  // Format nodes
  const formatInitialNodes = useCallback(
    (rawNodes?: Node[]): Node[] => {
      const source = rawNodes && rawNodes.length > 0 ? rawNodes : defaultInitialNodes;
      return source.map((n) => ({
        ...n,
        type: 'editable',
        data: {
          ...n.data,
          onChangeLabel: handleLabelChange,
          onAddChild: handleAddChildFromParent,
        },
      }));
    },
    [handleLabelChange, handleAddChildFromParent]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(
    formatInitialNodes(initialData?.nodes as Node[])
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (initialData?.edges as Edge[]) || []
  );

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onChangeLabel: handleLabelChange,
          onAddChild: handleAddChildFromParent,
        },
      }))
    );
  }, [handleLabelChange, handleAddChildFromParent, setNodes]);

  // Nối 2 node
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true, style: { stroke: '#a855f7', strokeWidth: 2 } }, eds)
      ),
    [setEdges]
  );

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleAddChildNode = () => {
    const parentId = selectedNode ? selectedNode.id : nodes[0]?.id || 'root';
    handleAddChildFromParent(parentId);
  };

  const handleDeleteNode = () => {
    if (!selectedNode || selectedNode.id === 'root') return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id)
    );
    setSelectedNode(null);
  };

  // Hàm gọi API AI tạo sơ đồ
  const handleGenerateAI = async () => {
    if (!aiPromptContent.trim()) {
      alert('Vui lòng nhập nội dung bài học để AI phân tích.');
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: aiPromptContent,
          title: lessonTitle || 'Bài học',
        }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        // Cập nhật sơ đồ mới từ AI
        setNodes(formatInitialNodes(result.data.nodes));
        setEdges(result.data.edges || []);
        setIsAiModalOpen(false);
      } else {
        alert(result.error || 'Có lỗi xảy ra khi tạo sơ đồ bằng AI.');
      }
    } catch (error) {
      console.error('Lỗi gọi API AI Mindmap:', error);
      alert('Không thể kết nối đến máy chủ AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    const cleanNodes = nodes.map(({ data, ...rest }) => ({
      ...rest,
      data: { label: data.label },
    }));

    const exportData: MindmapData = {
      nodes: cleanNodes as unknown as MindmapNode[],
      edges: edges as unknown as MindmapEdge[],
    };

    if (onSave) {
      onSave(exportData);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="w-full flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl relative">
        {/* Thanh công cụ Topbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-900/90 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddChildNode}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition active:scale-95"
            >
              ➕ Thêm nhánh
            </button>

            {selectedNode && selectedNode.id !== 'root' && (
              <button
                type="button"
                onClick={handleDeleteNode}
                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition active:scale-95"
              >
                🗑️ Xóa nhánh
              </button>
            )}

            {/* Nút Tạo bằng AI */}
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-lg shadow-md transition active:scale-95"
            >
              🪄 Tạo bằng AI
            </button>
          </div>

          <div className="text-xs text-slate-400 italic hidden sm:block">
            💡 Nhấp đúp vào nút để sửa chữ trực tiếp
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md transition active:scale-95"
          >
            💾 Lưu sơ đồ
          </button>
        </div>

        {/* Khung Canvas vẽ ReactFlow */}
        <div className="w-full h-[550px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#334155" variant={BackgroundVariant.Dots} gap={20} size={1} />
            <Controls className="bg-slate-900 text-slate-200 border-slate-800 fill-slate-200" />
            <MiniMap
              style={{ backgroundColor: '#0f172a', borderRadius: '12px' }}
              nodeColor="#8b5cf6"
              maskColor="rgba(15, 23, 42, 0.7)"
            />
          </ReactFlow>
        </div>

        {/* Modal nhập văn bản bài học cho AI */}
        {isAiModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>🪄</span> Tạo Sơ đồ Tư duy tự động bằng AI
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Dán nội dung bài học hoặc tóm tắt kiến thức vào đây. AI Gemini sẽ phân tích và tự động dựng thành sơ đồ tư duy hoàn chỉnh.
              </p>

              <textarea
                value={aiPromptContent}
                onChange={(e) => setAiPromptContent(e.target.value)}
                placeholder="Dán nội dung bài học vào đây..."
                rows={6}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                  disabled={isGenerating}
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin">⏳</span> AI đang tạo sơ đồ...
                    </>
                  ) : (
                    '✨ Bắt đầu tạo'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}