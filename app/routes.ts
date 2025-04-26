import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/paradisehotel.tsx"),
  route("/hjelp", "routes/help.tsx"),
  route("/more-info", "routes/more-info.tsx"),
  route("/admin", "routes/admin.tsx"),
  route("/home", "routes/home.tsx"),

] satisfies RouteConfig;
