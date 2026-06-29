import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
]);
