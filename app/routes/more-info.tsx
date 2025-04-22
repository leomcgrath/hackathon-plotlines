import {useEffect, useState} from "react";

export default function MoreInfo() {
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await fetch("/api/tips");
        if (!response.ok) {
          throw new Error("Failed to fetch tips");
        }
        const data = await response.json();
        setTips(data.tips);
      } catch (error) {
        console.error("Error fetching tips:", error);
      }
    }
    fetchTips()
  }, [])

  return (
    <div className="pt-16 p-4 container mx-auto">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Et tips dere må huske på:</h1>
      <ul className="list-disc list-inside space-y-2">
        {tips.map((tip, index) => (
          <li className="text-lg" key={index}>
            {tip}
          </li>
        ))}
      </ul>
    </div>
  );
}
