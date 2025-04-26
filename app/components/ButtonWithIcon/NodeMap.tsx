import React, { useState, useRef, useEffect } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { createClient } from '@supabase/supabase-js';

// Supabase setup
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, anonKey);

// --- Types ---
type PersonRow = {
  id: number;
  name: string;
  pictureURL: string | null;
  bio: string | null;
  arrived: number;
  deactivated: number | null;
};

type FriendRow = {
  friend_1: number;
  friend_2: number;
  emoji: string | null;
  context: string | null;
  episode: number;
};

type EnemyRow = {
  enemy_1: number;
  enemy_2: number;
  emoji: string;
  context: string;
};

type PairRow = {
  friend_1: number;
  friend_2: number;
};

type NodeData = {
  id: string;
  label: string;
  pictureURL?: string;
  bio?: string;
  borderColor?: string;
  borderStyle?: string;
};

// color palette for pairs
const PALETTE = [
  '#f032e6', // magenta
  '#f58231', // orange
  '#46f0f0', // cyan
  '#ffe119', // yellow
  '#6a3d9a', // deep purple
  '#ff9f80', // coral
  '#008080', // teal
  '#808000', // olive
];

// cytoscape default style
const defaultStyle = [
  {
    selector: 'node',
    style: {
      'background-image': 'data(pictureURL)',
      'background-fit': 'cover',
      'background-clip': 'node',
      'background-color': '#0074D9',
      'label': '',
      'border-width': 0,
      'border-color': 'data(borderColor)',
      'border-style': 'data(borderStyle)',
      'width': 50,
      'height': 50,
    } as any,
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
    } as any,
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#aaa',
      label: 'data(emoji)',
      'font-size': 14,
      'text-rotation': 'none',
      'text-justification': 'center',
      'text-margin-y': 0,
      'text-background-opacity': 0,
    } as any,
  },
  {
    selector: 'edge[type="friend"]',
    style: {
      'line-color': 'green',
      'color': 'green',
    } as any,
  },
  {
    selector: 'edge[type="enemy"]',
    style: {
      'line-color': 'red',
      'color': 'red',
    } as any,
  },
  {
    selector: 'node[!pictureURL]',
    style: {
      'label': 'data(label)',
      'font-size': 10,
      'background-color': '#0074D9',
    }
  }
];

const NodeMap: React.FC = () => {
  // raw data from Supabase
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [enemies, setEnemies] = useState<EnemyRow[]>([]);
  const [pairs, setPairs] = useState<PairRow[]>([]);

  // filtered graph elements
  const [elements, setElements] = useState<ElementDefinition[]>([]);

  // UI state
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{
    source: string;
    target: string;
    type: string;
    emoji: string;
    context: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | undefined>(undefined);

  // 1️⃣ Fetch raw data once
  useEffect(() => {
    const loadData = async () => {
      const [
        { data: p, error: pErr },
        { data: f, error: fErr },
        { data: e, error: eErr },
        { data: pr, error: prErr },
      ] = await Promise.all([
        supabase.from<'people', PersonRow>('people').select('id, name, pictureURL, bio, arrived, deactivated'),
        supabase.from<'friends', FriendRow>('friends').select('friend_1, friend_2, emoji, context, episode'),
        supabase.from<'enemies', EnemyRow>('enemies').select('enemy_1, enemy_2, emoji, context'),
        supabase.from<'pairs', PairRow>('pairs').select('friend_1, friend_2'),
      ]);

      if (pErr || fErr || eErr || prErr) {
        console.error('Error fetching data:', pErr, fErr, eErr, prErr);
        return;
      }

      setPeople(p || []);
      setFriends(f || []);
      setEnemies(e || []);
      setPairs(pr || []);
    };
    loadData();
  }, []);

  // 2️⃣ Recompute Cytoscape elements when data or episode filter changes
  useEffect(() => {
    // build color map for pairs
    const colorMap: Record<string, string> = {};
    pairs.forEach((pr, i) => {
      const col = PALETTE[i % PALETTE.length];
      colorMap[String(pr.friend_1)] = col;
      colorMap[String(pr.friend_2)] = col;
    });

    // nodes
    const nodes = people.map(p => {
      // Check if the node should be shown
      const isVisible = p.arrived <= selectedEpisode;
      // Check if the node should be grayed out
      const isInactive = p.deactivated !== null && p.deactivated <= selectedEpisode;

      return {
        data: {
          id: String(p.id),
          label: p.name,
          pictureURL: p.pictureURL || undefined,
          bio: p.bio || undefined,
          borderColor: colorMap[String(p.id)] || '#f00',
          borderStyle: colorMap[String(p.id)] ? 'solid' : 'dotted',
        },
        classes: isInactive ? 'inactive' : '',
        visible: isVisible, // Only show node if it should be visible based on the episode
      };
    });

    // only show friends from the selected episode
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
        },
      }));

    // enemies (no filter)
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

  // 3️⃣ Initialize Cytoscape on mount
  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: defaultStyle,
      layout: { name: 'cose', animate: true, fit: true },
    });

    cyRef.current.on('tap', 'node', evt => setSelectedNode((evt.target as any).data()));
    cyRef.current.on('tap', 'edge', evt => {
      const d = (evt.target as any).data();
      setSelectedEdge({
        source: d.source,
        target: d.target,
        type: d.type,
        emoji: d.emoji,
        context: d.context,
      });
    });

    return () => { cyRef.current?.destroy(); };
  }, []);

  // 4️⃣ Update Cytoscape graph when elements change
  useEffect(() => {
    if (!cyRef.current) return;

    cyRef.current.batch(() => {
      cyRef.current!.elements().remove();
      cyRef.current!.add(elements);
    });

    cyRef.current.layout({ name: 'cose', animate: true, fit: true }).run();
  }, [elements]);

  // --- render ---
  return (
    <>
      <div className="flex flex-col items-center justify-center p-4 bg-gray-800">
        {/* Episode filter buttons */}
        <div className="flex space-x-2 p-4 bg-gray-800">
          {Array.from({ length: 10 }, (_, i) => {
            const ep = i + 1;
            return (
              <button
                key={ep}
                onClick={() => setSelectedEpisode(ep)}
                className={
                  `px-3 py-1 rounded text-sm font-medium ` +
                  (selectedEpisode === ep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-600 text-gray-200 hover:bg-gray-500')
                }
              >
                Episode {ep}
              </button>
            );
          })}
        </div>

        {/* Cytoscape container */}
        <div ref={containerRef} className="w-full h-[calc(100vh-64px)] bg-gradient-to-br from-gray-900 via-purple-900 to-black" />

        {/* Node detail modal */}
        {selectedNode && (
          <div className="fixed inset-0 bg-black/25 flex items-center justify-center" onClick={() => setSelectedNode(null)}>
            <div className="bg-white p-5 rounded-lg max-w-md max-h-[80%] overflow-y-auto z-10" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-2">{selectedNode.label}</h3>
              {selectedNode.pictureURL && <img src={selectedNode.pictureURL} alt={selectedNode.label} className="w-full rounded mb-3" />}
              <p className="text-gray-800 whitespace-pre-wrap">{selectedNode.bio}</p>
              <button onClick={() => setSelectedNode(null)} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Edge detail modal */}
        {selectedEdge && (
          <div className="fixed inset-0 bg-black/25 flex items-center justify-center" onClick={() => setSelectedEdge(null)}>
            <div className="bg-white p-5 rounded-lg max-w-md max-h-[80%] overflow-y-auto z-10" onClick={e => e.stopPropagation()}>
              <p className="text-4xl mb-4">{selectedEdge.emoji}</p>
              <p className="mb-4 text-gray-800 whitespace-pre-wrap">{selectedEdge.context || 'No context'}</p>
              <button onClick={() => setSelectedEdge(null)} className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NodeMap;
