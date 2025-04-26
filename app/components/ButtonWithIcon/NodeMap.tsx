'use client';
import React, { useState, useRef, useEffect } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  throw new Error(
    'Missing env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY'
  );
}

const supabase = createClient(supabaseUrl, anonKey);


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
        selector: 'edge',
        style: {
            width: 2,
            'line-color': '#aaa',
            'curve-style': 'straight', // Changed bezier to straight for undirected look
            // Removed target-arrow-shape and target-arrow-color to make edges undirected
        } as any,
    },
];

const NodeMap: React.FC = () => {
  const [elements, setElements] = useState<ElementDefinition[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | undefined>(undefined);

  // 1) Fetch data once
  useEffect(() => {
    const loadGraph = async () => {
      const { data: people, error: peopleError } = 
        await supabase.from('people').select('id, name');
      const { data: friends, error: friendsError } = 
        await supabase.from('friends').select('friend_1, friend_2');

      if (peopleError || friendsError) {
        console.error(peopleError || friendsError);
        return;
      }

      const nodes = (people || []).map(p => ({
        data: { id: p.id.toString(), label: p.name },
      }));
      const edges = (friends || []).map((f, i) => ({
        data: {
          id: `e${i}`,
          source: f.friend_1.toString(),
          target: f.friend_2.toString(),
        },
      }));

      setElements([...nodes, ...edges]);
    };

    loadGraph();
  }, []);

  // 2) Initialize Cytoscape once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: [],           // start empty
      style: defaultStyle,
      layout: { name: 'grid' },
    });

    return () => {
      cyRef.current?.destroy();
    };
  }, []);

  // 3) Update elements when data arrives
  useEffect(() => {
    if (cyRef.current && elements.length) {
      cyRef.current.json({ elements });
      cyRef.current.layout({ name: 'grid' }).run();
    }
  }, [elements]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}
    />
  );
};

export default NodeMap;
