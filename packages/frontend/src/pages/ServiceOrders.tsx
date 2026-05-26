import { useCallback, useEffect, useState, type FormEvent } from "react";
import { companies, serviceOrders, type Company, type ServiceOrder } from "../lib/api";

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    PENDING: "Pendente",
    IN_PROGRESS: "Em andamento",
    COMPLETED: "Concluída",
    CANCELLED: "Cancelada",
  };
  return map[s] ?? s;
}

export default function ServiceOrders() {
  const [rows, setRows] = useState<ServiceOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filterCompany, setFilterCompany] = useState<number | "">("");
  const [companiesList, setCompaniesList] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState<number | null>(null);
  const [sending, setSending] = useState<number | null>(null);
  const [reminderOk, setReminderOk] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [fServiceName, setFServiceName] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fDueDate, setFDueDate] = useState("");
  const [fCompanyId, setFCompanyId] = useState<number | "">("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const [editId, setEditId] = useState<number | null>(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const load = useCallback(
    async (p = page, companyId = filterCompany) => {
      setLoading(true);
      setError("");
      try {
        const res = await serviceOrders.list({
          company_id: companyId || undefined,
          page: p,
        });
        setRows(res.rows);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.total_pages);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    },
    [page, filterCompany],
  );

  const loadCompanies = useCallback(async () => {
    try {
      const res = await companies.list(1);
      setCompaniesList(res.rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar empresas — recarregue a página");
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMarkIssued(id: number) {
    setMarking(id);
    setActionError("");
    try {
      await serviceOrders.markIssued(id);
      setRows((prev) =>
        prev.map((o) => (o.id === id ? { ...o, note_issued: true } : o)),
      );
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao marcar como emitida");
    } finally {
      setMarking(null);
    }
  }

  async function handleSendReminder(id: number) {
    setSending(id);
    setActionError("");
    try {
      await serviceOrders.sendReminder(id);
      setReminderOk(id);
      setTimeout(() => setReminderOk(null), 3000);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Erro ao enviar lembrete");
    } finally {
      setSending(null);
    }
  }

  function openEdit(order: ServiceOrder) {
    setEditId(order.id);
    setEditServiceName(order.service_name);
    setEditAmount(String(order.amount / 100));
    setEditDueDate(order.due_date.slice(0, 10));
    setEditError("");
  }

  function cancelEdit() {
    setEditId(null);
    setEditError("");
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setSaving(true);
    setEditError("");
    try {
      await serviceOrders.update(editId, {
        service_name: editServiceName,
        amount: Math.round(parseFloat(editAmount) * 100),
        due_date: new Date(editDueDate + "T12:00:00").toISOString(),
      });
      setEditId(null);
      load(page, filterCompany);
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!fCompanyId) return;
    setFormError("");
    setCreating(true);
    try {
      const amountCents = Math.round(parseFloat(fAmount) * 100);
      await serviceOrders.create({
        service_name: fServiceName,
        amount: amountCents,
        due_date: new Date(fDueDate + "T12:00:00").toISOString(),
        company_id: fCompanyId,
      });
      setFServiceName("");
      setFAmount("");
      setFDueDate("");
      setFCompanyId("");
      setShowForm(false);
      load(1, filterCompany);
      setPage(1);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Erro ao criar");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} ordem{total !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          disabled={!showForm && companiesList.length === 0}
          title={!showForm && companiesList.length === 0 ? "Cadastre uma empresa primeiro" : undefined}
          className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {showForm ? "Cancelar" : "Nova ordem"}
        </button>
      </div>

      {actionError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {actionError}
        </p>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-gray-700">Nova ordem de serviço</h2>
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Serviço *
              </label>
              <input
                required
                value={fServiceName}
                onChange={(e) => setFServiceName(e.target.value)}
                placeholder="Ex: PGDAS, Emissão NF"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Empresa *
              </label>
              <select
                required
                value={fCompanyId}
                onChange={(e) => setFCompanyId(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione…</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Valor (R$) *
              </label>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                value={fAmount}
                onChange={(e) => setFAmount(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Vencimento *
              </label>
              <input
                required
                type="date"
                value={fDueDate}
                onChange={(e) => setFDueDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-blue-600 text-white text-sm font-medium px-5 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {creating ? "Salvando…" : "Salvar"}
          </button>
        </form>
      )}

      <div className="mb-4">
        <select
          value={filterCompany}
          onChange={(e) => {
            setFilterCompany(e.target.value ? Number(e.target.value) : "");
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as empresas</option>
          {companiesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Carregando…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Nenhuma ordem encontrada.</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="space-y-2">
          {rows.map((order) =>
            editId === order.id ? (
              <form
                key={order.id}
                onSubmit={handleUpdate}
                className="bg-white border border-blue-300 rounded-xl px-5 py-4 space-y-3"
              >
                <h3 className="text-sm font-semibold text-gray-700">Editar ordem</h3>
                {editError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                    {editError}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Serviço</label>
                    <input
                      required
                      value={editServiceName}
                      onChange={(e) => setEditServiceName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vencimento</label>
                    <input
                      required
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Salvando…" : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-sm font-medium px-4 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={order.id}
                className={`bg-white border rounded-xl px-5 py-4 flex items-center justify-between gap-4 ${
                  order.note_issued ? "opacity-60 border-gray-100" : "border-gray-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-gray-900 truncate">
                      {order.service_name}
                    </span>
                    {order.note_issued && (
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                        Emitida
                      </span>
                    )}
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {statusLabel(order.service_status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Vence em {formatDate(order.due_date)} · {formatBRL(order.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!order.note_issued && (
                    <>
                      <button
                        onClick={() => openEdit(order)}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleSendReminder(order.id)}
                        disabled={sending === order.id}
                        className="text-sm font-medium px-3 py-1.5 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                      >
                        {sending === order.id
                          ? "…"
                          : reminderOk === order.id
                            ? "E-mail enviado!"
                            : "Lembrete"}
                      </button>
                      <button
                        onClick={() => handleMarkIssued(order.id)}
                        disabled={marking === order.id}
                        className="bg-green-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {marking === order.id ? "…" : "Emitida"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500 flex items-center px-2">
            Página {page} de {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= totalPages}
            className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
