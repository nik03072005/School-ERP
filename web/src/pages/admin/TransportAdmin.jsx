import { useState, useEffect } from "react";
import {
  Bus,
  MapPin,
  Users,
  Phone,
  ShieldAlert,
  Clock,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  X,
  UserCheck,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Navigation,
} from "lucide-react";
import { transportService } from "../../api/transportService";
import { setupService } from "../../api/setupService";

export default function TransportAdmin() {
  const [activeTab, setActiveTab] = useState("overview"); // overview, allocations, routes, vehicles
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_no: "",
    vehicle_model: "",
    vehicle_type: "bus",
    seating_capacity: 32,
    driver_name: "",
    driver_phone: "",
    driver_license: "",
    attendant_name: "",
    attendant_phone: "",
    insurance_expiry_date: "",
    fitness_expiry_date: "",
    pollution_expiry_date: "",
    gps_device_id: "",
    status: "active",
    notes: "",
  });

  // Routes state
  const [routes, setRoutes] = useState([]);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [routeForm, setRouteForm] = useState({
    route_name: "",
    route_code: "",
    vehicle_id: "",
    start_location: "",
    end_location: "",
    description: "",
    stops: [
      { stop_name: "", stop_order: 1, pickup_time: "07:15 AM", drop_time: "02:30 PM", fare_amount: 1500, landmark: "" },
    ],
  });

  // Allocations state
  const [allocations, setAllocations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [filterRoute, setFilterRoute] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [unallocatedStudents, setUnallocatedStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [allocRouteId, setAllocRouteId] = useState("");
  const [allocPickupStopId, setAllocPickupStopId] = useState("");
  const [allocDropStopId, setAllocDropStopId] = useState("");
  const [allocType, setAllocType] = useState("both_ways");
  const [submittingAlloc, setSubmittingAlloc] = useState(false);

  // Manifest Print Modal
  const [manifestModalOpen, setManifestModalOpen] = useState(false);
  const [manifestRouteId, setManifestRouteId] = useState("");
  const [manifestData, setManifestData] = useState(null);
  const [loadingManifest, setLoadingManifest] = useState(false);

  // Feedback banner
  const [banner, setBanner] = useState({ type: "", message: "" });

  const showBanner = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner({ type: "", message: "" }), 5000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sumRes, vehRes, rRes, allocRes, classRes] = await Promise.all([
        transportService.getSummary(),
        transportService.getVehicles(),
        transportService.getRoutes(),
        transportService.getAllocations(),
        setupService.listClasses().catch(() => ({ classes: [] })),
      ]);
      setSummary(sumRes.summary || null);
      setVehicles(vehRes.vehicles || []);
      setRoutes(rRes.routes || []);
      setAllocations(allocRes.allocations || []);
      setClasses(classRes.classes || []);
    } catch (err) {
      console.error("Error loading transport data:", err);
      showBanner("error", err.response?.data?.message || "Failed to load transport data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!filterClass) {
      setSections([]);
      setFilterSection("");
      return;
    }
    setupService.listSections({ class_id: filterClass }).then((res) => {
      setSections(res.sections || []);
    });
  }, [filterClass]);

  // Refetch allocations on filter change
  const refreshAllocations = async () => {
    try {
      const params = {};
      if (filterRoute) params.route_id = filterRoute;
      if (filterClass) params.class_id = filterClass;
      if (filterSection) params.section_id = filterSection;
      if (filterSearch) params.search = filterSearch;
      const res = await transportService.getAllocations(params);
      setAllocations(res.allocations || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "allocations") {
      refreshAllocations();
    }
  }, [filterRoute, filterClass, filterSection, filterSearch, activeTab]);

  // Load unallocated students when opening modal
  const openAllocationModal = async () => {
    setSelectedStudentId("");
    setAllocRouteId(routes[0]?._id || "");
    setAllocPickupStopId("");
    setAllocDropStopId("");
    setAllocType("both_ways");
    setAllocationModalOpen(true);
    try {
      const res = await transportService.getUnallocatedStudents({ transport_required_only: "false" });
      setUnallocatedStudents(res.students || []);
    } catch (err) {
      console.error("Failed to load students", err);
    }
  };

  // ── Vehicle Handlers ───────────────────────────────────────────────────────
  const handleOpenVehicleModal = (veh = null) => {
    if (veh) {
      setEditingVehicle(veh);
      setVehicleForm({
        vehicle_no: veh.vehicle_no || "",
        vehicle_model: veh.vehicle_model || "",
        vehicle_type: veh.vehicle_type || "bus",
        seating_capacity: veh.seating_capacity || 32,
        driver_name: veh.driver_name || "",
        driver_phone: veh.driver_phone || "",
        driver_license: veh.driver_license || "",
        attendant_name: veh.attendant_name || "",
        attendant_phone: veh.attendant_phone || "",
        insurance_expiry_date: veh.insurance_expiry_date ? veh.insurance_expiry_date.split("T")[0] : "",
        fitness_expiry_date: veh.fitness_expiry_date ? veh.fitness_expiry_date.split("T")[0] : "",
        pollution_expiry_date: veh.pollution_expiry_date ? veh.pollution_expiry_date.split("T")[0] : "",
        gps_device_id: veh.gps_device_id || "",
        status: veh.status || "active",
        notes: veh.notes || "",
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({
        vehicle_no: "",
        vehicle_model: "",
        vehicle_type: "bus",
        seating_capacity: 32,
        driver_name: "",
        driver_phone: "",
        driver_license: "",
        attendant_name: "",
        attendant_phone: "",
        insurance_expiry_date: "",
        fitness_expiry_date: "",
        pollution_expiry_date: "",
        gps_device_id: "",
        status: "active",
        notes: "",
      });
    }
    setVehicleModalOpen(true);
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await transportService.updateVehicle(editingVehicle._id, vehicleForm);
        showBanner("success", `Vehicle ${vehicleForm.vehicle_no} updated successfully.`);
      } else {
        await transportService.createVehicle(vehicleForm);
        showBanner("success", `Vehicle ${vehicleForm.vehicle_no} added to fleet.`);
      }
      setVehicleModalOpen(false);
      loadAll();
    } catch (err) {
      showBanner("error", err.response?.data?.message || "Failed to save vehicle");
    }
  };

  const handleDeleteVehicle = async (veh) => {
    if (!window.confirm(`Are you sure you want to delete vehicle ${veh.vehicle_no}?`)) return;
    try {
      await transportService.deleteVehicle(veh._id);
      showBanner("success", `Vehicle ${veh.vehicle_no} deleted.`);
      loadAll();
    } catch (err) {
      showBanner("error", err.response?.data?.message || "Failed to delete vehicle");
    }
  };

  // ── Route Handlers ────────────────────────────────────────────────────────
  const handleOpenRouteModal = (rt = null) => {
    if (rt) {
      setEditingRoute(rt);
      setRouteForm({
        route_name: rt.route_name || "",
        route_code: rt.route_code || "",
        vehicle_id: rt.vehicle_id?._id || rt.vehicle_id || "",
        start_location: rt.start_location || "",
        end_location: rt.end_location || "",
        description: rt.description || "",
        stops: rt.stops?.length ? rt.stops.map((s, i) => ({ ...s, stop_order: i + 1 })) : [
          { stop_name: "", stop_order: 1, pickup_time: "07:15 AM", drop_time: "02:30 PM", fare_amount: 1500, landmark: "" },
        ],
      });
    } else {
      setEditingRoute(null);
      setRouteForm({
        route_name: "",
        route_code: `RT-${String(routes.length + 1).padStart(2, "0")}`,
        vehicle_id: vehicles.find((v) => !v.assignedRoute)?._id || vehicles[0]?._id || "",
        start_location: "",
        end_location: "School Main Gate",
        description: "",
        stops: [
          { stop_name: "Starting Stop", stop_order: 1, pickup_time: "07:10 AM", drop_time: "02:40 PM", fare_amount: 1800, landmark: "" },
          { stop_name: "Intermediate Stop", stop_order: 2, pickup_time: "07:30 AM", drop_time: "02:20 PM", fare_amount: 1600, landmark: "" },
          { stop_name: "School Campus Gate", stop_order: 3, pickup_time: "07:55 AM", drop_time: "02:00 PM", fare_amount: 0, landmark: "School Entrance" },
        ],
      });
    }
    setRouteModalOpen(true);
  };

  const handleAddStop = () => {
    setRouteForm((prev) => ({
      ...prev,
      stops: [
        ...prev.stops,
        {
          stop_name: "",
          stop_order: prev.stops.length + 1,
          pickup_time: "07:35 AM",
          drop_time: "02:15 PM",
          fare_amount: 1500,
          landmark: "",
        },
      ],
    }));
  };

  const handleRemoveStop = (index) => {
    if (routeForm.stops.length <= 1) return;
    setRouteForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, i) => i !== index).map((s, i) => ({ ...s, stop_order: i + 1 })),
    }));
  };

  const handleStopChange = (index, field, value) => {
    setRouteForm((prev) => {
      const updated = [...prev.stops];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stops: updated };
    });
  };

  const handleSaveRoute = async (e) => {
    e.preventDefault();
    try {
      if (editingRoute) {
        await transportService.updateRoute(editingRoute._id, routeForm);
        showBanner("success", `Route ${routeForm.route_name} updated successfully.`);
      } else {
        await transportService.createRoute(routeForm);
        showBanner("success", `Route ${routeForm.route_name} created successfully.`);
      }
      setRouteModalOpen(false);
      loadAll();
    } catch (err) {
      showBanner("error", err.response?.data?.message || "Failed to save route");
    }
  };

  const handleDeleteRoute = async (rt) => {
    if (!window.confirm(`Are you sure you want to delete route "${rt.route_name}"?`)) return;
    try {
      await transportService.deleteRoute(rt._id);
      showBanner("success", `Route ${rt.route_name} deleted.`);
      loadAll();
    } catch (err) {
      showBanner("error", err.response?.data?.message || "Failed to delete route");
    }
  };

  // ── Allocation Handlers ───────────────────────────────────────────────────
  const handleSaveAllocation = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !allocRouteId) {
      showBanner("error", "Please select both a student and a bus route.");
      return;
    }

    setSubmittingAlloc(true);
    try {
      await transportService.allocateStudent({
        student_id: selectedStudentId,
        route_id: allocRouteId,
        pickup_stop_id: allocPickupStopId || null,
        drop_stop_id: allocDropStopId || allocPickupStopId || null,
        allocation_type: allocType,
      });
      showBanner("success", "Student allocated to bus route successfully.");
      setAllocationModalOpen(false);
      loadAll();
    } catch (err) {
      showBanner("error", err.response?.data?.message || "Failed to allocate student");
    } finally {
      setSubmittingAlloc(false);
    }
  };

  const handleCancelAllocation = async (allocationId) => {
    if (!window.confirm("Cancel this student's transport allocation?")) return;
    try {
      await transportService.cancelAllocation(allocationId);
      showBanner("success", "Transport allocation cancelled.");
      loadAll();
      refreshAllocations();
    } catch (err) {
      showBanner("error", err.response?.data?.message || "Failed to cancel allocation");
    }
  };

  // ── Manifest Print View ───────────────────────────────────────────────────
  const openManifestModal = async (routeId) => {
    setManifestRouteId(routeId);
    setManifestModalOpen(true);
    setLoadingManifest(true);
    try {
      const res = await transportService.getRouteManifest(routeId);
      setManifestData(res.manifest || null);
    } catch (err) {
      showBanner("error", err.response?.data?.message || "Failed to load route manifest");
    } finally {
      setLoadingManifest(false);
    }
  };

  const handlePrintManifest = () => {
    window.print();
  };

  const selectedAllocRoute = routes.find((r) => r._id === allocRouteId);

  return (
    <div className="space-y-6">
      {/* ── Top Hero Header ── */}
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-600">
            <Bus size={16} />
            Institutional Fleet &amp; Logistics
          </div>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            Transport &amp; Bus Route Allocation
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Manage school buses, sequential pick-up/drop stops, drivers, and assign students with real-time seat tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadAll()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            title="Refresh Fleet Data"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenVehicleModal()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Plus size={14} className="text-cyan-600" />
            <span>Add Vehicle</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenRouteModal()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Navigation size={14} className="text-indigo-600" />
            <span>Create Route</span>
          </button>

          <button
            type="button"
            onClick={openAllocationModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-700 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-cyan-600/30 transition hover:from-cyan-700 hover:to-cyan-800"
          >
            <UserCheck size={14} />
            <span>Allocate Student</span>
          </button>
        </div>
      </div>

      {/* ── Alert Banner ── */}
      {banner.message && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-xs ${
            banner.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{banner.message}</span>
          </div>
          <button onClick={() => setBanner({ type: "", message: "" })}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "overview"
              ? "border-cyan-600 text-cyan-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Compass size={15} />
          Fleet Overview &amp; Analytics
        </button>

        <button
          onClick={() => setActiveTab("allocations")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "allocations"
              ? "border-cyan-600 text-cyan-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={15} />
          Student Allocations ({allocations.length})
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "routes"
              ? "border-cyan-600 text-cyan-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <MapPin size={15} />
          Bus Routes &amp; Stops ({routes.length})
        </button>

        <button
          onClick={() => setActiveTab("vehicles")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-xs font-bold transition-all ${
            activeTab === "vehicles"
              ? "border-cyan-600 text-cyan-700"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Bus size={15} />
          Vehicle Fleet ({vehicles.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: OVERVIEW & ANALYTICS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Fleet</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Bus size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{summary?.totalVehicles || vehicles.length}</span>
                <span className="text-xs font-semibold text-emerald-600">
                  {summary?.activeVehicles || vehicles.filter((v) => v.status === "active").length} Active
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Buses, mini-buses &amp; vans registered</p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Routes</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <MapPin size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{summary?.activeRoutes || routes.length}</span>
                <span className="text-xs font-semibold text-slate-500">Operating Daily</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Connecting residential school zones</p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enrolled Students</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Users size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{summary?.activeAllocations || allocations.length}</span>
                <span className="text-xs font-semibold text-slate-500">Boarding Daily</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Allocated to assigned routes &amp; stops</p>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fleet Capacity</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{summary?.capacityUtilizationPct || 0}%</span>
                <span className="text-xs font-semibold text-slate-500">
                  {summary?.activeAllocations || allocations.length} / {summary?.totalCapacity || 0} Seats
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                  style={{ width: `${Math.min(summary?.capacityUtilizationPct || 0, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Document & Compliance Alert Strip */}
          {summary?.documentAlerts?.length > 0 && (
            <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 to-orange-50/50 p-5 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
                <ShieldAlert size={16} className="text-amber-600" />
                Fleet Document Compliance &amp; Renewal Watchlist
              </div>
              <p className="mt-1 text-xs text-amber-800">
                The following school vehicles have insurance, fitness certificates, or pollution checks expiring soon:
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {summary.documentAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white/90 px-3.5 py-2.5 shadow-2xs"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900">{alert.vehicle_no}</p>
                      <p className="text-[11px] font-semibold text-slate-500">{alert.type}</p>
                    </div>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                        alert.is_expired
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {alert.is_expired
                        ? "EXPIRED"
                        : `Exp: ${new Date(alert.expiry_date).toLocaleDateString("en-IN")}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Route Occupancy Grid */}
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Live Route Passenger Occupancy</h3>
                <p className="text-xs text-slate-500">Real-time seating allocation breakdown across active routes</p>
              </div>
              <button
                onClick={() => setActiveTab("routes")}
                className="inline-flex items-center gap-1 text-xs font-bold text-cyan-600 hover:text-cyan-700"
              >
                View all routes <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {(summary?.routeStats || routes).map((r) => {
                const occ = r.occupancy_pct ?? (r.capacity > 0 ? Math.round((r.allocated_count / r.capacity) * 100) : 0);
                const isNearFull = occ >= 85;
                return (
                  <div
                    key={r._id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:border-cyan-200 hover:bg-cyan-50/30"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200">
                          {r.route_code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isNearFull ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {occ}% full
                        </span>
                      </div>
                      <h4 className="mt-2 text-xs font-black text-slate-900 group-hover:text-cyan-700 line-clamp-1">
                        {r.route_name}
                      </h4>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Bus: <span className="font-semibold text-slate-700">{r.vehicle_no || "Unassigned"}</span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Driver: <span className="font-semibold text-slate-700">{r.driver_name || "N/A"}</span>
                      </p>
                    </div>

                    <div className="mt-4 border-t border-slate-200/60 pt-3">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">
                          {r.allocated_count} / {r.capacity || "?"} Seats
                        </span>
                        <button
                          onClick={() => openManifestModal(r._id)}
                          className="flex items-center gap-1 font-bold text-cyan-600 hover:underline"
                        >
                          <Printer size={11} /> Manifest
                        </button>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isNearFull ? "bg-rose-500" : "bg-cyan-600"
                          }`}
                          style={{ width: `${Math.min(occ, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: STUDENT ALLOCATIONS & ROSTERS ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "allocations" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1.5 text-xs">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search student, roll no, stop, parent phone..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
              />
              {filterSearch && (
                <button onClick={() => setFilterSearch("")}>
                  <X size={12} className="text-slate-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select
                value={filterRoute}
                onChange={(e) => setFilterRoute(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="">All Bus Routes</option>
                {routes.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.route_code} - {r.route_name}
                  </option>
                ))}
              </select>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {sections.length > 0 && (
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="">All Sections</option>
                  {sections.map((s) => (
                    <option key={s._id} value={s._id}>
                      Section {s.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              onClick={openAllocationModal}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-cyan-700"
            >
              <Plus size={13} />
              New Allocation
            </button>
          </div>

          {/* Allocation Table */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Student Name</th>
                    <th className="px-4 py-3">Class &amp; Roll</th>
                    <th className="px-4 py-3">Bus Route</th>
                    <th className="px-4 py-3">Assigned Stop</th>
                    <th className="px-4 py-3">Service Type</th>
                    <th className="px-4 py-3">Emergency Contact</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                        No student transport allocations found matching your search.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((alloc) => {
                      const student = alloc.student_id;
                      const user = student?.user_id;
                      const route = alloc.route_id;
                      const initials = `${user?.first_name?.[0] || ""}${user?.last_name?.[0] || ""}`.toUpperCase();

                      return (
                        <tr key={alloc._id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 font-bold text-white text-[11px]">
                                {initials || "ST"}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">
                                  {user?.first_name} {user?.last_name}
                                </p>
                                <p className="text-[10px] text-slate-400">Adm: {student?.admission_no || "N/A"}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-slate-800">
                              {student?.class_id?.name || "Class"}{" "}
                              {student?.section_id?.name ? `- ${student.section_id.name}` : ""}
                            </span>
                            <p className="text-[10px] text-slate-400">{student?.roll_no || "No Roll No"}</p>
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-700 border border-cyan-200">
                              {route?.route_code || "RT"}
                            </span>
                            <p className="mt-0.5 text-xs font-semibold text-slate-800">{route?.route_name}</p>
                            <p className="text-[10px] text-slate-400">Bus: {route?.vehicle_id?.vehicle_no || "N/A"}</p>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                              <MapPin size={12} className="text-cyan-600 shrink-0" />
                              <span className="truncate max-w-[180px]">{alloc.pickup_stop_name || "School Bus Stop"}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                alloc.allocation_type === "both_ways"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {alloc.allocation_type === "both_ways"
                                ? "Two-Way"
                                : alloc.allocation_type === "pickup_only"
                                ? "Morning Only"
                                : "Evening Only"}
                            </span>
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="text-xs font-semibold text-slate-800">
                              {student?.primary_guardian_name || student?.father_name || "Guardian"}
                            </p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Phone size={10} />
                              {student?.primary_guardian_phone || user?.mobile || "N/A"}
                            </p>
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleCancelAllocation(alloc._id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              title="Cancel Transport Service"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: ROUTES & STOPS MANAGER ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "routes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {routes.map((rt) => {
              const occ = rt.occupancy_pct ?? 0;
              const vehicle = rt.vehicle_id;

              return (
                <div
                  key={rt._id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-cyan-600 px-2 py-0.5 text-xs font-black text-white">
                            {rt.route_code}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              rt.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {rt.is_active ? "ACTIVE ROUTE" : "INACTIVE"}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-black text-slate-900">{rt.route_name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{rt.description || "School bus transit corridor"}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openManifestModal(rt._id)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                          title="Print Driver Manifest"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenRouteModal(rt)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                          title="Edit Route & Stops"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteRoute(rt)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          title="Delete Route"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Vehicle & Driver Cardlet */}
                    <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 border border-slate-200/60">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Bus</p>
                          <p className="font-black text-slate-900 mt-0.5">{vehicle?.vehicle_no || "Unassigned"}</p>
                          <p className="text-[11px] text-slate-500">{vehicle?.vehicle_model || ""}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Driver &amp; Mobile</p>
                          <p className="font-bold text-slate-900 mt-0.5">{vehicle?.driver_name || "N/A"}</p>
                          <p className="text-[11px] text-cyan-700 font-semibold">{vehicle?.driver_phone || ""}</p>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-slate-200/60 pt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600">
                          {rt.allocated_count || 0} / {rt.capacity || vehicle?.seating_capacity || 0} Seats Boarded
                        </span>
                        <span className="font-bold text-cyan-700">{occ}% full</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-cyan-600"
                          style={{ width: `${Math.min(occ, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Sequenced Stops Timeline */}
                    <div className="mt-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                        Stops &amp; Scheduled Timetable ({rt.stops?.length || 0})
                      </p>
                      <div className="relative pl-5 space-y-4 border-l-2 border-dashed border-cyan-300 ml-2">
                        {(rt.stops || []).map((stop, sIdx) => (
                          <div key={stop._id || sIdx} className="relative group">
                            <span className="absolute -left-[27px] top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-[10px] font-black text-white ring-4 ring-white">
                              {stop.stop_order || sIdx + 1}
                            </span>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight">{stop.stop_name}</p>
                                {stop.landmark && (
                                  <p className="text-[10px] text-slate-500">{stop.landmark}</p>
                                )}
                              </div>
                              <div className="text-right text-[11px]">
                                <span className="font-bold text-emerald-700">Pickup: {stop.pickup_time || "--"}</span>
                                <p className="text-slate-500">Drop: {stop.drop_time || "--"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 4: VEHICLE FLEET ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "vehicles" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => (
              <div
                key={v._id}
                className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                        <Bus size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{v.vehicle_no}</h3>
                        <p className="text-xs text-slate-500">{v.vehicle_model}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenVehicleModal(v)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                        title="Edit Vehicle"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(v)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Delete Vehicle"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Badges & Route */}
                  <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 uppercase text-slate-700">
                      {v.vehicle_type}
                    </span>
                    <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-cyan-700 border border-cyan-200">
                      {v.seating_capacity} Seater
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 uppercase ${
                        v.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  {v.assignedRoute ? (
                    <div className="mt-3 rounded-xl bg-cyan-50/60 p-2.5 text-xs border border-cyan-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                        Active Route Assignment
                      </p>
                      <p className="font-bold text-slate-900">
                        {v.assignedRoute.route_code} - {v.assignedRoute.route_name}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {v.activePassengers} students boarding
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl bg-slate-50 p-2 text-xs text-slate-500 border border-slate-200/60">
                      Available / Standby bus (Not assigned to any active route)
                    </div>
                  )}

                  {/* Driver & Attendant info */}
                  <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Driver:</span>
                      <span className="font-bold text-slate-900">{v.driver_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Driver Phone:</span>
                      <span className="font-semibold text-cyan-700">{v.driver_phone}</span>
                    </div>
                    {v.attendant_name && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Attendant:</span>
                        <span className="font-medium text-slate-800">{v.attendant_name}</span>
                      </div>
                    )}
                    {v.gps_device_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">GPS ID:</span>
                        <span className="font-mono text-[11px] font-bold text-indigo-700">
                          {v.gps_device_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expiries footer */}
                <div className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>
                    Ins:{" "}
                    <b className="text-slate-600">
                      {v.insurance_expiry_date
                        ? new Date(v.insurance_expiry_date).toLocaleDateString("en-IN")
                        : "N/A"}
                    </b>
                  </span>
                  <span>
                    Fit:{" "}
                    <b className="text-slate-600">
                      {v.fitness_expiry_date
                        ? new Date(v.fitness_expiry_date).toLocaleDateString("en-IN")
                        : "N/A"}
                    </b>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: ALLOCATE STUDENT ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {allocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Allocate Student to Bus Route</h3>
                  <p className="text-xs text-slate-500">Assign student to daily morning &amp; afternoon transit</p>
                </div>
              </div>
              <button onClick={() => setAllocationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAllocation} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Student *
                </label>
                <select
                  required
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">-- Choose student --</option>
                  {unallocatedStudents.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.user_id?.first_name} {s.user_id?.last_name} ({s.class_id?.name || "Class"}, Roll: {s.roll_no || s.admission_no || "N/A"})
                      {s.transport_required ? " [Requested Transport]" : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-slate-400">
                  Showing students without an active transport route allocation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Bus Route *
                </label>
                <select
                  required
                  value={allocRouteId}
                  onChange={(e) => {
                    setAllocRouteId(e.target.value);
                    setAllocPickupStopId("");
                    setAllocDropStopId("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                >
                  <option value="">-- Choose Route --</option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.route_code} - {r.route_name} ({r.allocated_count || 0}/{r.capacity || 0} seats filled)
                    </option>
                  ))}
                </select>
              </div>

              {selectedAllocRoute && (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Morning Pickup Stop
                      </label>
                      <select
                        value={allocPickupStopId}
                        onChange={(e) => setAllocPickupStopId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800"
                      >
                        <option value="">-- Select Stop --</option>
                        {selectedAllocRoute.stops?.map((stop) => (
                          <option key={stop._id} value={stop._id}>
                            {stop.stop_order}. {stop.stop_name} ({stop.pickup_time})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Afternoon Drop Stop
                      </label>
                      <select
                        value={allocDropStopId || allocPickupStopId}
                        onChange={(e) => setAllocDropStopId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-slate-800"
                      >
                        <option value="">-- Same as Pickup Stop --</option>
                        {selectedAllocRoute.stops?.map((stop) => (
                          <option key={stop._id} value={stop._id}>
                            {stop.stop_order}. {stop.stop_name} ({stop.drop_time})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Service Frequency
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "both_ways", label: "Two-Way (Both)" },
                        { id: "pickup_only", label: "Morning Only" },
                        { id: "drop_only", label: "Evening Only" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setAllocType(t.id)}
                          className={`rounded-xl border p-2 text-center text-xs font-bold transition ${
                            allocType === t.id
                              ? "border-cyan-600 bg-cyan-50 text-cyan-800 shadow-2xs"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setAllocationModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAlloc}
                  className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-cyan-700 disabled:opacity-50"
                >
                  {submittingAlloc ? "Allocating..." : "Confirm Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: VEHICLE CREATE / EDIT ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {vehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                  <Bus size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingVehicle ? "Edit Vehicle Details" : "Register New Fleet Vehicle"}
                </h3>
              </div>
              <button onClick={() => setVehicleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveVehicle} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Registration No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UP-32-AB-1234"
                    value={vehicleForm.vehicle_no}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_no: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 uppercase font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Starbus 32-Seater"
                    value={vehicleForm.vehicle_model}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_model: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vehicle Type</label>
                  <select
                    value={vehicleForm.vehicle_type}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, vehicle_type: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800 font-medium"
                  >
                    <option value="bus">Bus</option>
                    <option value="mini_bus">Mini Bus</option>
                    <option value="van">Van</option>
                    <option value="auto">Auto / Rickshaw</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seating Capacity *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={vehicleForm.seating_capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, seating_capacity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={vehicleForm.status}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800 font-medium"
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={vehicleForm.driver_name}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="10-digit mobile"
                    value={vehicleForm.driver_phone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver_phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Driver License No.</label>
                  <input
                    type="text"
                    placeholder="e.g. UP32-2018-00213"
                    value={vehicleForm.driver_license}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, driver_license: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">GPS Device ID</label>
                  <input
                    type="text"
                    placeholder="e.g. GPS-KG-01"
                    value={vehicleForm.gps_device_id}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, gps_device_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attendant / Conductor Name</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={vehicleForm.attendant_name}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, attendant_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Attendant Phone</label>
                  <input
                    type="text"
                    placeholder="Mobile"
                    value={vehicleForm.attendant_phone}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, attendant_phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Insurance Expiry</label>
                  <input
                    type="date"
                    value={vehicleForm.insurance_expiry_date}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, insurance_expiry_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fitness Expiry</label>
                  <input
                    type="date"
                    value={vehicleForm.fitness_expiry_date}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, fitness_expiry_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pollution (PUC) Expiry</label>
                  <input
                    type="date"
                    value={vehicleForm.pollution_expiry_date}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, pollution_expiry_date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setVehicleModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-cyan-700"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: ROUTE & STOPS BUILDER ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <MapPin size={16} />
                </div>
                <h3 className="text-sm font-black text-slate-900">
                  {editingRoute ? "Edit Route & Stops" : "Create Bus Route & Sequenced Stops"}
                </h3>
              </div>
              <button onClick={() => setRouteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveRoute} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Route Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Route 01 - Gomti Nagar Express"
                    value={routeForm.route_name}
                    onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Route Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RT-01"
                    value={routeForm.route_code}
                    onChange={(e) => setRouteForm({ ...routeForm, route_code: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 font-mono uppercase font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assign Fleet Vehicle</label>
                  <select
                    value={routeForm.vehicle_id}
                    onChange={(e) => setRouteForm({ ...routeForm, vehicle_id: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800 font-medium"
                  >
                    <option value="">-- No vehicle assigned yet --</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.vehicle_no} - {v.vehicle_model} ({v.seating_capacity} Seats, Driver: {v.driver_name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Description / Corridor</label>
                  <input
                    type="text"
                    placeholder="e.g. Patrakarpuram to Campus corridor"
                    value={routeForm.description}
                    onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 p-2 text-slate-800"
                  />
                </div>
              </div>

              {/* Stop sequence timeline builder */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">Sequenced Stops &amp; Schedule</h4>
                    <p className="text-[11px] text-slate-500">
                      Configure pickup &amp; drop stop order with expected arrival times
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700 border border-indigo-200 hover:bg-indigo-100"
                  >
                    <Plus size={12} /> Add Stop
                  </button>
                </div>

                <div className="space-y-3">
                  {routeForm.stops.map((stop, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 shadow-2xs"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                        {idx + 1}
                      </span>

                      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-4">
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            required
                            placeholder="Stop Name (e.g. Patrakarpuram)"
                            value={stop.stop_name}
                            onChange={(e) => handleStopChange(idx, "stop_name", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-1.5 font-semibold text-slate-800"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Pickup Time (07:15 AM)"
                            value={stop.pickup_time}
                            onChange={(e) => handleStopChange(idx, "pickup_time", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-slate-800"
                          />
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Drop Time (02:30 PM)"
                            value={stop.drop_time}
                            onChange={(e) => handleStopChange(idx, "drop_time", e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-1.5 text-slate-800"
                          />
                        </div>
                      </div>

                      {routeForm.stops.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStop(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Remove Stop"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4 mt-5">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-indigo-700"
                >
                  Save Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: DRIVER MANIFEST / PASSENGER ROSTER PRINT VIEW ── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {manifestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl max-h-[95vh] overflow-y-auto print:max-w-none print:shadow-none print:p-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={18} className="text-cyan-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Official Bus Passenger Manifest &amp; Driver Sheet
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintManifest}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                >
                  <Printer size={13} /> Print Sheet
                </button>
                <button onClick={() => setManifestModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            {loadingManifest ? (
              <div className="p-12 text-center text-xs text-slate-500 font-semibold">
                Loading passenger manifest...
              </div>
            ) : manifestData ? (
              <div className="mt-4 space-y-6 text-xs text-slate-800 print:mt-0">
                {/* Print Header */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-slate-900">
                        KIDZ GALAXY PUBLIC SCHOOL
                      </h2>
                      <p className="text-xs font-semibold text-slate-600">
                        Official Transport Passenger Roster &bull; Academic Session 2026-27
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-lg bg-slate-900 px-3 py-1 font-mono text-sm font-bold text-white">
                        {manifestData.route_code}
                      </span>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">
                        Date: {new Date().toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-4 rounded-xl bg-slate-50 p-3 text-[11px] border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-500">ROUTE:</span>
                      <p className="font-black text-slate-900">{manifestData.route_name}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">BUS NO:</span>
                      <p className="font-black text-slate-900">{manifestData.vehicle?.vehicle_no || "N/A"}</p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">DRIVER:</span>
                      <p className="font-bold text-slate-900">
                        {manifestData.vehicle?.driver_name} ({manifestData.vehicle?.driver_phone})
                      </p>
                    </div>
                    <div>
                      <span className="font-bold text-slate-500">PASSENGERS:</span>
                      <p className="font-black text-slate-900">
                        {manifestData.totalPassengers} / {manifestData.capacity} Seats Boarded
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stops with grouped passengers */}
                <div className="space-y-5">
                  {(manifestData.stops || []).map((stop, sIndex) => (
                    <div key={sIndex} className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100/80 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white">
                            {stop.stop_order}
                          </span>
                          <span className="font-black text-slate-900 text-xs">{stop.stop_name}</span>
                          {stop.landmark && (
                            <span className="text-[10px] text-slate-500">({stop.landmark})</span>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-3">
                          <span>Pickup: {stop.pickup_time}</span>
                          <span>Drop: {stop.drop_time}</span>
                          <span className="rounded-md bg-white px-2 py-0.5 border border-slate-200 font-bold">
                            {stop.passengerCount} Student(s)
                          </span>
                        </div>
                      </div>

                      {stop.passengers && stop.passengers.length > 0 ? (
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-1.5">Roll No</th>
                              <th className="px-3 py-1.5">Student Name</th>
                              <th className="px-3 py-1.5">Class - Sec</th>
                              <th className="px-3 py-1.5">Guardian Name</th>
                              <th className="px-3 py-1.5">Emergency Mobile</th>
                              <th className="px-3 py-1.5 text-center">Boarding Check</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {stop.passengers.map((p, pIdx) => (
                              <tr key={pIdx}>
                                <td className="px-3 py-2 font-mono font-bold text-slate-700">{p.roll_no}</td>
                                <td className="px-3 py-2 font-bold text-slate-900">{p.student_name}</td>
                                <td className="px-3 py-2 font-semibold text-slate-700">
                                  {p.class_name} - {p.section_name}
                                </td>
                                <td className="px-3 py-2 text-slate-600">{p.primary_guardian_name}</td>
                                <td className="px-3 py-2 font-semibold text-cyan-700">{p.emergency_phone}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="inline-block h-4 w-4 rounded border border-slate-400" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-2 text-center text-[10px] text-slate-400 italic">
                          No students currently boarded at this specific stop.
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Signature footer */}
                <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-600">
                  <div>
                    <p className="border-t border-slate-400 pt-1 font-semibold">Driver Signature</p>
                  </div>
                  <div>
                    <p className="border-t border-slate-400 pt-1 font-semibold">Attendant / Conductor</p>
                  </div>
                  <div>
                    <p className="border-t border-slate-400 pt-1 font-semibold">Transport In-Charge / Principal</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

