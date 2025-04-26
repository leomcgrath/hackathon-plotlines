'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Person     = { id: number; name: string; isActive: boolean; pictureURL: string | null; bio: string | null };
type FriendConn = { friend_1: number; friend_2: number; emoji: string | null; context: string | null; episode: number };
type EnemyConn  = { enemy_1: number; enemy_2: number; emoji: string | null; context: string | null };
type Room       = { id: number; name: string };

const AdminPanel: React.FC = () => {
  // Raw data
  const [people, setPeople]     = useState<Person[]>([]);
  const [friends, setFriends]   = useState<FriendConn[]>([]);
  const [enemies, setEnemies]   = useState<EnemyConn[]>([]);
  const [rooms, setRooms]       = useState<Room[]>([]);

  // Person form
  const [newName, setNewName]             = useState('');
  const [newPictureURL, setNewPictureURL] = useState('');
  const [newBio, setNewBio]               = useState('');

  // Friend form
  const [firstFriend, setFirstFriend]     = useState<number | ''>('');
  const [secondFriend, setSecondFriend]   = useState<number | ''>('');
  const [friendEmoji, setFriendEmoji]     = useState('');
  const [friendContext, setFriendContext] = useState('');
  const [friendEpisode, setFriendEpisode] = useState<number>(1);

  // Enemy form
  const [firstEnemy, setFirstEnemy]       = useState<number | ''>('');
  const [secondEnemy, setSecondEnemy]     = useState<number | ''>('');
  const [enemyEmoji, setEnemyEmoji]       = useState('');
  const [enemyContext, setEnemyContext]   = useState('');

  // Room form
  const [newRoomName, setNewRoomName]     = useState('');

  // Load data once
  useEffect(() => {
    (async () => {
      const [{ data: ppl, error: pErr },
             { data: fr,  error: fErr },
             { data: en,  error: eErr },
             { data: rms, error: rErr }] = await Promise.all([
        supabase.from('people').select<string, Person>('id, name, isActive, pictureURL, bio').order('name'),
        supabase.from('friends').select<string, FriendConn>('friend_1, friend_2, emoji, context, episode'),
        supabase.from('enemies').select<string, EnemyConn>('enemy_1, enemy_2, emoji, context'),
        supabase.from('rooms').select<string, Room>('id, name').order('name'),
      ]);

      if (pErr) console.error('people:', pErr);
      if (fErr) console.error('friends:', fErr);
      if (eErr) console.error('enemies:', eErr);
      if (rErr) console.error('rooms:', rErr);

      if (ppl) setPeople(ppl);
      if (fr)  setFriends(fr);
      if (en)  setEnemies(en);
      if (rms) setRooms(rms);
    })();
  }, []);

  // --- People CRUD ---
  const addPerson = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from('people')
      .insert({ name: newName, isActive: true, pictureURL: newPictureURL || null, bio: newBio || null })
      .select('id, name, isActive, pictureURL, bio')
      .single();
    if (error) console.error(error);
    else if (data) {
      setPeople(p => [...p, data]);
      setNewName(''); setNewPictureURL(''); setNewBio('');
    }
  };

  const removePerson = async (id: number) => {
    await supabase.from('people').delete().eq('id', id);
    setPeople(p => p.filter(x => x.id !== id));
    setFriends(f => f.filter(x => x.friend_1 !== id && x.friend_2 !== id));
    setEnemies(e => e.filter(x => x.enemy_1 !== id && x.enemy_2 !== id));
  };

  const toggleActive = async (id: number, next: boolean) => {
    await supabase.from('people').update({ isActive: next }).eq('id', id);
    setPeople(p => p.map(x => x.id === id ? { ...x, isActive: next } : x));
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
      setFriends(f => [...f, data]);
      setFirstFriend(''); setSecondFriend(''); setFriendEmoji(''); setFriendContext(''); setFriendEpisode(1);
    }
  };

  const removeFriend = async (f1: number, f2: number) => {
    await supabase.from('friends').delete().match({ friend_1: f1, friend_2: f2 });
    setFriends(f => f.filter(x => !(x.friend_1 === f1 && x.friend_2 === f2)));
  };

  // --- Enemies CRUD ---
  const addEnemy = async () => {
    if (!firstEnemy || !secondEnemy || firstEnemy === secondEnemy) return;
    const { data, error } = await supabase
      .from('enemies')
      .insert({ enemy_1: firstEnemy, enemy_2: secondEnemy, emoji: enemyEmoji || null, context: enemyContext || null })
      .select()
      .single();
    if (error) console.error(error);
    else if (data) {
      setEnemies(e => [...e, data]);
      setFirstEnemy(''); setSecondEnemy(''); setEnemyEmoji(''); setEnemyContext('');
    }
  };

  const removeEnemy = async (e1: number, e2: number) => {
    await supabase.from('enemies').delete().match({ enemy_1: e1, enemy_2: e2 });
    setEnemies(e => e.filter(x => !(x.enemy_1 === e1 && x.enemy_2 === e2)));
  };

  // --- Rooms CRUD (if needed) ---
  const addRoom = async () => {
    if (!newRoomName.trim()) return;
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: newRoomName })
      .select('id, name')
      .single();
    if (error) console.error(error);
    else if (data) {
      setRooms(r => [...r, data]);
      setNewRoomName('');
    }
  };

  const removeRoom = async (id: number) => {
    await supabase.from('rooms').delete().eq('id', id);
    setRooms(r => r.filter(x => x.id !== id));
  };

  return (
    <div className="p-6 h-[calc(100vh-100px)] overflow-auto w-1/2 mx-auto space-y-8 bg-white shadow-lg rounded-lg text-gray-800">
      {/* PEOPLE */}
      <h2 className="text-2xl font-bold">Manage People</h2>
      {/* ... existing inputs and list ... */}

      {/* FRIENDS */}
      <h2 className="text-2xl font-bold">Manage Friends</h2>
      <div className="flex flex-col gap-2">
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
          <button onClick={addFriend} className="bg-green-600 text-white px-4 py-1 rounded">Add Friend</button>
        </div>
      </div>
      <ul className="space-y-1">
        {friends.map(f => (
          <li key={`${f.friend_1}-${f.friend_2}-${f.episode}`} className="flex justify-between items-center">
            <span>{people.find(p => p.id === f.friend_1)?.name} → {people.find(p => p.id === f.friend_2)?.name} [Ep {f.episode}] {f.emoji && <strong>{f.emoji}</strong>} {f.context && <>({f.context})</>}</span>
            <button onClick={() => removeFriend(f.friend_1, f.friend_2)} className="text-red-600 hover:underline">Remove</button>
          </li>
        ))}
      </ul>

      {/* ENEMIES */}
      <h2 className="text-2xl font-bold">Manage Enemies</h2>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <select value={firstEnemy} onChange={e => setFirstEnemy(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value="" disabled>Select person</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span>→</span>
          <select value={secondEnemy} onChange={e => setSecondEnemy(Number(e.target.value))} className="border rounded px-2 py-1">
            <option value="" disabled>Select person</option>
            {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <input placeholder="Emoji" value={enemyEmoji} onChange={e => setEnemyEmoji(e.target.value)} className="border rounded px-2 py-1 w-24" />
          <input placeholder="Context" value={enemyContext} onChange={e => setEnemyContext(e.target.value)} className="border rounded px-2 py-1 flex-1" />
          <button onClick={addEnemy} className="bg-red-600 text-white px-4 py-1 rounded">Add Enemy</button>
        </div>
      </div>
      <ul className="space-y-1">
        {enemies.map(e => (
          <li key={`${e.enemy_1}-${e.enemy_2}`} className="flex justify-between items-center">
            <span>{people.find(p => p.id === e.enemy_1)?.name} → {people.find(p => p.id === e.enemy_2)?.name} {e.emoji && <strong>{e.emoji}</strong>} {e.context && <>({e.context})</>}</span>
            <button onClick={() => removeEnemy(e.enemy_1, e.enemy_2)} className="text-red-600 hover:underline">Remove</button>
          </li>
        ))}
      </ul>

      
    </div>
  );
};

export default AdminPanel;
