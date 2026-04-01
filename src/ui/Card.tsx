// src/components/Card.tsx
export default function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
