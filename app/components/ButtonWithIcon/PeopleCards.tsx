'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type Person = {
  id: number;
  name: string;
  isActive: boolean;
  pictureURL: string | null;
  bio: string | null;
};
type Pair = { friend_1: number; friend_2: number };

const PeopleCards: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [pairs, setPairs]   = useState<Pair[]>([]);
  const [pairing, setPairing] = useState<number | null>(null);

  // fetch people and existing pairs
  useEffect(() => {
    (async () => {
      const [
        { data: ppl,   error: pErr },
        { data: pr,    error: prErr }
      ] = await Promise.all([
        supabase
          .from('people')
          .select('id, name, isActive, pictureURL, bio')
          .order('name'),
        supabase
          .from('pairs')
          .select('friend_1, friend_2'),
      ]);

      if (pErr) console.error('people:', pErr);
      if (prErr) console.error('pairs:', prErr);
      if (ppl) setPeople(ppl);
      if (pr)  setPairs(pr);
    })();
  }, []);

  const toggleActive = async (id: number, next: boolean) => {
    await supabase.from('people').update({ isActive: next }).eq('id', id);
    setPeople(p => p.map(x => x.id === id ? { ...x, isActive: next } : x));
  };

  const removePerson = async (id: number) => {
    await supabase.from('people').delete().eq('id', id);
    setPeople(p => p.filter(x => x.id !== id));
    setPairs(pr => pr.filter(pair => pair.friend_1 !== id && pair.friend_2 !== id));
    if (pairing === id) setPairing(null);
  };

  // remove a pair connection
  const removePair = async (pairInfo: Pair) => {
    // delete by matching both columns (order-insensitive)
    await Promise.all([
      supabase.from('pairs').delete().match(pairInfo),
      supabase.from('pairs').delete().match({ friend_1: pairInfo.friend_2, friend_2: pairInfo.friend_1 }),
    ]);
    setPairs(pr => pr.filter(
      p => !(
        (p.friend_1 === pairInfo.friend_1 && p.friend_2 === pairInfo.friend_2) ||
        (p.friend_1 === pairInfo.friend_2 && p.friend_2 === pairInfo.friend_1)
      )
    ));
  };

  // start, cancel, or split pairing
  const onPairButton = async (personId: number) => {
    const pairInfo = pairs.find(
      pr => pr.friend_1 === personId || pr.friend_2 === personId
    );
    // if already paired and not in pairing mode, split them
    if (!pairing && pairInfo) {
      await removePair(pairInfo);
      return;
    }
    // if toggling pairing on this person
    if (pairing === personId) {
      setPairing(null);
    } else {
      setPairing(personId);
    }
  };

  // complete pairing when clicking another card
  const handleCardClick = async (id: number) => {
    if (!pairing) return;
    if (pairing === id) {
      setPairing(null);
      return;
    }
    // prevent pairing with someone already paired
    if (pairs.some(pr => pr.friend_1 === id || pr.friend_2 === id)) return;

    const { data, error } = await supabase
      .from('pairs')
      .insert({ friend_1: pairing, friend_2: id })
      .select()
      .single();

    if (error) console.error('Error pairing:', error);
    else if (data) setPairs(prev => [...prev, data]);
    setPairing(null);
  };

  return (
    <div className="p-6 h-[calc(100vh-100px)] overflow-auto text-black">
      {pairing && (
        <div className="mb-4 text-yellow-700">
          Pairing: {people.find(p => p.id === pairing)?.name}.&nbsp;
          Click another person to complete or click 'Cancel' to stop.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
        {people.map(person => {
          const isFirst = pairing === person.id;
          const pairInfo = pairs.find(
            pr => pr.friend_1 === person.id || pr.friend_2 === person.id
          );
          const otherId = pairInfo
            ? (pairInfo.friend_1 === person.id
                ? pairInfo.friend_2
                : pairInfo.friend_1)
            : null;
          const otherName = otherId
            ? people.find(p => p.id === otherId)?.name
            : null;

          const outlineClass = pairing && !pairInfo && !isFirst
            ? 'ring-2 ring-yellow-500'
            : '';

          return (
            <div
              key={person.id}
              onClick={() => handleCardClick(person.id)}
              className={`bg-white shadow-lg rounded-lg overflow-hidden flex flex-col cursor-pointer ${outlineClass}`}
            >
              {person.pictureURL ? (
                <img
                  src={person.pictureURL}
                  alt={person.name}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-xl font-semibold mb-2">{person.name}</h3>
                <p className="text-sm text-gray-600 flex-1 overflow-auto mb-2">
                  {person.bio || 'No bio available.'}
                </p>

                {!pairing && pairInfo && otherName && (
                  <p className="text-sm text-green-700 mb-2">
                    Paired up with: <strong>{otherName}</strong>
                  </p>
                )}

                <div className="flex items-center justify-between space-x-2">
                  <button
                    onClick={e => { e.stopPropagation(); onPairButton(person.id); }}
                    className={`px-3 py-1 rounded ${
                      pairInfo && !pairing
                        ? 'bg-red-500 text-white'
                        : isFirst
                        ? 'bg-yellow-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {pairInfo && !pairing
                      ? 'Unpair'
                      : isFirst
                      ? 'Cancel'
                      : 'Pair Up'}
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={e => { e.stopPropagation(); toggleActive(person.id, !person.isActive); }}
                      className={`px-3 py-1 rounded ${
                        person.isActive
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {person.isActive ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      onClick={e => { e.stopPropagation(); removePerson(person.id); }}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeopleCards;
