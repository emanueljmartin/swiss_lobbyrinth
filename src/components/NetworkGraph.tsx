import { useEffect, useRef, useState } from 'react';
import type { GraphData, GraphNode, GraphEdge } from '../types';
import { PARTY_COLORS } from '../types';

interface NetworkGraphProps {
  data: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  height?: number;
}

const ENTITY_COLORS: Record<string, string> = {
  POLITICIAN: '#2563EB',
  COMPANY: '#0891B2',
  ASSOCIATION: '#059669',
  FOUNDATION: '#7C3AED',
  COMMITTEE: '#D97706',
  AGENCY: '#DC2626',
  MEDIA_SOURCE: '#BE185D',
  INDUSTRY_SECTOR: '#374151',
  PERSON: '#6B7280',
};

interface SimNode extends GraphNode {
  vx: number;
  vy: number;
  fx?: number | null;
  fy?: number | null;
}

function runSimulation(nodes: SimNode[], edges: GraphEdge[], width: number, height: number, iterations = 200) {
  const cx = width / 2;
  const cy = height / 2;

  // Initialize positions in a circle
  nodes.forEach((n, i) => {
    if (n.x === undefined || n.y === undefined) {
      const angle = (i / nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) * 0.3;
      n.x = cx + radius * Math.cos(angle);
      n.y = cy + radius * Math.sin(angle);
    }
    n.vx = 0;
    n.vy = 0;
  });

  const nodeById: Record<string, SimNode> = {};
  nodes.forEach(n => { nodeById[n.id] = n; });

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j];
        const dx = (nj.x ?? cx) - (ni.x ?? cx);
        const dy = (nj.y ?? cy) - (ni.y ?? cy);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (3000 / (dist * dist)) * alpha;
        ni.vx -= (dx / dist) * force;
        ni.vy -= (dy / dist) * force;
        nj.vx += (dx / dist) * force;
        nj.vy += (dy / dist) * force;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const s = nodeById[edge.source];
      const t = nodeById[edge.target];
      if (!s || !t) continue;
      const dx = (t.x ?? cx) - (s.x ?? cx);
      const dy = (t.y ?? cy) - (s.y ?? cy);
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const idealDist = 120;
      const force = ((dist - idealDist) / dist) * 0.1 * alpha;
      s.vx += dx * force;
      s.vy += dy * force;
      t.vx -= dx * force;
      t.vy -= dy * force;
    }

    // Gravity toward center
    for (const n of nodes) {
      n.vx += (cx - (n.x ?? cx)) * 0.005 * alpha;
      n.vy += (cy - (n.y ?? cy)) * 0.005 * alpha;
    }

    // Apply velocity with damping
    for (const n of nodes) {
      n.vx *= 0.8;
      n.vy *= 0.8;
      n.x = (n.x ?? cx) + n.vx;
      n.y = (n.y ?? cy) + n.vy;
      // Clamp to canvas
      n.x = Math.max(40, Math.min(width - 40, n.x ?? cx));
      n.y = Math.max(40, Math.min(height - 40, n.y ?? cy));
    }
  }
}

export function NetworkGraph({ data, onNodeClick, height = 500 }: NetworkGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const animFrameRef = useRef<number>(0);
  const tooltipPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current || data.nodes.length === 0) return;
    const canvas = canvasRef.current;
    const w = canvas.offsetWidth;
    const h = height;
    canvas.width = w;
    canvas.height = h;

    const nodes: SimNode[] = data.nodes.map(n => ({ ...n, vx: 0, vy: 0 }));
    runSimulation(nodes, data.edges, w, h, 300);
    setSimNodes(nodes);
  }, [data, height]);

  useEffect(() => {
    if (!canvasRef.current || simNodes.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw edges
      for (const edge of data.edges) {
        const s = simNodes.find(n => n.id === edge.source);
        const t = simNodes.find(n => n.id === edge.target);
        if (!s || !t) continue;
        ctx.beginPath();
        ctx.moveTo(s.x ?? 0, s.y ?? 0);
        ctx.lineTo(t.x ?? 0, t.y ?? 0);
        const alpha = Math.round(edge.is_current ? 0.3 : 0.1 * 255).toString(16).padStart(2, '0');
        ctx.strokeStyle = `#94a3b8${alpha}`;
        ctx.lineWidth = edge.weight * 1.5;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of simNodes) {
        const x = node.x ?? 0;
        const y = node.y ?? 0;
        const isHovered = hoveredNode?.id === node.id;

        let color = ENTITY_COLORS[node.type] ?? '#6B7280';
        if (node.type === 'POLITICIAN' && node.party) {
          color = PARTY_COLORS[node.party] ?? color;
        }

        const baseRadius = node.type === 'POLITICIAN' ? 10 : 7;
        const radius = isHovered ? baseRadius + 3 : baseRadius;

        // Glow effect on hover
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = color + '30';
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.fillStyle = isHovered ? '#f1f5f9' : '#94a3b8';
        ctx.font = isHovered ? 'bold 11px Inter, sans-serif' : '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label.length > 16 ? node.label.slice(0, 15) + '…' : node.label, x, y + radius + 12);
      }
    };

    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [simNodes, data.edges, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || simNodes.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    tooltipPos.current = { x: e.clientX, y: e.clientY };

    let found: GraphNode | null = null;
    for (const n of simNodes) {
      const dx = (n.x ?? 0) - mx;
      const dy = (n.y ?? 0) - my;
      if (Math.sqrt(dx * dx + dy * dy) < 14) {
        found = n;
        break;
      }
    }
    setHoveredNode(found);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || simNodes.length === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    for (const n of simNodes) {
      const dx = (n.x ?? 0) - mx;
      const dy = (n.y ?? 0) - my;
      if (Math.sqrt(dx * dx + dy * dy) < 14 && onNodeClick) {
        onNodeClick(n);
        break;
      }
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height }}
        className="rounded-lg bg-slate-900 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredNode(null)}
        onClick={handleClick}
      />
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pointer-events-none shadow-xl">
          <div className="text-white text-sm font-semibold">{hoveredNode.label}</div>
          <div className="text-slate-400 text-xs mt-0.5">{hoveredNode.type}</div>
          {hoveredNode.party && (
            <div className="text-slate-400 text-xs">{hoveredNode.party}</div>
          )}
          {hoveredNode.mandateCount !== undefined && (
            <div className="text-slate-400 text-xs">{hoveredNode.mandateCount} mandates</div>
          )}
          <div className="text-slate-500 text-xs mt-1">
            Confidence: {Math.round(hoveredNode.confidence * 100)}%
          </div>
        </div>
      )}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <div className="bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-2 text-xs">
          <div className="text-slate-400 font-medium mb-1.5">Legend</div>
          {[
            { label: 'Politician', color: '#2563EB' },
            { label: 'Company', color: '#0891B2' },
            { label: 'Association', color: '#059669' },
            { label: 'Committee', color: '#D97706' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-400">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
