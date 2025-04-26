'use client';
import React, { useState, useRef, useEffect } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// --- Types ---
type PersonRow = {
  id: number;
  name: string;
  pictureURL: string | null;
  bio: string | null;
  arrived: number | null;
  deactivated: number | null;
};

type FriendRow = {
  friend_1: number;
  friend_2: number;
  emoji: string | null;
  context: string | null;
  episode: number;
  imageURL?: string | null; // ← NEW, optional because it might not exist yet
};

type EnemyRow = {
  enemy_1: number;
  enemy_2: number;
  emoji: string;
  context: string;
};

type PairRow = {
  pair_1: number;
  pair_2: number;
  episode: number;
};

type NodeData = {
  id: string;
  label: string;
  pictureURL?: string;
  bio?: string;
  borderColor?: string;
  borderStyle?: string;
};

type EdgeData = {
  id: string;
  source: string;
  target: string;
  type: 'friend' | 'enemy';
  emoji: string;
  context: string;
  imageURL?: string;
};

// color palette for pairs
const PALETTE = [
  '#f032e6', '#f58231', '#46f0f0', '#ffe119',
  '#6a3d9a', '#ff9f80', '#008080', '#808000',
];

// cytoscape style
const defaultStyle = [
  {
    selector: 'node',
    style: {
      'background-image': 'data(pictureURL)',
      'background-fit': 'cover',
      'background-clip': 'node',
      'background-color': '#0074D9',
      'label': '',
      'border-width': 2,
      'border-color': 'data(borderColor)',
      'border-style': 'data(borderStyle)',
      'width': 50,
      'height': 50,
    },
  },
  {
    selector: 'node.inactive',
    style: {
      'filter': 'grayscale(100%)',
      'opacity': 0.5,
      'border-width': 2,
      'border-color': '#000',
      'border-style': 'solid',
      'background-color': '#ccc',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#aaa',
      label: 'data(emoji)',
      'font-size': 14,
      'text-rotation': 'none' as 'none',
      'text-justification': 'center' as 'center',
    },
  },
  {
    selector: 'edge[type="friend"]',
    style: {
      'line-color': 'green',
      'color': 'green',
    },
  },
  {
    selector: 'edge[type="enemy"]',
    style: {
      'line-color': 'red',
      'color': 'red',
    },
  },
  {
    selector: 'node[!pictureURL]',
    style: {
      'label': 'data(label)',
      'font-size': 10,
      'background-color': '#0074D9',
    },
  }
];

const NodeMap: React.FC = () => {
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [enemies, setEnemies] = useState<EnemyRow[]>([]);
  const [pairs, setPairs] = useState<PairRow[]>([]);
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeData | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | undefined>(undefined);

  // 1️⃣ Fetch raw data once
  useEffect(() => {
    const loadData = async () => {
      const [
        { data: p },
        { data: f },
        { data: e },
        { data: pr },
      ] = await Promise.all([
        supabase.from('people').select('id, name, pictureURL, bio, arrived, deactivated'),
        supabase.from('friends').select('friend_1, friend_2, emoji, context, episode, imageURL'),
        supabase.from('enemies').select('enemy_1, enemy_2, emoji, context'),
        supabase.from('pairs').select('pair_1, pair_2, episode'),
      ]);

      setPeople(p || []);
      setFriends(f || []);
      setEnemies(e || []);
      setPairs(pr || []);
    };
    loadData();
  }, []);

  // 2️⃣ Recompute elements
  useEffect(() => {
    const colorMap: Record<string, string> = {};
    pairs
      .filter(p => p.episode === selectedEpisode)
      .forEach((pr, i) => {
        const col = PALETTE[i % PALETTE.length];
        colorMap[String(pr.pair_1)] = col;
        colorMap[String(pr.pair_2)] = col;
      });

    const nodes = people
      .filter(p => p.arrived !== null && p.arrived <= selectedEpisode)
      .map(p => ({
        data: {
          id: String(p.id),
          label: p.name,
          pictureURL: p.pictureURL ?? undefined,
          bio: p.bio ?? undefined,
          borderColor: colorMap[String(p.id)] ?? undefined,
          borderStyle: colorMap[String(p.id)] ? 'solid' : undefined,
        },
        classes: p.deactivated !== null && p.deactivated <= selectedEpisode ? 'inactive' : '',
      }));

    const friendEdges = friends
      .filter(f => f.episode === selectedEpisode)
      .map((f, i) => ({
        data: {
          id: `fr${i}`,
          source: String(f.friend_1),
          target: String(f.friend_2),
          type: 'friend',
          emoji: f.emoji ?? '',
          context: f.context ?? '',
          imageURL: f.imageURL ?? undefined,
        },
      }));

    const enemyEdges = enemies.map((e, i) => ({
      data: {
        id: `en${i}`,
        source: String(e.enemy_1),
        target: String(e.enemy_2),
        type: 'enemy',
        emoji: e.emoji,
        context: e.context,
      },
    }));

    setElements([...nodes, ...friendEdges, ...enemyEdges]);
  }, [people, friends, enemies, pairs, selectedEpisode]);

  // 3️⃣ Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: defaultStyle,
      layout: { name: 'cose', animate: true, fit: true },
    });

    cyRef.current.on('tap', 'node', evt => {
      const node = evt.target.data();
      setSelectedNode({
        id: node.id,
        label: node.label,
        pictureURL: node.pictureURL,
        bio: node.bio,
        borderColor: node.borderColor,
        borderStyle: node.borderStyle,
      });
      setSelectedEdge(null);
    });

    cyRef.current.on('tap', 'edge', evt => {
      const edge = evt.target.data();
      setSelectedEdge(edge);
      setSelectedNode(null);
    });

    return () => { cyRef.current?.destroy(); };
  }, []);

  // 4️⃣ Update graph
  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.batch(() => {
      cyRef.current!.elements().remove();
      cyRef.current!.add(elements);
    });

    cyRef.current.layout({ name: 'cose', animate: true, fit: true }).run();
  }, [elements]);

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-800">
      {/* Episode filter */}
      <div className="flex justify-center space-x-2 p-4 w-full h-16 bg-gray-800">
        <button className="px-3 py-1 rounded text-sm font-medium bg-gray-600 text-gray-200">
          Episoder:
        </button>
        {Array.from({ length: 17 }, (_, i) => (
          <button
            key={i}
            onClick={() => setSelectedEpisode(i + 1)}
            className={`px-4 py-2 rounded text-base font-medium ${selectedEpisode === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Graph */}
      <div ref={containerRef} className="w-full h-[calc(100vh-64px)] bg-gradient-to-br from-gray-900 via-purple-900 to-black" />

      {/* Node Modal */}
      {selectedNode && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center text-black" onClick={() => setSelectedNode(null)}>
          <div className="bg-white p-5 rounded-lg max-w-md max-h-[80%] overflow-y-auto z-10" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-2">{selectedNode.label}</h3>
            {selectedNode.pictureURL && (
              <img src={selectedNode.pictureURL} alt={selectedNode.label} className="w-full rounded mb-3" />
            )}
            <p className="text-gray-800 whitespace-pre-wrap">{selectedNode.bio}</p>
            <button onClick={() => setSelectedNode(null)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edge Modal */}
      {selectedEdge && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center" onClick={() => setSelectedEdge(null)}>
          <div className="bg-white p-5 rounded-lg max-w-md max-h-[80%] overflow-y-auto z-10" onClick={e => e.stopPropagation()}>
            <p className="text-4xl mb-4">{selectedEdge.emoji}</p>
            {selectedEdge.imageURL && (
              <img src={selectedEdge.imageURL} alt="Edge Event" className="w-full rounded mb-3" />
            )}
            <p className="text-gray-800 whitespace-pre-wrap">{selectedEdge.context || 'No context'}</p>
            <button onClick={() => setSelectedEdge(null)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NodeMap;
