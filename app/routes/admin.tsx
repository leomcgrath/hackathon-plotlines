import type { Route } from "./+types/home";
import { NavLink, useNavigate } from "react-router";
import AdminPanel from "~/components/ButtonWithIcon/AdminPanel";
import PeopleCards from "~/components/ButtonWithIcon/PeopleCards";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Denne tittelen vises i fanen" }];
}

export default function Home() {
  let navigate = useNavigate();

  return (
    <>
      <div className="width-full h-screen bg-white flex flex-row items-center justify-center">
        <AdminPanel/>
        <PeopleCards/>
      </div>
    </>
  );
}
