import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Sprint() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Sprint Kanban</h1>
      <div className="grid grid-cols-4 gap-4">
        {/* Exemplo de coluna */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm">A Fazer</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Conteúdo do Kanban será carregado aqui...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
