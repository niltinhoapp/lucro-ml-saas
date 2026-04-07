import { logoutAction } from "./actions";

export default function Page() {
  return (
    <form action={logoutAction} className="p-6">
      <button className="rounded-lg bg-black text-white px-4 py-2">
        Sair
      </button>
    </form>
  );
}









