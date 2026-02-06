"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      alert("Cadastro realizado com sucesso!");
      router.push("/dashboard");
    } else {
      alert("Preencha todos os campos");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">Cadastrar</h1>
      <form className="flex flex-col gap-4 w-80" onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          className="p-3 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Senha"
          className="p-3 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="p-3 bg-green-600 text-white rounded hover:bg-green-700">
          Cadastrar
        </button>
      </form>
    </div>
  );
}
