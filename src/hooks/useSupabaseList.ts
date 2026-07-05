import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ListOptions = {
  order?: { column: string; ascending?: boolean };
};

/**
 * Generic Supabase list hook with realtime updates + CRUD helpers.
 * Uses `any` because it's a table-agnostic CRUD hook; each caller
 * narrows the row type via generic parameter.
 */
export function useSupabaseList<T extends { id: string }>(
  table: string,
  options: ListOptions = {},
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q = (supabase.from(table as any) as any).select("*");
    if (options.order) {
      q = q.order(options.order.column, { ascending: options.order.ascending ?? true });
    }
    const { data, error: err } = await q;
    if (err) {
      setError(err.message);
      setRows([]);
    } else {
      setRows((data ?? []) as T[]);
    }
    setLoading(false);
  }, [table, options.order?.column, options.order?.ascending]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          fetchAll();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, fetchAll]);

  const create = useCallback(
    async (payload: Partial<T>) => {
      setSaving(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(table as any) as any)
        .insert(payload)
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error(`Erro ao salvar: ${error.message}`);
        throw error;
      }
      toast.success("Salvo com sucesso");
      return data as T;
    },
    [table],
  );

  const update = useCallback(
    async (id: string, payload: Partial<T>) => {
      setSaving(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from(table as any) as any)
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      setSaving(false);
      if (error) {
        toast.error(`Erro ao atualizar: ${error.message}`);
        throw error;
      }
      toast.success("Atualizado com sucesso");
      return data as T;
    },
    [table],
  );

  const remove = useCallback(
    async (id: string) => {
      setSaving(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from(table as any) as any).delete().eq("id", id);
      setSaving(false);
      if (error) {
        toast.error(`Erro ao excluir: ${error.message}`);
        throw error;
      }
      toast.success("Excluído com sucesso");
    },
    [table],
  );

  return { rows, loading, saving, error, refetch: fetchAll, create, update, remove };
}
