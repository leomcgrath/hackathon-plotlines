'use client';
import React, { useState, useRef, useEffect } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase    = createClient(supabaseUrl, anonKey);

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
    } as any,
  },
  {
    selector: 'edge[type="friend"]',
    style: { 'line-color': 'green' } as any,
  },
  {
    selector: 'edge[type="enemy"]',
    style: { 'line-color': 'red' } as any,
  },
];

type PersonRow   = { id: number; name: string; isActive: boolean; pictureURL: string | null; bio: string | null };
type FriendRow   = { friend_1: number; friend_2: number };
type EnemyRow    = { enemy_1: number;  enemy_2: number  };

type NodeData    = { id: string; label: string; pictureURL?: string; bio?: string };

const NodeMap: React.FC = () => {
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | undefined>(undefined);

  // 1) load people, friends & enemies
  useEffect(() => {
    const loadGraph = async () => {
      const [{ data: people, error: pErr },
             { data: friends, error: fErr },
             { data: enemies, error: eErr }] = await Promise.all([
        supabase.from<'people', PersonRow>('people').select('id, name, isActive, pictureURL, bio'),
        supabase.from<'friends', FriendRow>('friends').select('friend_1, friend_2'),
        supabase.from<'enemies', EnemyRow>('enemies').select('enemy_1, enemy_2'),
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
        data: { id: `fr${i}`, source: String(f.friend_1), target: String(f.friend_2), type: 'friend' },
      }));
      const enemyEdges = (enemies || []).map((e, i) => ({
        data: { id: `en${i}`, source: String(e.enemy_1), target: String(e.enemy_2), type: 'enemy' },
      }));

      setElements([...nodes, ...friendEdges, ...enemyEdges]);
    };
    loadGraph();
  }, []);

  // 2) init cytoscape once
  useEffect(() => {
    if (!containerRef.current) return;
    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],
      style: defaultStyle,
      layout: { name: 'cose', animate: true, fit: true },
    });

    // show modal on node click
    cyRef.current.on('tap', 'node', evt => {
      const d = evt.target.data() as NodeData;
      setSelectedNode({ id: d.id, label: d.label, pictureURL: d.pictureURL, bio: d.bio });
    });

    return () => { cyRef.current?.destroy(); };
  }, []);

  // 3) push elements into Cytoscape
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
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setSelectedNode(null)}
        >
          <div
            style={{ background: '#fff', padding: 20, borderRadius: 8, maxWidth: 400, maxHeight: '80%', overflowY: 'auto' }}
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
    </>
  );
};

export default NodeMap;
