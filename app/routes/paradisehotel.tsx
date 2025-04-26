import React from "react";
import { useNavigate } from "react-router";

export default function ParadiseHotel() {
  const navigate = useNavigate();

  const handleNavigation = () => {
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Toppbilde */}
      <div className="relative w-full h-[70vh] overflow-hidden">
        <img
          src="/assets/paradise25.jpg"
          alt="Paradise Hotel"
          className="object-cover object-top w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
      </div>

      {/* Innhold */}
      <div className="flex flex-col md:flex-row max-w-7xl mx-auto px-6 py-10 gap-8">
        {/* Venstre side */}
        <div className="flex-1">
          <h1 className="text-6xl font-bold mb-4">Paradise Hotel</h1>

          <div className="flex items-center gap-4 mb-6 text-gray-400">
            <span>Reality</span> | <span>2025</span> | <span>15 år</span>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <button className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-full transition">
              Sesong 17 - Episode 1
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white text-2xl w-12 h-12 flex items-center justify-center rounded-full transition">
              +
            </button>
            <button className="bg-gray-700 hover:bg-gray-600 text-white text-2xl w-12 h-12 flex items-center justify-center rounded-full transition">
              👍
            </button>
          </div>

          <p className="text-gray-300">
            Triana Iglesias har fått med seg tidligere vinner Martine Lunde i
            sesong 17 av Paradise Hotel. Se opp for dramatikk, kjærlighet og
            elleville twister!
          </p>
        </div>

        {/* Høyre side - Card */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center max-w-sm mx-auto">
          <p className="text-center mb-4">
            Hold oversikt over all kjærlighet, kaos og konspirasjon.
          </p>
          <img
            src="/assets/noder.png"
            alt="Plotlines"
            className="w-32 h-32 mx-auto mb-4 rounded-2xl shadow-lg"
          />
          <button
            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-full transition"
            onClick={handleNavigation}
          >
            Plotlines
          </button>
        </div>
      </div>
    </div>
  );
}
