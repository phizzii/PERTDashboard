import { createBrowserRouter } from "react-router";
import Landing from "./pages/Landing";
import AIOptimisationPage from "./pages/AIOptimisationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/ai-optimisation",
    Component: AIOptimisationPage,
  },
]);
