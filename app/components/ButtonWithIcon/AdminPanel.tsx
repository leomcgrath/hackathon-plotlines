import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from "react-router";


// Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Person = { id: number; name: string; pictureURL: string | null; bio: string | null; };
type FriendConn = { friend_1: number; friend_2: number; emoji: string | null; context: string | null; episode: number; imageURL: string | null; };
type PairConn = { pair_1: number; pair_2: number; episode: number; };

const AdminPanel: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [friends, setFriends] = useState<FriendConn[]>([]);
  const [pairs, setPairs] = useState<PairConn[]>([]);

  // Person form state
  const [newName, setNewName] = useState('');
  const [newPictureURL, setNewPictureURL] = useState('');
  const [newBio, setNewBio] = useState('');

  // Friend form state
  const [firstFriend, setFirstFriend] = useState<number | ''>('');
  const [secondFriend, setSecondFriend] = useState<number | ''>('');
  const [friendEmoji, setFriendEmoji] = useState('');
  const [friendContext, setFriendContext] = useState('');
  const [friendImageURL, setFriendImageURL] = useState('');
  const [friendEpisode, setFriendEpisode] = useState<number>(1);

  // Pair form state
  const [firstPair, setFirstPair] = useState<number | ''>('');
  const [secondPair, setSecondPair] = useState<number | ''>('');
  const [pairEpisode, setPairEpisode] = useState<number>(1);

  // Load data on mount
  useEffect(() => {
    (async () => {
      const [pplRes, frRes, prRes] = await Promise.all([
        supabase.from('people').select('id, name, pictureURL, bio').order('name'),
        supabase.from('friends').select('friend_1, friend_2, emoji, context, episode, imageURL'),
        supabase.from('pairs').select('pair_1, pair_2, episode'),
      ]);
      if (pplRes.data) setPeople(pplRes.data);
      if (frRes.data) setFriends(frRes.data);
      if (prRes.data) setPairs(prRes.data);
    })();
  }, []);

  // Add Person
  const addPerson = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase
      .from('people')
      .insert({ name: newName, pictureURL: newPictureURL || null, bio: newBio || null })
      .select('*')
      .single();
    if (error) console.error(error);
    else if (data) {
      setPeople(prev => [...prev, data]);
      setNewName(''); setNewPictureURL(''); setNewBio('');
    }
  };

  // Add Friend Event
  const addFriend = async () => {
    if (!firstFriend || !secondFriend || firstFriend === secondFriend) return;
    const { data, error } = await supabase
      .from('friends')
      .insert({ friend_1: firstFriend, friend_2: secondFriend, emoji: friendEmoji || null, context: friendContext || null, episode: friendEpisode, imageURL: friendImageURL || null })
      .select('*')
      .single();
    if (error) console.error(error);
    else if (data) {
      setFriends(prev => [...prev, data]);
      setFirstFriend(''); setSecondFriend(''); setFriendEmoji(''); setFriendContext(''); setFriendImageURL(''); setFriendEpisode(1);
    }
  };

  const removeFriend = async (f1: number, f2: number, episode: number) => {
    await supabase.from('friends').delete().match({ friend_1: f1, friend_2: f2, episode });
    setFriends(prev => prev.filter(f => !(f.friend_1 === f1 && f.friend_2 === f2 && f.episode === episode)));
  };

  // Add Pair
  const addPair = async () => {
    if (!firstPair || !secondPair || firstPair === secondPair) return;
    const { error } = await supabase
      .from('pairs')
      .insert({ pair_1: firstPair, pair_2: secondPair, episode: pairEpisode });
    if (error) console.error(error);
    else {
      setPairs(prev => [...prev, { pair_1: firstPair as number, pair_2: secondPair as number, episode: pairEpisode }]);
      setFirstPair(''); setSecondPair(''); setPairEpisode(1);
    }
  };

  const removePair = async (p1: number, p2: number, episode: number) => {
    await supabase.from('pairs').delete().match({ pair_1: p1, pair_2: p2, episode });
    setPairs(prev => prev.filter(p => !(p.pair_1 === p1 && p.pair_2 === p2 && p.episode === episode)));
  };

  const navigate = useNavigate();

  const goToAdmin = () => {
    navigate("/");
  };

  return (
    <div className="h-screen overflow-auto bg-gray-900 text-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <h1 className="text-4xl font-extrabold text-center">Admin Dashboard</h1>
        {/* Admin Button */}
      <button
        className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-full transition z-50"
        onClick={goToAdmin}
      >
        Tilbake
      </button>

        {/* People Section */}
        <section className="bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Manage People</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <input
              type="text"
              placeholder="Name"
              className="bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              type="text"
              placeholder="Picture URL"
              className="bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={newPictureURL}
              onChange={e => setNewPictureURL(e.target.value)}
            />
            <button
              onClick={addPerson}
              className="bg-blue-500 hover:bg-blue-400 transition px-4 py-2 rounded-lg"
            >Add Person</button>
            <textarea
              placeholder="Bio (optional)"
              className="col-span-full bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg px-3 py-2 border border-gray-600 h-24"
              value={newBio}
              onChange={e => setNewBio(e.target.value)}
            />
          </div>
        </section>

        {/* Friends Section */}
        <section className="bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Manage Events (Friends)</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
            <select
              className="bg-gray-700 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={firstFriend}
              onChange={e => setFirstFriend(Number(e.target.value))}
            >
              <option value="">First Person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="bg-gray-700 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={secondFriend}
              onChange={e => setSecondFriend(Number(e.target.value))}
            >
              <option value="">Second Person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="Emoji"
              className="bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={friendEmoji}
              onChange={e => setFriendEmoji(e.target.value)}
            />
            <select
              className="bg-gray-700 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={friendEpisode}
              onChange={e => setFriendEpisode(Number(e.target.value))}
            >
              {Array.from({ length: 17 }, (_, i) => <option key={i+1} value={i+1}>Ep {i+1}</option>)}
            </select>
            <button
              onClick={addFriend}
              className="md:col-span-2 bg-green-500 hover:bg-green-400 transition px-4 py-2 rounded-lg"
            >Add Event</button>
            <input
              type="text"
              placeholder="Context (optional)"
              className="col-span-full bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={friendContext}
              onChange={e => setFriendContext(e.target.value)}
            />
            <input
              type="text"
              placeholder="Image URL (optional)"
              className="col-span-full bg-gray-700 placeholder-gray-400 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={friendImageURL}
              onChange={e => setFriendImageURL(e.target.value)}
            />
          </div>
          <ul className="divide-y divide-gray-700">
            {friends.map(f => {
              const p1 = people.find(p => p.id === f.friend_1);
              const p2 = people.find(p => p.id === f.friend_2);
              return (
                <li key={`${f.friend_1}-${f.friend_2}-${f.episode}`} className="py-2 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {f.imageURL && <img src={f.imageURL} alt="Event" className="w-12 h-12 rounded-md object-cover" />}
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span>{p1?.name} → {p2?.name}</span>
                        <span className="text-green-300">[Ep {f.episode}]</span>
                        {f.emoji && <span>{f.emoji}</span>}
                      </div>
                      {f.context && <span className="italic text-gray-400">{f.context}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeFriend(f.friend_1, f.friend_2, f.episode)} className="text-red-400 hover:text-red-300">Remove</button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Pairs Section */}
        <section className="bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Manage Pairs</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end">
            <select
              className="bg-gray-700 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={firstPair}
              onChange={e => setFirstPair(Number(e.target.value))}
            >
              <option value="">First Person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="bg-gray-700 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={secondPair}
              onChange={e => setSecondPair(Number(e.target.value))}
            >
              <option value="">Second Person</option>
              {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select
              className="bg-gray-700 text-gray-100 rounded-lg px-3 py-2 border border-gray-600"
              value={pairEpisode}
              onChange={e => setPairEpisode(Number(e.target.value))}
            >
              {Array.from({ length: 17 }, (_, i) => <option key={i+1} value={i+1}>Ep {i+1}</option>)}
            </select>
            <button onClick={addPair} className="md:col-span-2 bg-purple-500 hover:bg-purple-400 transition px-4 py-2 rounded-lg">Add Pair</button>
          </div>
          <ul className="divide-y divide-gray-700">
            {pairs.map(p => {
              const a = people.find(pp => pp.id === p.pair_1);
              const b = people.find(pp => pp.id === p.pair_2);
              return (
                <li key={`{p.pair_1}-${p.pair_2}-${p.episode}`} className="py-2 flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    {a?.pictureURL && <img src={a.pictureURL} alt={a.name} className="w-12 h-12 rounded-md object-cover" />}
                    {b?.pictureURL && <img src={b.pictureURL} alt={b.name} className="w-12 h-12 rounded-md object-cover" />}
                    <div>
                      <span>{a?.name} 🤝 {b?.name} <span className="text-purple-300">[Ep {p.episode}]</span></span>
                    </div>
                  </div>
                  <button onClick={() => removePair(p.pair_1, p.pair_2, p.episode)} className="text-red-400 hover:text-red-300">Remove</button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminPanel;
