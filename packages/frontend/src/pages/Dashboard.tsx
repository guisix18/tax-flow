import { useCallback, useEffect, useState } from "react";
import { serviceOrders, type ServiceOrder } from "../lib/api";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function urgencyBadge(dueDate: string) {
  const diff = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 1)
    return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Hoje/Amanhã</span>;
  if (diff <= 3)
    return <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{diff}d</span>;
  return <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{diff}d</span>;
}

export default function Dashboard() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [days, setDays] = useState(7);
  const [marking, setMarking] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await serviceOrders.upcoming(days);
      setOrders(res.rows);
    } catch (e) {
      setOrders([]);
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  async function handleMarkIssued(id: number) {
    setMarking(id);
    setActionError("");
    try {
      await serviceOrders.markIssued(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao marcar como emitida");
    } finally {
      setMarking(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pendências</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Notas fiscais que vencem nos próximos{" "}
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="inline border border-gray-300 rounded px-1 text-sm"
            >
              {[7, 14, 30, 60, 90].map((d) => (
                <option key={d} value={d}>{d} dias</option>
              ))}
            </select>
          </p>
        </div>
      </div>

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {actionError}
        </p>
      )}

      {loading && <p className="text-sm text-gray-500">Carregando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && orders.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">✓</p>
          <p className="text-sm">Nenhuma pendência nos próximos {days} dias.</p>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 truncate">
                    {order.service_name}
                  </span>
                  {urgencyBadge(order.due_date)}
                </div>
                <p className="text-sm text-gray-500">
                  Vence em {formatDate(order.due_date)} · {formatBRL(order.amount)}
                </p>
              </div>
              <button
                onClick={() => handleMarkIssued(order.id)}
                disabled={marking === order.id}
                className="shrink-0 bg-green-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {marking === order.id ? "…" : "Emitida"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
