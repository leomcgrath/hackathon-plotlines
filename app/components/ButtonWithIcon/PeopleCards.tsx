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

  // fetch people and existing pairs
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

  // remove a pair connection
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

  // complete pairing when clicking another card
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

  // Start editing a person
  const startEditing = (person: Person) => {
    setEditingPerson(person);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPerson(null);
  };

  // Save edited person
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

    if (error) {
      console.error('Error saving person:', error);
    } else if (data) {
      setPeople(prev => prev.map(p => (p.id === data.id ? data : p)));
      setEditingPerson(null);
    }
  };

  return (
    <div className="p-6 h-[calc(100vh-100px)] overflow-auto text-black max-w-2xl mx-auto space-y-8 bg-white shadow-lg rounded-lg">
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
                {editingPerson?.id === person.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingPerson.name}
                      onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                      className="w-full p-2 border rounded"
                    />
                    <input
                      type="text"
                      value={editingPerson.pictureURL || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, pictureURL: e.target.value })}
                      placeholder="Picture URL"
                      className="w-full p-2 border rounded"
                    />
                    <textarea
                      value={editingPerson.bio || ''}
                      onChange={(e) => setEditingPerson({ ...editingPerson, bio: e.target.value })}
                      placeholder="Bio"
                      className="w-full p-2 border rounded"
                    />
                    <div className="space-x-2">
                      <input
                        type="number"
                        value={editingPerson.arrived}
                        onChange={(e) => setEditingPerson({ ...editingPerson, arrived: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded"
                        placeholder="Arrived"
                      />
                      <input
                        type="number"
                        value={editingPerson.deactivated || ''}
                        onChange={(e) => setEditingPerson({ ...editingPerson, deactivated: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded"
                        placeholder="Deactivated"
                      />
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={savePerson}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-red-500 text-white px-4 py-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={e => { e.stopPropagation(); removePerson(person.id); }}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>

                        <button
                          onClick={e => { e.stopPropagation(); startEditing(person); }}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      </div>
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
