"use client";

import { ReactNode } from "react";

export default function Header({ children }: { children?: ReactNode }) {
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow mb-4 rounded">
      <h1 className="text-xl font-bold text-blue-600">Lucro ML Dashboard</h1>
      <div>{children}</div>
    </header>
  );
}

