import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { BrainProvider } from "../components/BrainContext";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
 
  return  <BrainProvider> <Welcome /> </BrainProvider>;
}
