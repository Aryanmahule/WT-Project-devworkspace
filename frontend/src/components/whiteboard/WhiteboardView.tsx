import React, { useState, useEffect, useRef } from 'react';
import {
  PenTool,
  Square,
  Circle as CircleIcon,
  ArrowUpRight,
  StickyNote,
  Type,
  RotateCcw,
  Download,
  Save,
  Trash2,
  Check
} from 'lucide-react';
import { Whiteboard, WhiteboardElement } from '../../types';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';

export const WhiteboardView: React.FC = () => {
  const { user } = useAuth();
  const [whiteboards, setWhiteboards] = useState<Whiteboard[]>([]);
  const [activeBoard, setActiveBoard] = useState<Whiteboard | null>(null);
  const [elements, setElements] = useState<WhiteboardElement[]>([]);
  const [history, setHistory] = useState<WhiteboardElement[][]>([]);

  // Tool states
  const [selectedTool, setSelectedTool] = useState<'freehand' | 'rect' | 'circle' | 'arrow' | 'sticky' | 'text'>('freehand');
  const [selectedColor, setSelectedColor] = useState<string>('#16181D');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);

  // Sticky note editor state
  const [stickyText, setStickyText] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    loadWhiteboards();
  }, []);

  useEffect(() => {
    if (activeBoard) {
      const initialElements = activeBoard.board_data?.elements || [];
      setElements(initialElements);
      setHistory([initialElements]);

      const socket = getSocket();
      socket.emit('join_whiteboard', { board_id: activeBoard.id, user: { id: user?.id, name: user?.full_name } });

      const handleBoardUpdated = (data: any) => {
        if (data.element) {
          setElements((prev) => [...prev, data.element]);
        }
      };

      const handleBoardCleared = () => {
        setElements([]);
      };

      socket.on('whiteboard_updated', handleBoardUpdated);
      socket.on('whiteboard_cleared', handleBoardCleared);

      return () => {
        socket.emit('leave_whiteboard', { board_id: activeBoard.id });
        socket.off('whiteboard_updated', handleBoardUpdated);
        socket.off('whiteboard_cleared', handleBoardCleared);
      };
    }
  }, [activeBoard]);

  // Redraw canvas whenever elements or current stroke changes
  useEffect(() => {
    renderCanvas();
  }, [elements, currentStroke]);

  const loadWhiteboards = async () => {
    try {
      const res = await api.getWhiteboards();
      setWhiteboards(res.whiteboards || []);
      if (res.whiteboards?.length > 0) {
        setActiveBoard(res.whiteboards[0]);
      }
    } catch (err) {
      console.error('Failed to load whiteboards:', err);
    }
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background to clean white
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid pattern
    ctx.strokeStyle = '#F0F2F5';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Render all persisted elements
    elements.forEach((el) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'freehand' && el.points && el.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === 'rect' && el.points && el.points.length >= 2) {
        const p1 = el.points[0];
        const p2 = el.points[1];
        ctx.beginPath();
        ctx.rect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
        ctx.stroke();
      } else if (el.type === 'circle' && el.points && el.points.length >= 2) {
        const p1 = el.points[0];
        const p2 = el.points[1];
        const radius = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === 'arrow' && el.points && el.points.length >= 2) {
        const p1 = el.points[0];
        const p2 = el.points[1];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const headlen = 14;
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - headlen * Math.cos(angle - Math.PI / 6), p2.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(p2.x - headlen * Math.cos(angle + Math.PI / 6), p2.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      } else if (el.type === 'sticky' && el.points && el.points.length >= 1) {
        const p = el.points[0];
        const w = 180;
        const h = 130;
        ctx.fillStyle = '#FEF08A';
        ctx.shadowColor = 'rgba(0,0,0,0.06)';
        ctx.shadowBlur = 6;
        ctx.fillRect(p.x, p.y, w, h);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#EAB308';
        ctx.strokeRect(p.x, p.y, w, h);

        ctx.fillStyle = '#16181D';
        ctx.font = '13px Inter, sans-serif';
        const lines = (el.text || 'Sticky Note').split('\n');
        lines.forEach((line, idx) => {
          ctx.fillText(line, p.x + 12, p.y + 24 + idx * 18, w - 24);
        });
      } else if (el.type === 'text' && el.points && el.points.length >= 1) {
        const p = el.points[0];
        ctx.fillStyle = el.color;
        ctx.font = '600 16px Inter, sans-serif';
        ctx.fillText(el.text || 'Label', p.x, p.y);
      }
    });

    // Render live in-progress drawing stroke
    if (isDrawing && currentStroke.length > 0) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (selectedTool === 'freehand') {
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
          ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.stroke();
      } else if (startPos && (selectedTool === 'rect' || selectedTool === 'circle' || selectedTool === 'arrow')) {
        const cur = currentStroke[currentStroke.length - 1];
        if (selectedTool === 'rect') {
          ctx.beginPath();
          ctx.rect(startPos.x, startPos.y, cur.x - startPos.x, cur.y - startPos.y);
          ctx.stroke();
        } else if (selectedTool === 'circle') {
          const radius = Math.hypot(cur.x - startPos.x, cur.y - startPos.y);
          ctx.beginPath();
          ctx.arc(startPos.x, startPos.y, radius, 0, Math.PI * 2);
          ctx.stroke();
        } else if (selectedTool === 'arrow') {
          ctx.beginPath();
          ctx.moveTo(startPos.x, startPos.y);
          ctx.lineTo(cur.x, cur.y);
          ctx.stroke();
        }
      }
    }
  };

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos(coords);
    setCurrentStroke([coords]);

    if (selectedTool === 'sticky') {
      const text = prompt('Enter Sticky Note text:', 'Sprint Action Item') || '';
      if (text) {
        const newEl: WhiteboardElement = {
          id: `sticky-${Date.now()}`,
          type: 'sticky',
          points: [coords],
          color: selectedColor,
          text,
        };
        commitElement(newEl);
      }
      setIsDrawing(false);
      setCurrentStroke([]);
    } else if (selectedTool === 'text') {
      const text = prompt('Enter Text Label:', 'Architecture Node') || '';
      if (text) {
        const newEl: WhiteboardElement = {
          id: `text-${Date.now()}`,
          type: 'text',
          points: [coords],
          color: selectedColor,
          text,
        };
        commitElement(newEl);
      }
      setIsDrawing(false);
      setCurrentStroke([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);
    setCurrentStroke((prev) => [...prev, coords]);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (selectedTool === 'freehand' && currentStroke.length > 1) {
      const newEl: WhiteboardElement = {
        id: `stroke-${Date.now()}`,
        type: 'freehand',
        points: currentStroke,
        color: selectedColor,
        strokeWidth,
      };
      commitElement(newEl);
    } else if (startPos && currentStroke.length > 0 && ['rect', 'circle', 'arrow'].includes(selectedTool)) {
      const endPos = currentStroke[currentStroke.length - 1];
      const newEl: WhiteboardElement = {
        id: `shape-${Date.now()}`,
        type: selectedTool as any,
        points: [startPos, endPos],
        color: selectedColor,
        strokeWidth,
      };
      commitElement(newEl);
    }

    setCurrentStroke([]);
    setStartPos(null);
  };

  const commitElement = (newEl: WhiteboardElement) => {
    const nextElements = [...elements, newEl];
    setElements(nextElements);
    setHistory([...history, nextElements]);

    if (activeBoard) {
      const socket = getSocket();
      socket.emit('update_whiteboard', {
        board_id: activeBoard.id,
        element: newEl,
      });
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const prev = newHistory[newHistory.length - 1];
    setHistory(newHistory);
    setElements(prev);
  };

  const handleClearBoard = () => {
    if (!confirm('Are you sure you want to clear the entire whiteboard?')) return;
    setElements([]);
    setHistory([[]]);
    if (activeBoard) {
      const socket = getSocket();
      socket.emit('clear_whiteboard', { board_id: activeBoard.id });
    }
  };

  const handleSaveBoardToDatabase = async () => {
    if (!activeBoard) return;
    try {
      await api.saveWhiteboard(activeBoard.id, {
        board_data: { elements, version: 1 },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err: any) {
      alert(err.message || 'Error saving whiteboard');
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBoard?.title || 'whiteboard'}.png`;
    a.click();
  };

  const colors = [
    { code: '#16181D', label: 'Charcoal' },
    { code: '#2B4ACB', label: 'Accent Blue' },
    { code: '#12B76A', label: 'Green' },
    { code: '#F79009', label: 'Orange' },
    { code: '#B42318', label: 'Crimson' },
    { code: '#7A5AF8', label: 'Purple' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-page">
      {/* Whiteboard Toolbar */}
      <div className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <select
            className="ui-input h-9 text-secondary font-semibold min-w-[200px]"
            value={activeBoard?.id || ''}
            onChange={(e) => {
              const b = whiteboards.find((x) => x.id === parseInt(e.target.value));
              if (b) setActiveBoard(b);
            }}
          >
            {whiteboards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tools Selector */}
        <div className="inline-flex p-1 bg-page border border-border rounded-[8px] items-center gap-1">
          <button
            onClick={() => setSelectedTool('freehand')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              selectedTool === 'freehand'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Freehand Pencil"
          >
            <PenTool size={15} />
          </button>
          <button
            onClick={() => setSelectedTool('rect')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              selectedTool === 'rect'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Rectangle Shape"
          >
            <Square size={15} />
          </button>
          <button
            onClick={() => setSelectedTool('circle')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              selectedTool === 'circle'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Circle Shape"
          >
            <CircleIcon size={15} />
          </button>
          <button
            onClick={() => setSelectedTool('arrow')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              selectedTool === 'arrow'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Arrow Connector"
          >
            <ArrowUpRight size={15} />
          </button>
          <button
            onClick={() => setSelectedTool('sticky')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              selectedTool === 'sticky'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Sticky Note"
          >
            <StickyNote size={15} />
          </button>
          <button
            onClick={() => setSelectedTool('text')}
            className={`p-1.5 rounded-[6px] transition-colors ${
              selectedTool === 'text'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
            title="Text Label"
          >
            <Type size={15} />
          </button>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          {colors.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelectedColor(c.code)}
              className={`w-5 h-5 rounded-full transition-transform ${
                selectedColor === c.code ? 'ring-2 ring-accent ring-offset-2 scale-110' : ''
              }`}
              style={{ backgroundColor: c.code }}
              title={c.label}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            className="btn-outlined btn-sm p-1.5"
            title="Undo Last Stroke"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={handleClearBoard}
            className="btn-danger btn-sm p-1.5"
            title="Clear Canvas"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={handleExportPNG}
            className="btn-outlined btn-sm"
            title="Download PNG"
          >
            <Download size={14} /> PNG
          </button>
          <button
            onClick={handleSaveBoardToDatabase}
            className="btn-accent btn-sm"
          >
            {savedSuccess ? <Check size={14} /> : <Save size={14} />}
            <span>{savedSuccess ? 'Saved' : 'Save Board'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={2400}
          height={1600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full"
          style={{
            cursor: selectedTool === 'sticky' ? 'copy' : 'crosshair',
          }}
        />
        <div className="absolute bottom-4 left-4 bg-surface border border-border px-3 py-1.5 rounded-[6px] text-[12px] text-text-muted font-medium select-none shadow-none">
          Tool: <strong className="text-text-main font-semibold">{selectedTool.toUpperCase()}</strong> &middot; Collaborative Live Sync Active
        </div>
      </div>
    </div>
  );
};
