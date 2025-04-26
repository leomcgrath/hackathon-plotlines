import type { Route } from "./+types/home";
import { NavLink, useNavigate } from "react-router";
import NodeMap from "~/components/ButtonWithIcon/NodeMap";
import AdminPanel from "~/components/ButtonWithIcon/AdminPanel";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Denne tittelen vises i fanen" }];
}

export default function Home() {
  let navigate = useNavigate();

  return (
    <>
      <div className="width-full h-screen bg-white flex flex-row items-center justify-center">
        <NodeMap/>
        <AdminPanel/>
      </div>
    </>
  );
}
