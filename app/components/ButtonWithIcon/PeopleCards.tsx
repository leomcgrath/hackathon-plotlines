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

const PeopleCards: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('people')
        .select('id, name, isActive, pictureURL, bio')
        .order('name');
      if (error) {
        console.error('Error fetching people:', error);
      } else {
        setPeople(data || []);
      }
    })();
  }, []);

  const toggleActive = async (id: number, next: boolean) => {
    await supabase.from('people').update({ isActive: next }).eq('id', id);
    setPeople((p) =>
      p.map((x) => (x.id === id ? { ...x, isActive: next } : x))
    );
  };

  const removePerson = async (id: number) => {
    await supabase.from('people').delete().eq('id', id);
    setPeople((p) => p.filter((x) => x.id !== id));
  };

  return (
    <div className="p-6 h-[calc(100vh-100px)] overflow-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
        {people.map((person) => (
          <div
            key={person.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden flex flex-col"
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
              <p className="text-sm text-gray-600 flex-1 overflow-auto mb-4">
                {person.bio || 'No bio available.'}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    toggleActive(person.id, !person.isActive)
                  }
                  className={`px-3 py-1 rounded ${
                    person.isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-700'
                  }`}
                >
                  {person.isActive ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => removePerson(person.id)}
                  className="text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeopleCards;
