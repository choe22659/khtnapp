import React from 'react';

// ✅ Cập nhật props cho phép null
interface SimulationViewerProps {
  simulationUrl?: string | null;
  html?: string | null;
  title?: string;
}

export default function SimulationViewer({ simulationUrl, html, title }: SimulationViewerProps) {
  // Kiểm tra đường dẫn có phải chuỗi hợp lệ (không rỗng)
  const hasValidUrl = Boolean(simulationUrl && simulationUrl.trim() !== '');

  return (
    <>
      {hasValidUrl ? (
        <iframe
          src={simulationUrl as string}
          className="w-full h-full rounded-xl border-0"
          title={title || 'Thí nghiệm mô phỏng'}
          allowFullScreen
        />
      ) : (
        <div className="flex items-center justify-center h-[300px] text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
          Chưa chọn mô phỏng thí nghiệm
        </div>
      )}
    </>
  );
}