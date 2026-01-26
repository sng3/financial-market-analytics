import type { ReactNode } from "react";
import NavBar from "../nav/NavBar";
import "./AppLayout.css";

type Props = { children: ReactNode };

export default function AppLayout({ children }: Props) {
  return (
    <div className="appShell">
      <NavBar />
      <main className="appMain">{children}</main>
    </div>
  );
}
