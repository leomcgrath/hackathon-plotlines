'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Person     = { id: number; name: string; isActive: boolean };
type FriendConn = { friend_1: number; friend_2: number };
type EnemyConn  = { enemy_1: number;  enemy_2: number  };

const AdminPanel: React.FC = () => {
  const [people, setPeople]     = useState<Person[]>([]);
  const [friends, setFriends]   = useState<FriendConn[]>([]);
  const [enemies, setEnemies]   = useState<EnemyConn[]>([]);

  const [newName, setNewName]           = useState('');
  const [firstFriend, setFirstFriend]   = useState<number | ''>('');
  const [secondFriend, setSecondFriend] = useState<number | ''>('');
  const [firstEnemy, setFirstEnemy]     = useState<number | ''>('');
  const [secondEnemy, setSecondEnemy]   = useState<number | ''>('');

  // --- initial fetch ---
  useEffect(() => {
    (async () => {
      const [{ data: ppl,    error: pErr },
             { data: fr,     error: fErr },
             { data: en,     error: eErr }] = await Promise.all([
        supabase.from('people').select('id, name, isActive').order('name'),
        supabase.from('friends').select('friend_1, friend_2'),
        supabase.from('enemies').select('enemy_1, enemy_2'),
      ]);

      if (pErr)  console.error('people:', pErr);
      if (fErr)  console.error('friends:', fErr);
      if (eErr)  console.error('enemies:', eErr);

      if (ppl)  setPeople(ppl);
      if (fr)   setFriends(fr);
      if (en)   setEnemies(en);
    })();
  }, []);

  // --- people CRUD + toggle active ---
  const addPerson = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from('people')
      .insert({ name: newName, isActive: true })
      .select('id, name, isActive')
      .single();
    if (error) console.error(error);
    else {
      setPeople(p => [...p, data]);
      setNewName('');
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

  // --- friends ---
  const addFriend = async () => {
    if (
      firstFriend === '' ||
      secondFriend === '' ||
      firstFriend === secondFriend
    ) return;

    const { data, error } = await supabase
      .from('friends')
      .insert({ friend_1: firstFriend, friend_2: secondFriend })
      .select(); // returns [{ friend_1, friend_2 }]
    if (error) console.error(error);
    else if (data?.[0]) {
      setFriends(f => [...f, data[0]]);
      setFirstFriend('');
      setSecondFriend('');
    }
  };

  const removeFriend = async (f1: number, f2: number) => {
    await supabase
      .from('friends')
      .delete()
      .match({ friend_1: f1, friend_2: f2 });
    setFriends(f => f.filter(x => !(x.friend_1 === f1 && x.friend_2 === f2)));
  };

  // --- enemies ---
  const addEnemy = async () => {
    if (
      firstEnemy === '' ||
      secondEnemy === '' ||
      firstEnemy === secondEnemy
    ) return;

    const { data, error } = await supabase
      .from('enemies')
      .insert({ enemy_1: firstEnemy, enemy_2: secondEnemy })
      .select();
    if (error) console.error(error);
    else if (data?.[0]) {
      setEnemies(e => [...e, data[0]]);
      setFirstEnemy('');
      setSecondEnemy('');
    }
  };

  const removeEnemy = async (e1: number, e2: number) => {
    await supabase
      .from('enemies')
      .delete()
      .match({ enemy_1: e1, enemy_2: e2 });
    setEnemies(e => e.filter(x => !(x.enemy_1 === e1 && x.enemy_2 === e2)));
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 bg-white shadow-lg rounded-lg text-gray-800">
      {/* PEOPLE */}
      <h2 className="text-2xl font-bold">Manage People</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New person name"
          className="border rounded px-2 py-1 flex-grow"
        />
        <button
          onClick={addPerson}
          className="bg-blue-600 text-white px-4 py-1 rounded"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {people.map(p => (
          <li
            key={p.id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <span>{p.name}</span>
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={p.isActive}
                  onChange={() => toggleActive(p.id, !p.isActive)}
                />
                <span className="text-sm">
                  {p.isActive ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
            <button
              onClick={() => removePerson(p.id)}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* FRIENDS */}
      <h2 className="text-2xl font-bold">Manage Friends</h2>
      <div className="flex gap-2 items-center">
        <select
          value={firstFriend}
          onChange={e => setFirstFriend(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>
            Select person
          </option>
          {people.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span>→</span>
        <select
          value={secondFriend}
          onChange={e => setSecondFriend(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>
            Select person
          </option>
          {people.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={addFriend}
          className="bg-green-600 text-white px-4 py-1 rounded"
        >
          Add Friend
        </button>
      </div>
      <ul className="space-y-1">
        {friends.map(f => (
          <li
            key={`${f.friend_1}-${f.friend_2}`}
            className="flex justify-between items-center"
          >
            <span>
              {people.find(p => p.id === f.friend_1)?.name} →{' '}
              {people.find(p => p.id === f.friend_2)?.name}
            </span>
            <button
              onClick={() => removeFriend(f.friend_1, f.friend_2)}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      {/* ENEMIES */}
      <h2 className="text-2xl font-bold">Manage Enemies</h2>
      <div className="flex gap-2 items-center">
        <select
          value={firstEnemy}
          onChange={e => setFirstEnemy(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>
            Select person
          </option>
          {people.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span>→</span>
        <select
          value={secondEnemy}
          onChange={e => setSecondEnemy(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>
            Select person
          </option>
          {people.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={addEnemy}
          className="bg-red-600 text-white px-4 py-1 rounded"
        >
          Add Enemy
        </button>
      </div>
      <ul className="space-y-1">
        {enemies.map(e => (
          <li
            key={`${e.enemy_1}-${e.enemy_2}`}
            className="flex justify-between items-center"
          >
            <span>
              {people.find(p => p.id === e.enemy_1)?.name} →{' '}
              {people.find(p => p.id === e.enemy_2)?.name}
            </span>
            <button
              onClick={() => removeEnemy(e.enemy_1, e.enemy_2)}
              className="text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminPanel;
