import { useEffect, useState } from "react";
import { Edit3, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import {
  adminCreateSupplementSubscription,
  adminDeleteSupplementSubscription,
  adminListCustomers,
  adminListMemberships,
  adminListProducts,
  adminListSupplementSubscriptions,
  adminUpdateSupplementSubscription,
  getErrorMessage,
} from "../../services/apiBackend/index.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { formatDate } from './adminFormatters.js'
import {
  AdminPageHeader,
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  Pagination,
} from "./AdminUi.jsx";
import { useTheme } from '../../context/ThemeContext.jsx'

function StatusBadgeSub({ status }) {
  const map = {
    active: "success",
    cancelled: "danger",
    paused: "warn",
    expired: "neutral",
    trialing: "info",
  };
  return <Badge tone={map[status] || "neutral"}>{status || "-"}</Badge>;
}

export default function AdminSubscriptionsPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [tab, setTab] = useState("supplements");
  const [toast, setToast] = useState("");
  const [reload, setReload] = useState(0);
  const [mItems, setMItems] = useState([]);
  const [mPage, setMPage] = useState(1);
  const [mTotal, setMTotal] = useState(1);
  const [mLoading, setMLoading] = useState(false);
  const [mError, setMError] = useState("");
  const [sItems, setSItems] = useState([]);
  const [sPage, setSPage] = useState(1);
  const [sTotal, setSTotal] = useState(1);
  const [sLoading, setSLoading] = useState(false);
  const [sError, setSError] = useState("");
  const [sQ, setSQ] = useState("");
  const [sSearch, setSSearch] = useState("");
  const [sStatus, setSStatus] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    userId: "",
    productId: "",
    productName: "",
    status: "active",
    frequency: "monthly",
    quantity: 1,
    nextDeliveryDate: "",
    startedAt: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (tab !== "memberships") return;
    let active = true;
    (async () => {
      setMError("");
      try {
        const d = await adminListMemberships({ page: mPage, pageSize: 20 });
        if (active) {
          setMItems(d.results);
          setMTotal(d.totalPages);
        }
      } catch (e) {
        if (active)
          setMError(getErrorMessage(e, "Failed to load memberships."));
      } finally {
        if (active) setMLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tab, mPage, reload]);

  useEffect(() => {
    if (tab !== "supplements") return;
    let active = true;
    (async () => {
      setSError("");
      try {
        const d = await adminListSupplementSubscriptions({
          q: sSearch,
          status: sStatus || undefined,
          page: sPage,
          pageSize: 20,
        });
        if (active) {
          setSItems(d.results);
          setSTotal(d.totalPages);
        }
      } catch (e) {
        if (active)
          setSError(
            getErrorMessage(e, "Failed to load supplement subscriptions."),
          );
      } finally {
        if (active) setSLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tab, sSearch, sStatus, sPage, reload]);

  async function openCreate() {
    setEditing(null);
    setFormError("");
    setForm({
      userId: "",
      productId: "",
      productName: "",
      status: "active",
      frequency: "monthly",
      quantity: 1,
      nextDeliveryDate: "",
      startedAt: "",
      notes: "",
    });
    setFormOpen(true);
    try {
      const [cust, prods] = await Promise.all([
        adminListCustomers({ pageSize: 100 }),
        adminListProducts({ page: 1, pageSize: 100 }),
      ]);
      setCustomers(cust.results || []);
      setProducts(prods.results || []);
    } catch (e) {
      setFormError(getErrorMessage(e, "Could not load customers/products."));
    }
  }

  function openEdit(s) {
    setEditing(s);
    setFormError("");
    setForm({
      userId: s.userId,
      productId: s.productId || "",
      productName: s.productName || "",
      status: s.status || "active",
      frequency: s.frequency || "monthly",
      quantity: s.quantity || 1,
      nextDeliveryDate: s.nextDeliveryDate || "",
      startedAt: s.startedAt || "",
      notes: s.notes || "",
    });
    setFormOpen(true);
  }

  async function submitForm(e) {
    e.preventDefault();
    setFormError("");
    if (!editing && !form.userId) {
      setFormError("Select a customer.");
      return;
    }
    if (!form.productId && !form.productName.trim()) {
      setFormError("Select a product or enter a product name.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        productId: form.productId || null,
        productName: form.productName.trim(),
        status: form.status,
        frequency: form.frequency,
        quantity: Number(form.quantity) || 1,
        nextDeliveryDate: form.nextDeliveryDate || null,
        startedAt: form.startedAt || null,
        notes: form.notes || "",
      };
      if (editing) {
        await adminUpdateSupplementSubscription(editing.id, payload);
        setToast("Subscription updated.");
      } else {
        await adminCreateSupplementSubscription({
          ...payload,
          userId: Number(form.userId),
        });
        setToast("Subscription created.");
      }
      setFormOpen(false);
      setReload((v) => v + 1);
    } catch (err) {
      setFormError(getErrorMessage(err, "Could not save subscription."));
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!confirmDel) return;
    try {
      await adminDeleteSupplementSubscription(confirmDel.id);
      setToast("Subscription cancelled/removed.");
      setConfirmDel(null);
      setReload((v) => v + 1);
    } catch (e) {
      setToast(getErrorMessage(e, "Could not remove subscription."));
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold"
          role="status"
        >
          {toast}
        </div>
      )}
      <AdminPageHeader
        eyebrow="Subscriptions"
        title="Subscriptions"
        description="Manage membership plans and admin-managed supplement subscription records in the database."
        actions={
          <button
            type="button"
            onClick={() => setReload((v) => v + 1)}
            className={`p-2.5 rounded-xl border transition-all duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98] hover:bg-[#222] hover:border-[#C6A36B]' : 'border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec]'}`} >
            <RefreshCw
              size={16}
              className={sLoading || mLoading ? "animate-spin" : ""}
            />
          </button>
        }
      />
      <div className="flex gap-2 border-b pb-2">
        {["supplements", "memberships"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={
              "px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 " +
              (tab === k
                ? `bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]`
                : `border text-[#20342d] hover:bg-[#f6f4ec]`)
            }
          >
            {k === "supplements"
              ? "Supplement subscriptions"
              : "Membership plans"}
          </button>
        ))}
      </div>
      {tab === "memberships" && (
        <div className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
          <div className="px-5 py-3 border-b text-xs text-[#718078] transition-colors duration-300">
            Membership records from database (managed here for visibility;
            billing provider flows may apply).
          </div>
          {mError && (
            <div className="p-4">
              <ErrorState
                message={mError}
                onRetry={() => setReload((v) => v + 1)}
              />
            </div>
          )}
          {mLoading ? (
            <LoadingState label="Loading memberships..." />
          ) : mItems.length === 0 ? (
            <EmptyState title="No memberships found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className={`text-left text-[#718078] border-b border-[#e5eae3] bg-[#fbfaf6] uppercase text-[10px] transition-colors duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98]' : ''}`}>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3">Plan</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f3ef] transition-colors duration-300">
                  {mItems.map((m) => (
                    <tr key={m.userId}>
                      <td className="py-3 px-4">
                        <div className={`font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
                          {m.userName}
                        </div>
                        <div className={`text-[#718078] transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : ''}`}>{m.userEmail}</div>
                      </td>
                      <td className="py-3 px-3">{m.planLabel || m.plan}</td>
                      <td className="py-3 px-3">
                        <StatusBadgeSub status={m.status} />
                      </td>
                      <td className="py-3 px-3 text-[#718078]">
                        {formatDate(m.updatedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination page={mPage} totalPages={mTotal} onPage={setMPage} />
        </div>
      )}
      {tab === "supplements" && (
        <>
          <div className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718078]"
                />
                <input
                  value={sQ}
                  onChange={(e) => setSQ(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setSPage(1);
                      setSSearch(sQ.trim());
                    }
                  }}
                  placeholder="Search customer/product..."
                  className={`pl-8 pr-3 py-2 rounded-xl border text-xs w-56 transition-colors duration-300 ${dark ? 'border-[#383027] text-[#F5EBDD] bg-[#1a1a1a]' : 'border-[#d6ded5] text-[#20342d] bg-white'}`} />
              </div>
              <select
                value={sStatus}
                onChange={(e) => {
                  setSPage(1);
                  setSStatus(e.target.value);
                }}
                className={`px-3 py-2 rounded-xl border text-xs transition-colors duration-300 ${dark ? 'border-[#383027] text-[#F5EBDD] bg-[#1a1a1a]' : 'border-[#d6ded5] text-[#20342d] bg-white'}`} >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
                <option value="trialing">Trialing</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  setSPage(1);
                  setSSearch(sQ.trim());
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300 ${dark ? 'bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]' : 'bg-[#173d32] text-white hover:bg-[#11241e]'}`} >
                Search
              </button>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-300"
            >
              <Plus size={14} /> Add subscription
            </button>
          </div>
          {sError && (
            <ErrorState
              message={sError}
              onRetry={() => setReload((v) => v + 1)}
            />
          )}
          <div className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
            {sLoading ? (
              <LoadingState label="Loading supplement subscriptions..." />
            ) : sItems.length === 0 ? (
              <EmptyState
                title="No supplement subscriptions"
                description="Add a subscription to link a customer to a supplement plan."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`text-left text-[#718078] border-b border-[#e5eae3] bg-[#fbfaf6] uppercase text-[10px] transition-colors duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98]' : ''}`}>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Freq</th>
                      <th className="py-3 px-3">Qty</th>
                      <th className="py-3 px-3">Next delivery</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f3ef] transition-colors duration-300">
                    {sItems.map((s) => (
                      <tr key={s.id}>
                        <td className="py-3 px-4">
                          <div className={`font-semibold transition-colors duration-300 ${dark ? 'text-white' : 'text-[#173d32]'}`}>
                            {s.userName}
                          </div>
                          <div className={`text-[#718078] transition-colors duration-300 ${dark ? 'text-[#B9AA98]' : ''}`}>{s.userEmail}</div>
                        </td>
                        <td className="py-3 px-3">
                          {s.productDisplayName || s.productName || "-"}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadgeSub status={s.status} />
                        </td>
                        <td className="py-3 px-3">
                          {s.frequencyLabel || s.frequency}
                        </td>
                        <td className="py-3 px-3">{s.quantity}</td>
                        <td className="py-3 px-3 text-[#718078]">
                          {s.nextDeliveryDate || "-"}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(s)}
                              className="p-1.5 rounded-lg border border-[#e2e7df] text-[#718078] hover:text-[#173d32] cursor-pointer" title="Edit">
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDel(s)}
                              className="p-1.5 rounded-lg border border-[#e2e7df] text-[#dc2626] hover:bg-[#fef2f2] cursor-pointer" title="Remove">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={sPage} totalPages={sTotal} onPage={setSPage} />
          </div>
        </>
      )}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-white rounded-2xl border shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#173d32]">
                {editing ? "Edit subscription" : "Add supplement subscription"}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 text-[#718078] hover:text-[#173d32] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitForm} className="p-6 space-y-4 text-xs">
              {!editing && (
                <label className="block">
                  <span className="font-semibold text-[#20342d]">
                    Customer *
                  </span>
                  <select
                    required
                    value={form.userId}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, userId: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-white">
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.email} ({c.email})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="font-semibold text-[#20342d]">
                    Product (catalog)
                  </span>
                  <select
                    value={form.productId}
                    onChange={(e) => {
                      const p = products.find(
                        (x) => String(x.id) === String(e.target.value),
                      );
                      setForm((f) => ({
                        ...f,
                        productId: e.target.value,
                        productName: p ? p.name : f.productName,
                      }));
                    }}
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-white">
                    <option value="">No product (custom)</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="font-semibold text-[#20342d]">
                    Product name (if custom)
                  </span>
                  <input
                    value={form.productName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, productName: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="font-semibold text-[#20342d]">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-white">
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="expired">Expired</option>
                    <option value="trialing">Trialing</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-semibold text-[#20342d]">
                    Frequency
                  </span>
                  <select
                    value={form.frequency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, frequency: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border bg-white">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Biweekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </label>
                <label className="block">
                  <span className="font-semibold text-[#20342d]">Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantity: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="font-semibold text-[#20342d]">
                    Next delivery date
                  </span>
                  <input
                    type="date"
                    value={form.nextDeliveryDate || ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        nextDeliveryDate: e.target.value,
                      }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border"
                  />
                </label>
                <label className="block">
                  <span className="font-semibold text-[#20342d]">
                    Started at
                  </span>
                  <input
                    type="date"
                    value={form.startedAt || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startedAt: e.target.value }))
                    }
                    className="mt-1 w-full px-3 py-2 rounded-xl border"
                  />
                </label>
              </div>
              <label className="block">
                <span className="font-semibold text-[#20342d]">
                  Notes
                </span>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="mt-1 w-full px-3 py-2 rounded-xl border"
                />
              </label>
              {formError && (
                <p className="text-[#dc2626]" role="alert">
                  {formError}
                </p>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all duration-300 ${dark ? 'bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]' : 'bg-[#173d32] text-white hover:bg-[#11241e]'}`}>
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        isOpen={Boolean(confirmDel)}
        title="Cancel/remove subscription"
        message={
          'Cancel or remove subscription for "' +
          (confirmDel?.userName || "this customer") +
          '"? This marks it cancelled in the database.'
        }
        confirmLabel="Confirm"
        isDanger
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  );
}
