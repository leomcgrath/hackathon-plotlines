export default function MoreInfo() {
  return (
    <div className="pt-16 p-4 container mx-auto">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Et tips dere må huske på:</h1>
      <ul className="list-disc list-inside space-y-2">
        <li className="text-lg">Når man legger til en ny route, så må man huske å legge de til i listen i <code>routes.ts</code>-filen.</li>
      </ul>
    </div>
  );
}
