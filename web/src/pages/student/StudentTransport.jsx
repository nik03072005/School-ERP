import { useEffect, useState } from "react";
import {
  Bus,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  AlertCircle,
  MessageCircle,
  Calendar,
  Navigation,
  Info,
} from "lucide-react";
import { transportService } from "../../api/transportService";

export default function StudentTransport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transportService
      .getMyTransport()
      .then((res) => setData(res))
      .catch((err) => console.error("Error fetching transport pass:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  const isAllocated = data?.is_allocated;
  const alloc = data?.allocation;
  const route = alloc?.route;
  const vehicle = alloc?.vehicle;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <Bus size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                Kidz Galaxy Student Logistics
              </span>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
                My Bus &amp; Route Schedule
              </h1>
              <p className="text-xs text-slate-500">
                Daily pick-up &amp; drop timings, bus details, and driver emergency contacts.
              </p>
            </div>
          </div>

          {isAllocated && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Bus Pass &bull; AY {alloc.academic_year || "2026-27"}
              </span>
            </div>
          )}
        </div>
      </div>

      {!isAllocated ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-xs">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-slate-400 mb-4">
            <Bus size={32} />
          </div>
          <h3 className="text-base font-black text-slate-800">No Bus Route Allocated Yet</h3>
          <p className="mt-1.5 max-w-md text-xs text-slate-500 leading-relaxed">
            {data?.transport_required
              ? "Your request for school transport is currently being processed by the transport office. A bus route and stop will be assigned shortly."
              : "You are currently marked for Self / Parent Commute. If you require school bus pickup and drop, please contact the school administration office."}
          </p>
          {data?.pickup_drop_address && (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-xs text-slate-600">
              Requested Pickup Point: <span className="font-bold text-slate-800">{data.pickup_drop_address}</span>
            </div>
          )}
          <div className="mt-6 rounded-2xl bg-indigo-50 border border-indigo-100 p-4 max-w-md text-xs text-indigo-900">
            <p className="font-bold">Need assistance with bus transport?</p>
            <p className="mt-0.5 text-indigo-700">
              Contact School Transport Helpdesk at <span className="font-bold">+91 98390 00000</span> or submit a parent query.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Main Bus Pass Badge & Key Metrics ── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Bus Pass Digital Card */}
            <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-xl">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl" />

              <div className="flex items-center justify-between border-b border-white/15 pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xs">
                    <Bus size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
                      Digital Student Bus Pass
                    </span>
                    <h3 className="text-base font-black">{route.route_name}</h3>
                  </div>
                </div>
                <span className="rounded-xl bg-white/20 px-3 py-1 font-mono text-xs font-black uppercase ring-1 ring-white/30">
                  {route.route_code}
                </span>
              </div>

              {/* Timing Split Cards */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs ring-1 ring-white/15">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                      Morning Pickup Stop
                    </span>
                    <Clock size={13} className="text-indigo-200" />
                  </div>
                  <p className="mt-1 text-base font-black text-white">{alloc.pickup_stop_name}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <span>Pickup Time:</span>
                    <span className="rounded-md bg-amber-400/20 px-2 py-0.5 text-amber-200 ring-1 ring-amber-400/30">
                      {alloc.pickup_time || "07:15 AM"}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs ring-1 ring-white/15">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                      Afternoon Drop Stop
                    </span>
                    <Clock size={13} className="text-indigo-200" />
                  </div>
                  <p className="mt-1 text-base font-black text-white">{alloc.drop_stop_name}</p>
                  <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <span>Drop Time:</span>
                    <span className="rounded-md bg-emerald-400/20 px-2 py-0.5 text-emerald-200 ring-1 ring-emerald-400/30">
                      {alloc.drop_time || "02:30 PM"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3 text-xs text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Service Type: <strong className="text-white capitalize">{alloc.allocation_type.replace("_", " ")}</strong>
                </span>
                <span>
                  Corridor: <strong className="text-white">{route.start_location} &rarr; {route.end_location}</strong>
                </span>
              </div>
            </div>

            {/* Vehicle & Driver Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Assigned Bus &amp; Crew
                </span>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Bus size={24} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900">{vehicle?.vehicle_no || "Bus Not Assigned"}</h4>
                    <p className="text-xs text-slate-500">{vehicle?.vehicle_model || ""}</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-xs">
                  <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Primary Driver</p>
                    <p className="font-bold text-slate-900 mt-0.5">{vehicle?.driver_name || "Assigned Driver"}</p>
                    {vehicle?.driver_phone && (
                      <div className="mt-2 flex items-center gap-2">
                        <a
                          href={`tel:${vehicle.driver_phone}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                        >
                          <Phone size={11} /> Call Driver
                        </a>
                        <a
                          href={`https://wa.me/91${vehicle.driver_phone.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <MessageCircle size={11} /> WhatsApp
                        </a>
                      </div>
                    )}
                  </div>

                  {vehicle?.attendant_name && (
                    <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Bus Attendant / Conductor</p>
                      <p className="font-bold text-slate-900 mt-0.5">{vehicle.attendant_name}</p>
                      {vehicle.attendant_phone && (
                        <p className="text-xs font-semibold text-cyan-700 mt-0.5 flex items-center gap-1">
                          <Phone size={10} /> {vehicle.attendant_phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400 flex items-center gap-1.5">
                <Info size={13} />
                <span>Please arrive at your designated stop 5 mins early.</span>
              </div>
            </div>
          </div>

          {/* ── Route Stop Timeline Sequence ── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Complete Bus Route Timeline</h3>
                <p className="text-xs text-slate-500">
                  Sequential stops along {route.route_name} with scheduled arrival times
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                {route.stops?.length || 0} Total Stops
              </span>
            </div>

            <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-indigo-200 ml-4 py-2">
              {(route.stops || []).map((stop, idx) => {
                const isMyPickup =
                  stop.stop_name.toLowerCase().trim() === alloc.pickup_stop_name.toLowerCase().trim();
                const isMyDrop =
                  stop.stop_name.toLowerCase().trim() === alloc.drop_stop_name.toLowerCase().trim();
                const isMyStop = isMyPickup || isMyDrop;

                return (
                  <div key={stop._id || idx} className="relative group">
                    <span
                      className={`absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ring-4 ring-white ${
                        isMyStop ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {stop.stop_order || idx + 1}
                    </span>

                    <div
                      className={`rounded-2xl p-4 transition ${
                        isMyStop
                          ? "bg-indigo-50/80 border-2 border-indigo-300 shadow-xs"
                          : "bg-slate-50/50 border border-slate-200/60"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{stop.stop_name}</h4>
                            {isMyStop && (
                              <span className="rounded-full bg-indigo-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow-2xs">
                                Your Designated Stop
                              </span>
                            )}
                          </div>
                          {stop.landmark && (
                            <p className="text-xs text-slate-500 mt-0.5">Landmark: {stop.landmark}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs font-semibold">
                          <div className="rounded-xl bg-white px-3 py-1.5 border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Morning Pickup</span>
                            <span className="text-indigo-700 font-black">{stop.pickup_time || "N/A"}</span>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-1.5 border border-slate-200 shadow-2xs">
                            <span className="text-[10px] text-slate-400 uppercase block font-bold">Evening Drop</span>
                            <span className="text-emerald-700 font-black">{stop.drop_time || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

