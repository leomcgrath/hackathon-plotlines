'use client';
import React, { useState, useRef, useEffect } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const supabase    = createClient(supabaseUrl, anonKey);

const defaultStyle = [
  // base node style
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
  // override for inactive nodes
  {
    selector: 'node.inactive',
    style: {
      'background-color': '#ccc',
    } as any,
  },
  // base edge style
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#aaa',
      'curve-style': 'straight',
    } as any,
  },
  // friend edges go green
  {
    selector: 'edge[type="friend"]',
    style: {
      'line-color': 'green',
    } as any,
  },
  // enemy edges go red
  {
    selector: 'edge[type="enemy"]',
    style: {
      'line-color': 'red',
    } as any,
  },
];

type PersonRow   = { id: number; name: string; isActive: boolean };
type FriendRow   = { friend_1: number; friend_2: number };
type EnemyRow    = { enemy_1: number;  enemy_2: number  };

const NodeMap: React.FC = () => {
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | undefined>(undefined);

  // 1) load people, friends & enemies
  useEffect(() => {
    const loadGraph = async () => {
      const [{ data: people, error: pErr },
             { data: friends, error: fErr },
             { data: enemies, error: eErr }] = await Promise.all([
        supabase.from<'people', PersonRow>('people').select('id, name, isActive'),
        supabase.from<'friends', FriendRow>('friends').select('friend_1, friend_2'),
        supabase.from<'enemies', EnemyRow>('enemies').select('enemy_1, enemy_2'),
      ]);

      if (pErr || fErr || eErr) {
        console.error(pErr || fErr || eErr);
        return;
      }

      // nodes: tag inactive ones with a class
      const nodes = (people || []).map(p => ({
        data: { id: String(p.id), label: p.name },
        classes: p.isActive ? '' : 'inactive',
      }));

      // edges: friend vs enemy
      const friendEdges = (friends || []).map((f, i) => ({
        data: {
          id: `fr${i}`,
          source: String(f.friend_1),
          target: String(f.friend_2),
          type: 'friend',
        },
      }));
      const enemyEdges = (enemies || []).map((e, i) => ({
        data: {
          id: `en${i}`,
          source: String(e.enemy_1),
          target: String(e.enemy_2),
          type: 'enemy',
        },
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
      layout: { name: 'random' },
    });
    return () => { cyRef.current?.destroy(); };
  }, []);

  // 3) push elements into Cytoscape
  useEffect(() => {
    if (!cyRef.current || elements.length === 0) return;
    cyRef.current.json({ elements });
    cyRef.current.layout({ name: 'random' }).run();
  }, [elements]);

  return (
    <div
      ref={containerRef}
        style={{ width: '60%', height: '100vh', backgroundColor: '#f0f0f0' }}
    />
  );
};

export default NodeMap;
