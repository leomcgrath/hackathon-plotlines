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
  pictureURL: string | null;
  bio: string | null;
  arrived: number;
  deactivated: number | null;
};

type Pair = { friend_1: number; friend_2: number };

const PeopleCards: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [pairing, setPairing] = useState<number | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  useEffect(() => {
    (async () => {
      const [
        { data: ppl, error: pErr },
        { data: pr, error: prErr }
      ] = await Promise.all([
        supabase
          .from('people')
          .select('id, name, pictureURL, bio, arrived, deactivated')
          .order('name'),
        supabase
          .from('pairs')
          .select('friend_1, friend_2'),
      ]);

      if (pErr) console.error('people:', pErr);
      if (prErr) console.error('pairs:', prErr);
      if (ppl) setPeople(ppl);
      if (pr) setPairs(pr);
    })();
  }, []);

  const removePerson = async (id: number) => {
    await supabase.from('people').delete().eq('id', id);
    setPeople(p => p.filter(x => x.id !== id));
    setPairs(pr => pr.filter(pair => pair.friend_1 !== id && pair.friend_2 !== id));
    if (pairing === id) setPairing(null);
  };

  const removePair = async (pairInfo: Pair) => {
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

  const onPairButton = async (personId: number) => {
    const pairInfo = pairs.find(
      pr => pr.friend_1 === personId || pr.friend_2 === personId
    );
    if (!pairing && pairInfo) {
      await removePair(pairInfo);
      return;
    }
    if (pairing === personId) {
      setPairing(null);
    } else {
      setPairing(personId);
    }
  };

  const handleCardClick = async (id: number) => {
    if (!pairing) return;
    if (pairing === id) {
      setPairing(null);
      return;
    }
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

  const startEditing = (person: Person) => setEditingPerson(person);
  const cancelEditing = () => setEditingPerson(null);

  const savePerson = async () => {
    if (!editingPerson) return;
    const { data, error } = await supabase
      .from('people')
      .update({
        name: editingPerson.name,
        bio: editingPerson.bio,
        pictureURL: editingPerson.pictureURL,
        arrived: editingPerson.arrived,
        deactivated: editingPerson.deactivated,
      })
      .eq('id', editingPerson.id)
      .select()
      .single();

    if (error) console.error('Error saving person:', error);
    else if (data) {
      setPeople(prev => prev.map(p => (p.id === data.id ? data : p)));
      setEditingPerson(null);
    }
  };

  return (
    <div className="h-screen overflow-auto bg-gray-900 text-gray-100 p-6 max-w-5xl mx-auto">
      {pairing && (
        <div className="mb-4 text-yellow-400">
          Pairing: <strong>{people.find(p => p.id === pairing)?.name}</strong>. Click another person to complete or hit Cancel.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {people.map(person => {
          const isSelected = pairing === person.id;
          const pairInfo = pairs.find(
            pr => pr.friend_1 === person.id || pr.friend_2 === person.id
          );
          const otherId = pairInfo
            ? pairInfo.friend_1 === person.id
              ? pairInfo.friend_2
              : pairInfo.friend_1
            : null;
          const otherName = otherId ? people.find(p => p.id === otherId)?.name : null;

          return (
            <div
              key={person.id}
              className={`bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer transition ${
                isSelected ? 'ring-4 ring-yellow-500' : ''
              }`}
              onClick={() => handleCardClick(person.id)}
            >
              {person.pictureURL ? (
                <img src={person.pictureURL} alt={person.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="h-48 w-full bg-gray-700 flex items-center justify-center">
                  <span className="text-gray-500">No Image</span>
                </div>
              )}

              <div className="p-4 flex-1 flex flex-col">
                {editingPerson?.id === person.id ? (
                  <div className="space-y-3">
                    <input
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                      type="text"
                      value={editingPerson.name}
                      onChange={e => setEditingPerson({ ...editingPerson, name: e.target.value })}
                    />
                    <input
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                      type="text"
                      placeholder="Picture URL"
                      value={editingPerson.pictureURL || ''}
                      onChange={e => setEditingPerson({ ...editingPerson, pictureURL: e.target.value })}
                    />
                    <textarea
                      className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                      placeholder="Bio"
                      value={editingPerson.bio || ''}
                      onChange={e => setEditingPerson({ ...editingPerson, bio: e.target.value })}
                    />
                    <div className="flex space-x-2">
                      <input
                        className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                        type="number"
                        placeholder="Arrived"
                        value={editingPerson.arrived}
                        onChange={e => setEditingPerson({ ...editingPerson, arrived: parseInt(e.target.value) })}
                      />
                      <input
                        className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                        type="number"
                        placeholder="Deactivated"
                        value={editingPerson.deactivated || ''}
                        onChange={e => setEditingPerson({ ...editingPerson, deactivated: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={savePerson}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-white px-4 py-2 rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-semibold mb-2">{person.name}</h3>
                    <p className="text-gray-300 flex-1 overflow-auto mb-3">
                      {person.bio || 'No bio available.'}
                    </p>

                    {!pairing && pairInfo && otherName && (
                      <p className="text-green-400 mb-3">
                        Paired with <strong>{otherName}</strong>
                      </p>
                    )}

                    <div className="mt-auto flex justify-between">
                      <div className="flex space-x-4">
                        <button
                          onClick={e => { e.stopPropagation(); removePerson(person.id); }}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); startEditing(person); }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); onPairButton(person.id); }}
                        className={`px-3 py-1 rounded-lg border text-sm font-medium ${
                          pairInfo || pairing === person.id
                            ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/20'
                            : 'border-gray-600 text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {pairInfo || pairing === person.id ? 'Unpair' : 'Pair'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PeopleCards;
