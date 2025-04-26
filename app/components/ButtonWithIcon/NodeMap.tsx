'use client';
import React, { useState, useRef, useEffect } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase    = createClient(supabaseUrl, anonKey);

type PersonRow = {
  id: number;
  name: string;
  isActive: boolean;
  pictureURL: string | null;
  bio: string | null;
};

type FriendRow = {
  friend_1: number;
  friend_2: number;
  emoji: string | null;
  context: string | null;
};

type EnemyRow = {
  enemy_1: number;
  enemy_2: number;
  emoji: string;
  context: string;
};

type NodeData = {
  id: string;
  label: string;
  pictureURL?: string;
  bio?: string;
};

const defaultStyle = [
  {
    selector: 'node',
    style: {
      'background-color': '#0074D9',
      label: 'data(label)',
      color: '#fff',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': 10,
    } as any,
  },
  {
    selector: 'node.inactive',
    style: {
      'background-color': '#ccc',
    } as any,
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#aaa',
      'curve-style': 'straight',
      label: 'data(emoji)',
      'font-size': 14,
      'text-rotation': 'autorotate',
      'text-margin-y': -10,
      'text-background-opacity': 0,
    } as any,
  },
  {
    selector: 'edge[type="friend"]',
    style: {
      'line-color': 'green',
      'text-fill': 'green',
      'text-background-opacity': 0,
    } as any,
  },
  {
    selector: 'edge[type="enemy"]',
    style: {
      'line-color': 'red',
      'text-fill': 'red',
      'text-background-opacity': 0,
    } as any,
  },
];

const NodeMap: React.FC = () => {
  const [elements, setElements] = useState<ElementDefinition[]>([]);
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

  useEffect(() => {
    const loadGraph = async () => {
      const [
        { data: people, error: pErr },
        { data: friends, error: fErr },
        { data: enemies, error: eErr },
      ] = await Promise.all([
        supabase
          .from<'people', PersonRow>('people')
          .select('id, name, isActive, pictureURL, bio'),
        supabase
          .from<'friends', FriendRow>('friends')
          .select('friend_1, friend_2, emoji, context'),
        supabase
          .from<'enemies', EnemyRow>('enemies')
          .select('enemy_1, enemy_2, emoji, context'),
      ]);

      if (pErr || fErr || eErr) {
        console.error(pErr || fErr || eErr);
        return;
      }

      const nodes = (people || []).map(p => ({
        data: {
          id: String(p.id),
          label: p.name,
          pictureURL: p.pictureURL || undefined,
          bio: p.bio || undefined,
        },
        classes: p.isActive ? '' : 'inactive',
      }));

      const friendEdges = (friends || []).map((f, i) => ({
        data: {
          id: `fr${i}`,
          source: String(f.friend_1),
          target: String(f.friend_2),
          type: 'friend',
          emoji: f.emoji ?? '',
          context: f.context ?? '',
        },
      }));

      const enemyEdges = (enemies || []).map((e, i) => ({
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
    };

    loadGraph();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: defaultStyle,
      layout: { name: 'cose', animate: true, fit: true },
    });

    cyRef.current.on('tap', 'node', evt => {
      const d = (evt.target as any).data() as NodeData;
      setSelectedNode(d);
    });

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

    return () => {
      cyRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (!cyRef.current || elements.length === 0) return;
    cyRef.current.json({ elements });
    cyRef.current.layout({ name: 'cose', animate: true, fit: true }).run();
  }, [elements]);

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: '60%', height: '100vh', backgroundColor: '#f0f0f0' }}
      />

      {selectedNode && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setSelectedNode(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              maxWidth: 400,
              maxHeight: '80%',
              overflowY: 'auto',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{selectedNode.label}</h3>
            {selectedNode.pictureURL && (
              <img
                src={selectedNode.pictureURL}
                alt={selectedNode.label}
                style={{ width: '100%', borderRadius: 4, marginBottom: 12 }}
              />
            )}
            <p className="text-black">{selectedNode.bio}</p>
            <button onClick={() => setSelectedNode(null)} style={{ marginTop: 12 }}>
              Close
            </button>
          </div>
        </div>
      )}

      {selectedEdge && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setSelectedEdge(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: 20,
              borderRadius: 8,
              maxWidth: 400,
              maxHeight: '80%',
              overflowY: 'auto',
              color: 'black',
            }}
            onClick={e => e.stopPropagation()}
          >
            <p style={{ fontSize: '2rem', margin: '0.5em 0' }}>
              {selectedEdge.emoji}
            </p>
            <p style={{ marginBottom: '1em' }}>
              {selectedEdge.context}
            </p>
            <button onClick={() => setSelectedEdge(null)} style={{ marginTop: 12 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default NodeMap;
