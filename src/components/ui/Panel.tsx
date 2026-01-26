import type { ReactNode } from "react";
import "./Panel.css";

type Props = {
  title: string;
  children: ReactNode;
};

export default function Panel({ title, children }: Props) {
  return (
    <section className="panel">
      <h3 className="panelTitle">{title}</h3>
      <div className="panelBody">{children}</div>
    </section>
  );
}
