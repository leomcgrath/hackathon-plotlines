'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// --- Types ---
type Person = {
  id: number;
  name: string;
  pictureURL: string | null;
  bio: string | null;
};

type FriendConn = {
  friend_1: number;
  friend_2: number;
  emoji: string | null;
  context: string | null;
  episode: number;
};

type PairConn = {
  pair_1: number;
  pair_2: number;
  episode: number;
};

const AdminPanel: React.FC = () => {
  // --- State ---
  const [people, setPeople] = useState<Person[]>([]);
  const [friends, setFriends] = useState<FriendConn[]>([]);
  const [pairs, setPairs] = useState<PairConn[]>([]);

  // Person form
  const [newName, setNewName] = useState('');
  const [newPictureURL, setNewPictureURL] = useState('');
  const [newBio, setNewBio] = useState('');

  // Friend form
  const [firstFriend, setFirstFriend] = useState<number | ''>('');
  const [secondFriend, setSecondFriend] = useState<number | ''>('');
  const [friendEmoji, setFriendEmoji] = useState('');
  const [friendContext, setFriendContext] = useState('');
  const [friendEpisode, setFriendEpisode] = useState<number>(1);

  // Pair form
  const [firstPair, setFirstPair] = useState<number | ''>('');
  const [secondPair, setSecondPair] = useState<number | ''>('');
  const [pairEpisode, setPairEpisode] = useState<number>(1);

  // --- Load data once ---
  useEffect(() => {
    (async () => {
      const [
        { data: ppl, error: pplErr },
        { data: fr, error: frErr },
        { data: pr, error: prErr }
      ] = await Promise.all([
        supabase.from('people').select<string, Person>('id, name, pictureURL, bio').order('name'),
        supabase.from('friends').select<string, FriendConn>('friend_1, friend_2, emoji, context, episode'),
        supabase.from('pairs').select<string, PairConn>('pair_1, pair_2, episode')
      ]);

      if (pplErr) console.error('people:', pplErr);
      if (frErr) console.error('friends:', frErr);
      if (prErr) console.error('pairs:', prErr);

      if (ppl) setPeople(ppl);
      if (fr) setFriends(fr);
      if (pr) setPairs(pr);
    })();
  }, []);

  // --- People CRUD ---
  const addPerson = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from('people')
      .insert({ name: newName, pictureURL: newPictureURL || null, bio: newBio || null })
      .select('id, name, pictureURL, bio')
      .single();
    if (error) console.error(error);
    else if (data) {
      setPeople(prev => [...prev, data]);
      setNewName('');
      setNewPictureURL('');
      setNewBio('');
    }
  };

  // --- Friends CRUD ---
  const addFriend = async () => {
    if (!firstFriend || !secondFriend || firstFriend === secondFriend) return;
    const { data, error } = await supabase
      .from('friends')
      .insert({ friend_1: firstFriend, friend_2: secondFriend, emoji: friendEmoji || null, context: friendContext || null, episode: friendEpisode })
      .select()
      .single();
    if (error) console.error(error);
    else if (data) {
      setFriends(prev => [...prev, data]);
      setFirstFriend('');
      setSecondFriend('');
      setFriendEmoji('');
      setFriendContext('');
      setFriendEpisode(1);
    }
  };

  const removeFriend = async (f1: number, f2: number, episode: number) => {
    await supabase.from('friends').delete().match({ friend_1: f1, friend_2: f2, episode });
    setFriends(prev => prev.filter(f => !(f.friend_1 === f1 && f.friend_2 === f2 && f.episode === episode)));
  };

  // --- Pairs CRUD ---
  const addPair = async () => {
    if (!firstPair || !secondPair || firstPair === secondPair) return;
    const { error } = await supabase
      .from('pairs')
      .insert({ pair_1: firstPair, pair_2: secondPair, episode: pairEpisode });
      
    if (error) console.error(error);
    else {
      setPairs(prev => [...prev, { pair_1: Number(firstPair), pair_2: Number(secondPair), episode: pairEpisode }]);
      setFirstPair('');
      setSecondPair('');
      setPairEpisode(1);
    }
  };

  const removePair = async (p1: number, p2: number, episode: number) => {
    await supabase.from('pairs').delete().match({ pair_1: p1, pair_2: p2, episode });
    setPairs(prev => prev.filter(p => !(p.pair_1 === p1 && p.pair_2 === p2 && p.episode === episode)));
  };

  // --- UI ---
  return (
    <div className="p-6 h-[calc(100vh-100px)] overflow-auto w-full max-w-3xl mx-auto space-y-10 bg-white shadow-lg rounded-lg text-gray-800">
      {/* PEOPLE */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Manage People</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="border rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            value={newPictureURL}
            onChange={(e) => setNewPictureURL(e.target.value)}
            placeholder="Picture URL"
            className="border rounded px-2 py-1 flex-1"
          />
        </div>
        <textarea
          value={newBio}
          onChange={(e) => setNewBio(e.target.value)}
          placeholder="Bio"
          className="border rounded px-2 py-1 w-full h-24 mb-2"
        />
        <button onClick={addPerson} className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Person
        </button>
      </section>

      {/* FRIENDS */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Manage Events (Friends)</h2>
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex gap-2 items-center">
            <select value={firstFriend} onChange={e => setFirstFriend(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value="" disabled>Select person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span>→</span>
            <select value={secondFriend} onChange={e => setSecondFriend(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value="" disabled>Select person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <input placeholder="Emoji" value={friendEmoji} onChange={e => setFriendEmoji(e.target.value)} className="border rounded px-2 py-1 w-24" />
            <input placeholder="Context" value={friendContext} onChange={e => setFriendContext(e.target.value)} className="border rounded px-2 py-1 flex-1" />
            <select value={friendEpisode} onChange={e => setFriendEpisode(Number(e.target.value))} className="border rounded px-2 py-1 w-24">
              {Array.from({ length: 10 }, (_, i) => <option key={i+1} value={i+1}>Ep {i+1}</option>)}
            </select>
            <button onClick={addFriend} className="bg-green-600 text-white px-4 py-1 rounded">Add Event</button>
          </div>
        </div>

        <ul className="space-y-1">
          {friends.map(f => (
            <li key={`${f.friend_1}-${f.friend_2}-${f.episode}`} className="flex justify-between items-center">
              <span>{people.find(p => p.id === f.friend_1)?.name} → {people.find(p => p.id === f.friend_2)?.name} [Ep {f.episode}] {f.emoji && <strong>{f.emoji}</strong>} {f.context && <>({f.context})</>}</span>
              <button onClick={() => removeFriend(f.friend_1, f.friend_2, f.episode)} className="text-red-600 hover:underline">Remove</button>
            </li>
          ))}
        </ul>
      </section>

      {/* PAIRS */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Manage Pairs</h2>
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex gap-2 items-center">
            <select value={firstPair} onChange={e => setFirstPair(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value="" disabled>Select person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span>🤝</span>
            <select value={secondPair} onChange={e => setSecondPair(Number(e.target.value))} className="border rounded px-2 py-1">
              <option value="" disabled>Select person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <select value={pairEpisode} onChange={e => setPairEpisode(Number(e.target.value))} className="border rounded px-2 py-1 w-24">
              {Array.from({ length: 17 }, (_, i) => <option key={i+1} value={i+1}>Ep {i+1}</option>)}
            </select>
            <button onClick={addPair} className="bg-purple-600 text-white px-4 py-1 rounded">Add Pair</button>
          </div>
        </div>

        <ul className="space-y-1">
          {pairs.map(p => (
            <li key={`${p.pair_1}-${p.pair_2}-${p.episode}`} className="flex justify-between items-center">
              <span>{people.find(pp => pp.id === p.pair_1)?.name} 🤝 {people.find(pp => pp.id === p.pair_2)?.name} [Ep {p.episode}]</span>
              <button onClick={() => removePair(p.pair_1, p.pair_2, p.episode)} className="text-red-600 hover:underline">Remove</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminPanel;
