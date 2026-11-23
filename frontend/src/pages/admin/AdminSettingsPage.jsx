import { useEffect, useState } from "react";
import { RefreshCw, Save, User } from "lucide-react";
import {
  adminGetAdminProfile,
  adminGetStoreSettings,
  adminUpdateAdminProfile,
  adminUpdateStoreSettings,
  getErrorMessage,
} from "../../services/apiBackend/index.js";
import { AdminPageHeader, ErrorState, LoadingState } from "./AdminUi.jsx";
import { useTheme } from '../../context/ThemeContext.jsx'

export default function AdminSettingsPage() {
  const { theme } = useTheme()
  const dark = theme === 'dark'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [store, setStore] = useState(null);
  const [profile, setProfile] = useState(null);
  const [savingStore, setSavingStore] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toast, setToast] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [s, p] = await Promise.all([
          adminGetStoreSettings(),
          adminGetAdminProfile(),
        ]);
        if (active) {
          setStore(s);
          setProfile(p);
          setError("");
        }
      } catch (e) {
        if (active) setError(getErrorMessage(e, "Failed to load settings."));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  async function saveStore(e) {
    e.preventDefault();
    setSavingStore(true);
    try {
      const updated = await adminUpdateStoreSettings({
        store_name: store.store_name,
        support_email: store.support_email || "",
        support_phone: store.support_phone || "",
        currency: store.currency || "INR",
        low_stock_threshold: Number(store.low_stock_threshold) || 5,
        cod_enabled: Boolean(store.cod_enabled),
        online_payments_enabled: Boolean(store.online_payments_enabled),
        order_notifications_email: store.order_notifications_email || "",
        return_policy: store.return_policy || "",
      });
      setStore(updated);
      setToast("Store settings saved.");
    } catch (err) {
      setToast(getErrorMessage(err, "Could not save store settings."));
    } finally {
      setSavingStore(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await adminUpdateAdminProfile({
        name: profile.name || "",
        phone: profile.phone || "",
      });
      setProfile(updated);
      setToast("Profile updated.");
    } catch (err) {
      setToast(getErrorMessage(err, "Could not save profile."));
    } finally {
      setSavingProfile(false);
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
        eyebrow="Settings"
        title="Settings"
        description="Manage store configuration, support contacts, thresholds, and your admin profile."
        actions={
          <button
            type="button"
            onClick={() => setReload((v) => v + 1)}
            className={`p-2.5 rounded-xl border transition-all duration-300 ${dark ? 'bg-[#1a1a1a] border-[#383027] text-[#B9AA98] hover:bg-[#222] hover:border-[#C6A36B]' : 'border-[#d6ded5] text-[#718078] hover:text-[#173d32] hover:bg-[#f6f4ec]'}`} >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        }
      />
      {error && (
        <ErrorState message={error} onRetry={() => setReload((v) => v + 1)} />
      )}
      {loading && !store ? <LoadingState label="Loading settings…" /> : null}

      {store && profile && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form
            onSubmit={saveStore}
            className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
            <h2 className="text-sm font-bold text-[#173d32]">Store settings</h2>
            <label className="block text-xs">
              <span className="font-semibold text-[#20342d]">Store name</span>
              <input
                required
                value={store.store_name || ""}
                onChange={(e) =>
                  setStore((s) => ({ ...s, store_name: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-xl border"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs">
                <span className="font-semibold text-[#20342d]">
                  Support email
                </span>
                <input
                  type="email"
                  value={store.support_email || ""}
                  onChange={(e) =>
                    setStore((s) => ({ ...s, support_email: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border"
                />
              </label>
              <label className="block text-xs">
                <span className="font-semibold text-[#20342d]">
                  Support phone
                </span>
                <input
                  value={store.support_phone || ""}
                  onChange={(e) =>
                    setStore((s) => ({ ...s, support_phone: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs">
                <span className="font-semibold text-[#20342d]">Currency</span>
                <input
                  value={store.currency || "INR"}
                  onChange={(e) =>
                    setStore((s) => ({ ...s, currency: e.target.value }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border"
                />
              </label>
              <label className="block text-xs">
                <span className="font-semibold text-[#20342d]">
                  Low stock threshold
                </span>
                <input
                  type="number"
                  min="0"
                  value={store.low_stock_threshold ?? 5}
                  onChange={(e) =>
                    setStore((s) => ({
                      ...s,
                      low_stock_threshold: e.target.value,
                    }))
                  }
                  className="mt-1 w-full px-3 py-2 rounded-xl border"
                />
              </label>
            </div>
            <label className="block text-xs">
              <span className="font-semibold text-[#20342d]">
                Order notifications email
              </span>
              <input
                type="email"
                value={store.order_notifications_email || ""}
                onChange={(e) =>
                  setStore((s) => ({
                    ...s,
                    order_notifications_email: e.target.value,
                  }))
                }
                className="mt-1 w-full px-3 py-2 rounded-xl border"
              />
            </label>
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(store.cod_enabled)}
                  onChange={(e) =>
                    setStore((s) => ({ ...s, cod_enabled: e.target.checked }))
                  }
                />{" "}
                COD enabled
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(store.online_payments_enabled)}
                  onChange={(e) =>
                    setStore((s) => ({ ...s, online_payments_enabled: e.target.checked }))
                  }
                />{" "}
                Online payments enabled (display flag)
              </label>
            </div>
            <label className="block text-xs">
              <span className="font-semibold text-[#20342d]">
                Return policy notes
              </span>
              <textarea
                rows={3}
                value={store.return_policy || ""}
                onChange={(e) =>
                  setStore((s) => ({ ...s, return_policy: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-xl border"
              />
            </label>
            <button
              type="submit"
              disabled={savingStore}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all duration-300 ${dark ? 'bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]' : 'bg-[#173d32] text-white hover:bg-[#11241e]'}`}>
              <Save size={14} />{" "}
              {savingStore ? "Saving…" : "Save store settings"}
            </button>
          </form>

          <form
            onSubmit={saveProfile}
            className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-colors duration-300 ${dark ? 'bg-[#141414] border-[#383027]' : 'bg-white border-[#e5eae3]'}`}>
            <h2 className="text-sm font-bold text-[#173d32] flex items-center gap-2">
              <User size={16} /> Admin profile
            </h2>
            <div className="text-xs text-[#718078] space-y-1">
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Role:</strong> {profile.role || "admin"}
              </p>
              <p>
                <strong>Joined:</strong>{" "}
                {profile.date_joined
                  ? new Date(profile.date_joined).toLocaleString()
                  : "—"}
              </p>
              <p>
                <strong>Last login:</strong>{" "}
                {profile.last_login
                  ? new Date(profile.last_login).toLocaleString()
                  : "—"}
              </p>
            </div>
            <label className="block text-xs">
              <span className="font-semibold text-[#20342d]">Display name</span>
              <input
                value={profile.name || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-xl border"
              />
            </label>
            <label className="block text-xs">
              <span className="font-semibold text-[#20342d]">Phone</span>
              <input
                value={profile.phone || ""}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, phone: e.target.value }))
                }
                className="mt-1 w-full px-3 py-2 rounded-xl border"
              />
            </label>
            <button
              type="submit"
              disabled={savingProfile}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer transition-all duration-300 ${dark ? 'bg-[#C6A36B] text-[#080808] hover:bg-[#F0DDB7]' : 'bg-[#173d32] text-white hover:bg-[#11241e]'}`}>
              <Save size={14} /> {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
