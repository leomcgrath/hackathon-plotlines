import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Hjelp!" }];
}

export default function Help() {
  return (
    <div className="pt-16 p-4 container mx-auto">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">Trenger du hjelp?</h1>
      <p>Vi coachene kan hjelpe deg med alt fra idemyldring og koding til spørsmål om meningen med livet (spesielt Sanne hjelper gjerne med sistnevnte 🥳)</p>
    </div>
  );
}
