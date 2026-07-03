import { createFileRoute, Link } from "@tanstack/react-router";
import Painel360 from "@/components/Painel360";
import { Scale, FolderOpen, Users, TrendingUp, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/visao-geral")({
  component: AdminVisaoGeralPage,
});

function AdminVisaoGeralPage() {
  return (
    <>
      <Painel360 />
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
        <Link to="/admin/crm" className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-700 text-white shadow-lg hover:bg-blue-800 transition text-sm">
          <TrendingUp className="w-4 h-4" /> CRM
        </Link>
        <Link to="/admin/financeiro" className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700 text-white shadow-lg hover:bg-emerald-800 transition text-sm">
          <CreditCard className="w-4 h-4" /> Financeiro
        </Link>
        <Link to="/admin/equipe" className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-700 text-white shadow-lg hover:bg-indigo-800 transition text-sm">
          <Users className="w-4 h-4" /> Equipe
        </Link>
        <Link to="/admin/biblioteca-midia" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#7A4A18] text-white shadow-lg hover:bg-[#2C1505] transition text-sm">
          <FolderOpen className="w-4 h-4" /> Biblioteca
        </Link>
        <Link to="/admin/juridico" className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2C1505] text-white shadow-lg hover:bg-[#7A4A18] transition text-sm">
          <Scale className="w-4 h-4" /> Jurídico
        </Link>
      </div>
    </>
  );
}
