import { useCallback, useEffect, useState } from "react";
import { Bike, Check, ExternalLink, FileText, Search, X } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, PillBadge } from "../../../components/dashboard/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import DetailDrawer from "../components/DetailDrawer";
import { ErrorBanner, LoadingRows } from "../components/States";
import { capitalize, formatDate, formatDateTime, orderStatusLabel, RIDER_STATUS_TONE } from "./utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
];

const ACCOUNT_LABEL = { approved: "Active", pending: "Pending", suspended: "Suspended", rejected: "Rejected" };

const formatDob = (d) => {
  if (!d) return "\u2014";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${day} ${months[Number(m) - 1] || m} ${y}`;
};

const MotorizedVehicle = ["motorcycle", "scooter"];

const riderState = (r) => {
  if (r.status !== "approved") return null;
  if (r.is_delivering) return { label: "Delivering", tone: "orange" };
  if (r.is_online) return { label: "Available", tone: "green" };
  return { label: "Offline", tone: "zinc" };
};

export default function DeliveryAgents({ showToast }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getRiders();
      setRiders(res.data.riders || []);
    } catch {
      setError("Failed to load delivery agents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(fetchAll, 0);
    return () => window.clearTimeout(t);
  }, [fetchAll]);

  const act = async (fn, successMsg) => {
    setActingId(selected?.id);
    try {
      await fn();
      showToast(successMsg);
      await fetchAll();
      if (selected) {
        const res = await adminApi.getRider(selected.id);
        setDetail(res.data);
      }
    } catch {
      showToast("Action failed", "error");
    }
    setActingId(null);
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    const { action, id, name } = confirm;
    setConfirm(null);
    if (action === "reject") {
      await act(() => adminApi.rejectRider(id), `${name} rejected`);
    } else if (action === "suspend") {
      await act(() => adminApi.suspendRider(id), `${name} suspended`);
    }
  };

  const openDetail = async (r) => {
    setSelected(r);
    setDetail(null);
    try {
      const res = await adminApi.getRider(r.id);
      setDetail(res.data);
    } catch {
      setDetail({});
    }
  };

  const filtered = riders.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.rider_name?.toLowerCase().includes(q) ||
      r.rider_email?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q)
    );
  });

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? riders.length : riders.filter((r) => r.status === t.key).length;
    return acc;
  }, {});

  const state = detail?.rider ? riderState({ status: detail.rider.status, is_online: detail.is_online, is_delivering: detail.is_delivering }) : null;

  return (
    <div>
      <Card pad="0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Delivery Agents</div>
            <div className="text-[13px] text-text-muted mt-0.5">Review rider applications and manage delivery accounts</div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search agents..."
              className="w-full sm:w-60 pl-8 pr-3 py-2 rounded-lg text-sm bg-[#FAFAFA] border border-border focus:outline-none focus:ring-2 focus:ring-zinc-200 placeholder:text-text-light font-outfit"
            />
          </div>
        </div>

        <div className="px-5 py-3 border-b border-border flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors cursor-pointer font-outfit border ${
                tab === t.key
                  ? "bg-orange-primary text-white border-orange-primary"
                  : "bg-[#FAFAFA] text-text-muted border-border hover:text-text-primary"
              }`}
            >
              {t.label} <span className="opacity-70">({counts[t.key]})</span>
            </button>
          ))}
        </div>

        {error ? (
          <div className="p-5"><ErrorBanner message={error} onRetry={fetchAll} /></div>
        ) : loading ? (
          <LoadingRows count={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAFAFA] border-b border-border">
                  {["Agent", "Vehicle", "City", "State", "Deliveries", "Status", "Joined", "Action"].map((h) => (
                    <th key={h} className={`px-4 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap ${h === "Action" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const st = riderState(r);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => openDetail(r)}
                      className={`hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i < filtered.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-full bg-orange-soft flex items-center justify-center text-xs font-bold text-orange-deep shrink-0">
                            {r.rider_name?.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "R"}
                          </span>
                          <div>
                            <p className="font-semibold text-text-primary">{r.rider_name || "\u2014"}</p>
                            <p className="text-xs text-text-light mt-0.5">{r.rider_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 capitalize text-text-muted">
                          <Bike size={14} className="text-text-light" />
                          {r.vehicle_type || "\u2014"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{r.city || "\u2014"}</td>
                      <td className="px-4 py-3">
                        {st ? <PillBadge tone={st.tone}>{st.label}</PillBadge> : <span className="text-[12.5px] text-text-light">\u2014</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13.5px] text-text-primary">{r.completed_deliveries}</td>
                      <td className="px-4 py-3">
                        <PillBadge tone={RIDER_STATUS_TONE[r.status] || "zinc"}>{ACCOUNT_LABEL[r.status] || capitalize(r.status)}</PillBadge>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-light whitespace-nowrap">
                        {r.created_at ? formatDate(r.created_at) : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); act(() => adminApi.approveRider(r.id), `${r.rider_name || "Rider"} approved`); }}
                                disabled={actingId === r.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                              >
                                {actingId === r.id ? (
                                  <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                                ) : (
                                  <Check size={13} strokeWidth={2.5} />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirm({ action: "reject", id: r.id, name: r.rider_name || "Rider" }); }}
                                disabled={actingId === r.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                              >
                                <X size={13} strokeWidth={2.5} />
                                Reject
                              </button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirm({ action: "suspend", id: r.id, name: r.rider_name || "Rider" }); }}
                              disabled={actingId === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                            >
                              <X size={13} strokeWidth={2.5} />
                              Suspend
                            </button>
                          )}
                          {r.status === "suspended" && (
                            <button
                              onClick={(e) => { e.stopPropagation(); act(() => adminApi.activateRider(r.id), `${r.rider_name || "Rider"} activated`); }}
                              disabled={actingId === r.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                            >
                              <Check size={13} strokeWidth={2.5} />
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-light">
                      No delivery agents found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.rider_name || ""}
        subtitle={detail?.rider ? `${detail.rider.vehicle_type || ""}${detail.rider.city ? ` · ${detail.rider.city}` : ""}` : ""}
      >
        {detail?.rider ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <PillBadge tone={RIDER_STATUS_TONE[detail.rider.status] || "zinc"}>{ACCOUNT_LABEL[detail.rider.status] || capitalize(detail.rider.status)}</PillBadge>
              {state && <PillBadge tone={state.tone}>{state.label}</PillBadge>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3.5 text-center">
                <div className="text-[22px] font-extrabold font-mono text-text-primary leading-none">{detail.completed_deliveries ?? 0}</div>
                <div className="text-[12px] text-text-muted mt-1.5 font-medium">Deliveries</div>
              </div>
              <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3.5 text-center">
                <div className="text-[22px] font-extrabold font-mono text-text-primary leading-none">{detail.total_assigned ?? 0}</div>
                <div className="text-[12px] text-text-muted mt-1.5 font-medium">Assigned</div>
              </div>
              <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3.5 text-center">
                <div className="text-[22px] font-extrabold font-mono text-text-primary leading-none">
                  {detail.avg_delivery_minutes != null ? `${detail.avg_delivery_minutes}m` : "\u2014"}
                </div>
                <div className="text-[12px] text-text-muted mt-1.5 font-medium">Avg delivery</div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Personal Information</div>
              <div className="flex items-start gap-3">
                {detail.rider.user?.avatar_url ? (
                  <img src={detail.rider.user.avatar_url} alt={`${detail.rider.user.name} profile`} className="w-16 h-16 rounded-2xl object-cover ring-1 ring-border shrink-0" />
                ) : (
                  <span className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border border-border flex items-center justify-center text-[10px] font-semibold text-text-light shrink-0">NO PHOTO</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-text-primary">{detail.rider.user?.name || "\u2014"}</p>
                  <div className="mt-1.5 space-y-1 text-[13px]">
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted shrink-0">Email</span>
                      <span className="font-medium text-text-primary text-right break-all">{detail.rider.user?.email || "\u2014"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted shrink-0">Phone</span>
                      <span className="font-medium text-text-primary">{detail.rider.phone || "\u2014"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted shrink-0">Date of birth</span>
                      <span className="font-medium text-text-primary">{formatDob(detail.rider.date_of_birth)}</span>
                    </div>
                  </div>
                  <p className="text-[12px] text-text-light mt-2">This email is used for rider login and OTP verification.</p>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Identity Verification</div>
              <div className="space-y-2.5 text-[13.5px]">
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted shrink-0">NID number</span>
                  <span className="font-semibold text-text-primary">{detail.rider.nid_number || "\u2014"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted shrink-0">NID document</span>
                  {detail.rider.nid_document_url ? (
                    <a
                      href={detail.rider.nid_document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-orange-primary hover:text-orange-deep"
                    >
                      <FileText size={13} /> View document <ExternalLink size={12} />
                    </a>
                  ) : (
                    <span className="text-text-light">\u2014</span>
                  )}
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted shrink-0">Emergency contact</span>
                  <span className="font-medium text-text-primary text-right">
                    {detail.rider.emergency_contact_name || "\u2014"}
                    {detail.rider.emergency_contact_number ? ` (${detail.rider.emergency_contact_number})` : ""}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Vehicle Information</div>
              <div className="space-y-2.5 text-[13.5px]">
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted shrink-0">Vehicle type</span>
                  <span className="font-semibold text-text-primary capitalize">{detail.rider.vehicle_type || "\u2014"}</span>
                </div>
                {MotorizedVehicle.includes(detail.rider.vehicle_type) && (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted shrink-0">License number</span>
                      <span className="font-medium text-text-primary">{detail.rider.license_number || "\u2014"}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted shrink-0">License document</span>
                      {detail.rider.license_document_url ? (
                        <a
                          href={detail.rider.license_document_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-semibold text-orange-primary hover:text-orange-deep"
                        >
                          <FileText size={13} /> View document <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-text-light">\u2014</span>
                      )}
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-text-muted shrink-0">Vehicle registration</span>
                      <span className="font-medium text-text-primary">{detail.rider.vehicle_registration || "\u2014"}</span>
                    </div>
                  </>
                )}
                {detail.rider.vehicle_description && (
                  <p className="text-[13px] text-text-muted">{detail.rider.vehicle_description}</p>
                )}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Delivery Information</div>
              <p className="text-[14px] text-text-primary">{detail.rider.address || "\u2014"}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(detail.rider.delivery_area || "").split(",").map((a) => a.trim()).filter(Boolean).map((a) => (
                  <PillBadge key={a} tone="zinc">{a}</PillBadge>
                ))}
                {!detail.rider.delivery_area && <span className="text-[12.5px] text-text-light">No delivery area provided.</span>}
              </div>
              <p className="text-[13px] text-text-muted mt-2">{detail.rider.city ? `City: ${detail.rider.city}` : ""}</p>
              <p className="text-[12.5px] text-text-light mt-2">Joined {formatDateTime(detail.rider.created_at)}</p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Status</div>
              <div className="flex flex-col gap-1.5 text-[13.5px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Account status</span>
                  <span className="font-semibold text-text-primary">{ACCOUNT_LABEL[detail.rider.status] || capitalize(detail.rider.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Application status</span>
                  <span className="font-semibold text-text-primary">{ACCOUNT_LABEL[detail.rider.status] || capitalize(detail.rider.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Availability</span>
                  <span className="font-semibold text-text-primary">{state ? state.label : "\u2014"}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Current assignment</div>
              {detail.current_assigned_order ? (
                <div className="border border-border rounded-[10px] px-3.5 py-3">
                  <p className="text-[14px] font-semibold text-text-primary">
                    Order #{detail.current_assigned_order.id}
                  </p>
                  <p className="text-[13px] text-text-muted mt-0.5">
                    {detail.current_assigned_order.restaurant_name} · {detail.current_assigned_order.customer_name}
                  </p>
                  <PillBadge tone="orange" children={orderStatusLabel(detail.current_assigned_order.status)} />
                </div>
              ) : (
                <p className="text-[13px] text-text-muted">No active assignment.</p>
              )}
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Recent deliveries</div>
              <div className="border border-border rounded-[10px] divide-y divide-[#F3F4F6] max-h-56 overflow-y-auto">
                {(detail.recent_deliveries || []).map((o) => (
                  <div key={o.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-text-primary">#{o.id} · {o.restaurant?.restaurant_name || "\u2014"}</p>
                      <p className="text-[12px] text-text-light mt-0.5">{o.user?.name} · {formatDate(o.created_at)}</p>
                    </div>
                    <PillBadge tone={o.status === "delivered" ? "green" : "amber"}>{orderStatusLabel(o.status)}</PillBadge>
                  </div>
                ))}
                {(detail.recent_deliveries || []).length === 0 && (
                  <div className="px-3.5 py-4 text-center text-[13px] text-text-light">No deliveries yet.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <LoadingRows count={5} />
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirmed}
        danger
        title={confirm?.action === "reject" ? "Reject application?" : "Suspend agent?"}
        message={
          confirm?.action === "reject"
            ? `${confirm?.name} will be marked as rejected and will need to reapply.`
            : `${confirm?.name} will be suspended immediately. They will not be able to log in until reactivated.`
        }
        confirmLabel={confirm?.action === "reject" ? "Reject" : "Suspend"}
      />
    </div>
  );
}