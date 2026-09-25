import { useCallback, useEffect, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { adminApi } from "../../../features/api/apiSlice";
import { Card, PillBadge } from "../../../components/dashboard/Card";
import ConfirmDialog from "../components/ConfirmDialog";
import DetailDrawer from "../components/DetailDrawer";
import Lightbox from "../../../components/Lightbox";
import { ErrorBanner, LoadingRows } from "../components/States";
import { capitalize, formatDate, formatDateTime, restaurantImage, RESTAURANT_STATUS_TONE } from "./utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Active" },
  { key: "suspended", label: "Suspended" },
  { key: "rejected", label: "Rejected" },
];

const ACCOUNT_LABEL = { approved: "Active", pending: "Pending", suspended: "Suspended", rejected: "Rejected" };
const APPLICATION_LABEL = { approved: "Approved", pending: "Under review", suspended: "Approved", rejected: "Rejected" };

const formatTime = (t) => {
  if (!t) return "\u2014";
  const [h, m] = t.split(":");
  const hour = Number(h);
  if (Number.isNaN(hour)) return t;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${m} ${suffix}`;
};

export default function Restaurants({ showToast }) {
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getRestaurants();
      setRestaurants(res.data.restaurants || []);
    } catch {
      setError("Failed to load restaurants.");
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
        const res = await adminApi.getRestaurant(selected.id);
        setDetail(res.data.restaurant);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Action failed", "error");
    }
    setActingId(null);
  };

  const runConfirmed = async () => {
    if (!confirm) return;
    const { action, id, name } = confirm;
    setConfirm(null);
    if (action === "reject") {
      await act(() => adminApi.rejectRestaurant(id), `${name} rejected`);
    } else if (action === "suspend") {
      await act(() => adminApi.suspendRestaurant(id), `${name} suspended`);
    } else if (action === "review") {
      await act(() => adminApi.updateRestaurantStatus(id, { status: "pending" }), `${name} moved back to pending`);
    }
  };

  const openDetail = async (r) => {
    setSelected(r);
    setDetail(null);
    try {
      const res = await adminApi.getRestaurant(r.id);
      setDetail(res.data.restaurant);
    } catch {
      setDetail({});
    }
  };

  const filtered = restaurants.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      r.restaurant_name?.toLowerCase().includes(q) ||
      r.owner_name?.toLowerCase().includes(q) ||
      r.cuisine_type?.toLowerCase().includes(q) ||
      r.city?.toLowerCase().includes(q)
    );
  });

  const counts = TABS.reduce((acc, t) => {
    acc[t.key] = t.key === "all" ? restaurants.length : restaurants.filter((r) => r.status === t.key).length;
    return acc;
  }, {});

  const ActionButtons = ({ r }) => {
    if (r.status === "pending") {
      return (
        <div className="flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); act(() => adminApi.approveRestaurant(r.id), `${r.restaurant_name} approved`); }}
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
            onClick={(e) => { e.stopPropagation(); setConfirm({ action: "reject", id: r.id, name: r.restaurant_name }); }}
            disabled={actingId === r.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
          >
            <X size={13} strokeWidth={2.5} />
            Reject
          </button>
        </div>
      );
    }
    if (r.status === "suspended") {
      return (
        <div className="flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); act(() => adminApi.activateRestaurant(r.id), `${r.restaurant_name} activated`); }}
            disabled={actingId === r.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
          >
            <Check size={13} strokeWidth={2.5} />
            Activate
          </button>
        </div>
      );
    }
    if (r.status === "approved") {
      return (
        <div className="flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setConfirm({ action: "suspend", id: r.id, name: r.restaurant_name }); }}
            disabled={actingId === r.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
          >
            <X size={13} strokeWidth={2.5} />
            Suspend
          </button>
        </div>
      );
    }
    if (r.status === "rejected") {
      return (
        <div className="flex justify-end">
          <button
            onClick={(e) => { e.stopPropagation(); setConfirm({ action: "review", id: r.id, name: r.restaurant_name }); }}
            disabled={actingId === r.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-primary bg-orange-soft border border-orange-soft hover:bg-orange-soft/70 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
          >
            Review
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <Card pad="0">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[15px] font-bold text-text-primary">Restaurants</div>
            <div className="text-[13px] text-text-muted mt-0.5">Review applications and manage restaurant accounts</div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants..."
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
                  {["Restaurant", "Owner", "Cuisine", "Orders", "Rating", "Status", "Joined", "Action"].map((h) => (
                    <th key={h} className={`px-4 py-2.5 text-left text-text-light font-semibold text-[12.5px] uppercase tracking-[0.04em] whitespace-nowrap ${h === "Action" ? "text-right" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => openDetail(r)}
                    className={`hover:bg-[#FAFAFA] transition-colors cursor-pointer ${i < filtered.length - 1 ? "border-b border-[#F3F4F6]" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={restaurantImage(r.restaurant_name)}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                        <div>
                          <p className="font-semibold text-text-primary">{r.restaurant_name}</p>
                          {r.city && <p className="text-xs text-text-light mt-0.5">{r.city}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-text-muted">{r.owner_name || "\u2014"}</p>
                      <p className="text-xs text-text-light mt-0.5">{r.owner_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <PillBadge tone="orange">{r.cuisine_type || "\u2014"}</PillBadge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13.5px] text-text-primary">{r.orders_count}</td>
                    <td className="px-4 py-3 font-mono text-[13.5px] text-text-primary">
                      {r.rating ? `\u2605 ${r.rating}` : "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      <PillBadge tone={RESTAURANT_STATUS_TONE[r.status] || "zinc"}>{ACCOUNT_LABEL[r.status] || capitalize(r.status)}</PillBadge>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-light whitespace-nowrap">
                      {r.created_at ? formatDate(r.created_at) : "\u2014"}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <ActionButtons r={r} />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-text-light">
                      No restaurants found.
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
        title={selected?.restaurant_name || ""}
        subtitle={detail ? `${detail.cuisine_type || ""}${detail.area ? ` · ${detail.area}` : ""}${detail.city ? ` · ${detail.city}` : ""}` : ""}
      >
        {detail ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <PillBadge tone={RESTAURANT_STATUS_TONE[detail.status] || "zinc"}>{ACCOUNT_LABEL[detail.status] || capitalize(detail.status)}</PillBadge>
              <div className="flex gap-2">
                {detail.status === "pending" && (
                  <>
                    <button
                      onClick={() => act(() => adminApi.approveRestaurant(detail.id), `${detail.restaurant_name} approved`)}
                      disabled={actingId === detail.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                    >
                      <Check size={13} strokeWidth={2.5} /> Approve
                    </button>
                    <button
                      onClick={() => setConfirm({ action: "reject", id: detail.id, name: detail.restaurant_name })}
                      disabled={actingId === detail.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                    >
                      <X size={13} strokeWidth={2.5} /> Reject
                    </button>
                  </>
                )}
                {detail.status === "approved" && (
                  <button
                    onClick={() => setConfirm({ action: "suspend", id: detail.id, name: detail.restaurant_name })}
                    disabled={actingId === detail.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                  >
                    <X size={13} strokeWidth={2.5} /> Suspend
                  </button>
                )}
                {detail.status === "suspended" && (
                  <button
                    onClick={() => act(() => adminApi.activateRestaurant(detail.id), `${detail.restaurant_name} activated`)}
                    disabled={actingId === detail.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                  >
                    <Check size={13} strokeWidth={2.5} /> Activate
                  </button>
                )}
                {detail.status === "rejected" && (
                  <button
                    onClick={() => setConfirm({ action: "review", id: detail.id, name: detail.restaurant_name })}
                    disabled={actingId === detail.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-primary bg-orange-soft border border-orange-soft hover:bg-orange-soft/70 transition-colors disabled:opacity-50 cursor-pointer font-outfit"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3.5 text-center">
                <div className="text-[22px] font-extrabold font-mono text-text-primary leading-none">{detail.orders_count ?? 0}</div>
                <div className="text-[12px] text-text-muted mt-1.5 font-medium">Orders</div>
              </div>
              <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3.5 text-center">
                <div className="text-[22px] font-extrabold font-mono text-text-primary leading-none">
                  {detail.reviews_avg_rating ? `\u2605 ${Number(detail.reviews_avg_rating).toFixed(1)}` : "\u2014"}
                </div>
                <div className="text-[12px] text-text-muted mt-1.5 font-medium">Rating ({detail.reviews_count ?? 0} reviews)</div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Owner Information</div>
              <p className="text-[15px] font-semibold text-text-primary">{detail.user?.name || "\u2014"}</p>
              <div className="mt-1.5 space-y-1 text-[13px]">
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted shrink-0">Email</span>
                  <span className="font-medium text-text-primary text-right break-all">{detail.user?.email || "\u2014"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-text-muted shrink-0">Phone</span>
                  <span className="font-medium text-text-primary">{detail.phone || detail.user?.phone || "\u2014"}</span>
                </div>
              </div>
              <p className="text-[12px] text-text-light mt-2">This email is used for owner login and OTP verification.</p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Restaurant</div>
              <div className="flex items-start gap-3">
                {detail.logo_url ? (
                  <button
                    type="button"
                    onClick={() => setLightbox({ images: [detail.logo_url], index: 0, title: `${detail.restaurant_name} logo` })}
                    aria-label="Preview restaurant logo"
                    className="w-16 h-16 rounded-xl overflow-hidden ring-1 ring-border shrink-0 hover:opacity-90 transition-opacity cursor-pointer p-0 bg-white"
                  >
                    <img src={detail.logo_url} alt={`${detail.restaurant_name} logo`} className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ) : (
                  <span className="w-16 h-16 rounded-xl bg-[#FAFAFA] border border-border flex items-center justify-center text-[10px] font-semibold text-text-light shrink-0">NO LOGO</span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <PillBadge tone="orange">{detail.cuisine_type || "\u2014"}</PillBadge>
                  </div>
                  {detail.description ? (
                    <p className="text-[13px] text-text-muted mt-2 leading-relaxed">{detail.description}</p>
                  ) : (
                    <p className="text-[12.5px] text-text-light mt-2">No description provided.</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Location</div>
              <p className="text-[14px] text-text-primary">{detail.address || "\u2014"}</p>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-light">Area</div>
                  <div className="text-[13.5px] font-semibold text-text-primary mt-1">{detail.area || "\u2014"}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-light">City</div>
                  <div className="text-[13.5px] font-semibold text-text-primary mt-1">{detail.city || "\u2014"}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Operating Hours</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-light">Opens</div>
                  <div className="text-[13.5px] font-semibold text-text-primary mt-1">{formatTime(detail.opening_time)}</div>
                </div>
                <div className="bg-[#FAFAFA] border border-border rounded-[10px] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-light">Closes</div>
                  <div className="text-[13.5px] font-semibold text-text-primary mt-1">{formatTime(detail.closing_time)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(detail.operating_days || "").split(",").map((d) => d.trim()).filter(Boolean).map((d) => (
                  <PillBadge key={d} tone="zinc">{d}</PillBadge>
                ))}
                {!detail.operating_days && <span className="text-[12.5px] text-text-light">No operating days provided.</span>}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Status</div>
              <div className="flex flex-col gap-1.5 text-[13.5px]">
                <div className="flex justify-between">
                  <span className="text-text-muted">Account status</span>
                  <span className="font-semibold text-text-primary">{ACCOUNT_LABEL[detail.status] || capitalize(detail.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Application status</span>
                  <span className="font-semibold text-text-primary">{APPLICATION_LABEL[detail.status] || capitalize(detail.status)}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">Details</div>
              <div className="flex flex-wrap gap-2">
                <PillBadge tone="orange">{detail.cuisine_type || "\u2014"}</PillBadge>
                <PillBadge tone="blue">{detail.city || "\u2014"}</PillBadge>
                {detail.accepts_dine_in && <PillBadge tone="green">Dine-in available</PillBadge>}
              </div>
              <p className="text-[12.5px] text-text-light mt-2">Joined {formatDateTime(detail.created_at)}</p>
            </div>

            <div>
              <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-text-light mb-2">
                Menu items ({detail.menu_items?.length ?? 0})
              </div>
              <div className="border border-border rounded-[10px] divide-y divide-[#F3F4F6] max-h-56 overflow-y-auto">
                {(detail.menu_items || []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-3.5 py-2.5">
                    <span className="text-[14px] font-medium text-text-primary truncate">{item.name}</span>
                    <span className="text-[13.5px] font-mono font-semibold text-text-primary shrink-0">{item.price}</span>
                  </div>
                ))}
                {(detail.menu_items || []).length === 0 && (
                  <div className="px-3.5 py-4 text-center text-[13px] text-text-light">No menu items yet.</div>
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
        danger={confirm?.action === "reject" || confirm?.action === "suspend"}
        title={confirm?.action === "reject" ? "Reject application?" : confirm?.action === "suspend" ? "Suspend restaurant?" : "Review application?"}
        message={
          confirm?.action === "reject"
            ? `${confirm.name} will be marked as rejected and the owner will need to reapply.`
            : confirm?.action === "suspend"
              ? `${confirm.name} will be suspended immediately. The owner will not be able to log in until reactivated.`
              : `${confirm?.name} will be moved back to pending for a new review.`
        }
        confirmLabel={confirm?.action === "reject" ? "Reject" : confirm?.action === "suspend" ? "Suspend" : "Move to pending"}
      />
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.index}
          title={lightbox.title || "Preview"}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}