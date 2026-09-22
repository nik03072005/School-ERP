import Vehicle from "../models/Vehicle.js";
import TransportRoute from "../models/TransportRoute.js";
import StudentTransportAllocation from "../models/StudentTransportAllocation.js";
import Student from "../models/Student.js";
import Class from "../models/Class.js";
import Section from "../models/Section.js";
import User from "../models/User.js";

// ── Transport Dashboard Summary ─────────────────────────────────────────────
export const getTransportSummary = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const activeVehicles = await Vehicle.countDocuments({ status: "active" });
    const maintenanceVehicles = await Vehicle.countDocuments({ status: "maintenance" });

    const totalRoutes = await TransportRoute.countDocuments();
    const activeRoutes = await TransportRoute.countDocuments({ is_active: true });

    const activeAllocations = await StudentTransportAllocation.countDocuments({
      status: "active",
    });

    const studentsRequiringTransport = await Student.countDocuments({
      transport_required: true,
    });

    // Capacity calculation
    const vehicles = await Vehicle.find({ status: "active" }).select("seating_capacity");
    const totalCapacity = vehicles.reduce((sum, v) => sum + (v.seating_capacity || 0), 0);

    // Document Expiry Alerts (expiring in next 30 days or already expired)
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    const expiringVehicles = await Vehicle.find({
      $or: [
        { insurance_expiry_date: { $lte: thirtyDaysFromNow } },
        { fitness_expiry_date: { $lte: thirtyDaysFromNow } },
        { pollution_expiry_date: { $lte: thirtyDaysFromNow } },
      ],
    }).select("vehicle_no vehicle_model driver_name insurance_expiry_date fitness_expiry_date pollution_expiry_date");

    const documentAlerts = [];
    for (const v of expiringVehicles) {
      if (v.insurance_expiry_date && v.insurance_expiry_date <= thirtyDaysFromNow) {
        documentAlerts.push({
          vehicle_no: v.vehicle_no,
          type: "Insurance",
          expiry_date: v.insurance_expiry_date,
          is_expired: v.insurance_expiry_date < now,
        });
      }
      if (v.fitness_expiry_date && v.fitness_expiry_date <= thirtyDaysFromNow) {
        documentAlerts.push({
          vehicle_no: v.vehicle_no,
          type: "Fitness Certificate",
          expiry_date: v.fitness_expiry_date,
          is_expired: v.fitness_expiry_date < now,
        });
      }
      if (v.pollution_expiry_date && v.pollution_expiry_date <= thirtyDaysFromNow) {
        documentAlerts.push({
          vehicle_no: v.vehicle_no,
          type: "Pollution (PUC)",
          expiry_date: v.pollution_expiry_date,
          is_expired: v.pollution_expiry_date < now,
        });
      }
    }

    // Per-route stats
    const routes = await TransportRoute.find({ is_active: true })
      .populate("vehicle_id", "vehicle_no seating_capacity driver_name driver_phone")
      .lean();

    const routeStats = await Promise.all(
      routes.map(async (route) => {
        const studentCount = await StudentTransportAllocation.countDocuments({
          route_id: route._id,
          status: "active",
        });
        const capacity = route.vehicle_id?.seating_capacity || 0;
        return {
          _id: route._id,
          route_name: route.route_name,
          route_code: route.route_code,
          vehicle_no: route.vehicle_id?.vehicle_no || "Unassigned",
          driver_name: route.vehicle_id?.driver_name || "N/A",
          driver_phone: route.vehicle_id?.driver_phone || "N/A",
          total_stops: route.stops?.length || 0,
          capacity,
          allocated_count: studentCount,
          occupancy_pct: capacity > 0 ? Math.round((studentCount / capacity) * 100) : 0,
        };
      })
    );

    res.json({
      success: true,
      summary: {
        totalVehicles,
        activeVehicles,
        maintenanceVehicles,
        totalRoutes,
        activeRoutes,
        activeAllocations,
        studentsRequiringTransport,
        totalCapacity,
        capacityUtilizationPct:
          totalCapacity > 0 ? Math.round((activeAllocations / totalCapacity) * 100) : 0,
        documentAlerts,
        routeStats,
      },
    });
  } catch (error) {
    console.error("Error fetching transport summary:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Vehicle Management ──────────────────────────────────────────────────────
export const getVehicles = async (req, res) => {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { vehicle_no: { $regex: search, $options: "i" } },
        { vehicle_model: { $regex: search, $options: "i" } },
        { driver_name: { $regex: search, $options: "i" } },
        { driver_phone: { $regex: search, $options: "i" } },
      ];
    }

    const vehicles = await Vehicle.find(query).sort({ vehicle_no: 1 }).lean();

    // Attach active route assignment info
    const enriched = await Promise.all(
      vehicles.map(async (v) => {
        const assignedRoute = await TransportRoute.findOne({
          vehicle_id: v._id,
          is_active: true,
        }).select("route_name route_code");

        let activePassengers = 0;
        if (assignedRoute) {
          activePassengers = await StudentTransportAllocation.countDocuments({
            route_id: assignedRoute._id,
            status: "active",
          });
        }

        return {
          ...v,
          assignedRoute: assignedRoute || null,
          activePassengers,
        };
      })
    );

    res.json({ success: true, vehicles: enriched });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const {
      vehicle_no,
      vehicle_model,
      vehicle_type,
      seating_capacity,
      driver_name,
      driver_phone,
      driver_license,
      attendant_name,
      attendant_phone,
      insurance_policy_no,
      insurance_expiry_date,
      fitness_expiry_date,
      pollution_expiry_date,
      gps_device_id,
      status,
      notes,
    } = req.body;

    if (!vehicle_no || !vehicle_model || !seating_capacity || !driver_name || !driver_phone) {
      return res.status(400).json({
        success: false,
        message: "Vehicle No, Model, Seating Capacity, Driver Name and Phone are required",
      });
    }

    const existing = await Vehicle.findOne({
      vehicle_no: vehicle_no.trim().toUpperCase(),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Vehicle with registration number ${vehicle_no} already exists`,
      });
    }

    const vehicle = await Vehicle.create({
      vehicle_no: vehicle_no.trim().toUpperCase(),
      vehicle_model: vehicle_model.trim(),
      vehicle_type: vehicle_type || "bus",
      seating_capacity: Number(seating_capacity),
      driver_name: driver_name.trim(),
      driver_phone: driver_phone.trim(),
      driver_license: driver_license ? driver_license.trim().toUpperCase() : "",
      attendant_name: attendant_name ? attendant_name.trim() : "",
      attendant_phone: attendant_phone ? attendant_phone.trim() : "",
      insurance_policy_no: insurance_policy_no ? insurance_policy_no.trim() : "",
      insurance_expiry_date: insurance_expiry_date || null,
      fitness_expiry_date: fitness_expiry_date || null,
      pollution_expiry_date: pollution_expiry_date || null,
      gps_device_id: gps_device_id ? gps_device_id.trim() : "",
      status: status || "active",
      notes: notes ? notes.trim() : "",
    });

    res.status(201).json({
      success: true,
      message: "Vehicle added successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.vehicle_no) {
      updateData.vehicle_no = updateData.vehicle_no.trim().toUpperCase();
      const existing = await Vehicle.findOne({
        vehicle_no: updateData.vehicle_no,
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Vehicle number ${updateData.vehicle_no} is already assigned to another vehicle`,
        });
      }
    }

    const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    res.json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const assignedRoute = await TransportRoute.findOne({ vehicle_id: id });
    if (assignedRoute) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete vehicle. It is currently assigned to route "${assignedRoute.route_name}". Please reassign the route first.`,
      });
    }

    const vehicle = await Vehicle.findByIdAndDelete(id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    res.json({ success: true, message: "Vehicle deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Route & Stops Management ────────────────────────────────────────────────
export const getRoutes = async (req, res) => {
  try {
    const routes = await TransportRoute.find()
      .populate("vehicle_id")
      .sort({ route_name: 1 })
      .lean();

    const enriched = await Promise.all(
      routes.map(async (r) => {
        const studentCount = await StudentTransportAllocation.countDocuments({
          route_id: r._id,
          status: "active",
        });
        const capacity = r.vehicle_id?.seating_capacity || 0;
        return {
          ...r,
          allocated_count: studentCount,
          capacity,
          occupancy_pct: capacity > 0 ? Math.round((studentCount / capacity) * 100) : 0,
        };
      })
    );

    res.json({ success: true, routes: enriched });
  } catch (error) {
    console.error("Error fetching routes:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRouteById = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await TransportRoute.findById(id).populate("vehicle_id").lean();

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const allocations = await StudentTransportAllocation.find({
      route_id: id,
      status: "active",
    })
      .populate({
        path: "student_id",
        populate: [
          { path: "user_id", select: "first_name last_name mobile email avatar" },
          { path: "class_id", select: "name" },
          { path: "section_id", select: "name" },
        ],
      })
      .sort({ pickup_stop_name: 1 })
      .lean();

    const capacity = route.vehicle_id?.seating_capacity || 0;
    const allocated_count = allocations.length;

    res.json({
      success: true,
      route: {
        ...route,
        allocations,
        capacity,
        allocated_count,
        occupancy_pct: capacity > 0 ? Math.round((allocated_count / capacity) * 100) : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching route details:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createRoute = async (req, res) => {
  try {
    const {
      route_name,
      route_code,
      vehicle_id,
      start_location,
      end_location,
      stops,
      description,
      is_active,
    } = req.body;

    if (!route_name || !route_code) {
      return res.status(400).json({
        success: false,
        message: "Route Name and Route Code are required",
      });
    }

    const existingCode = await TransportRoute.findOne({
      route_code: route_code.trim().toUpperCase(),
    });

    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: `Route code ${route_code} already exists`,
      });
    }

    // Format stops ensuring stop_order is sequential
    const formattedStops = (stops || []).map((stop, index) => ({
      stop_name: stop.stop_name?.trim() || `Stop ${index + 1}`,
      stop_order: stop.stop_order !== undefined ? Number(stop.stop_order) : index + 1,
      pickup_time: stop.pickup_time || "",
      drop_time: stop.drop_time || "",
      fare_amount: Number(stop.fare_amount || 0),
      landmark: stop.landmark || "",
    }));

    const route = await TransportRoute.create({
      route_name: route_name.trim(),
      route_code: route_code.trim().toUpperCase(),
      vehicle_id: vehicle_id || null,
      start_location: start_location ? start_location.trim() : "",
      end_location: end_location ? end_location.trim() : "",
      stops: formattedStops,
      description: description ? description.trim() : "",
      is_active: is_active !== undefined ? is_active : true,
    });

    const populated = await TransportRoute.findById(route._id).populate("vehicle_id");

    res.status(201).json({
      success: true,
      message: "Route created successfully",
      route: populated,
    });
  } catch (error) {
    console.error("Error creating route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      route_name,
      route_code,
      vehicle_id,
      start_location,
      end_location,
      stops,
      description,
      is_active,
    } = req.body;

    if (route_code) {
      const existing = await TransportRoute.findOne({
        route_code: route_code.trim().toUpperCase(),
        _id: { $ne: id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Route code ${route_code} is already in use by another route`,
        });
      }
    }

    const updateFields = {
      ...(route_name && { route_name: route_name.trim() }),
      ...(route_code && { route_code: route_code.trim().toUpperCase() }),
      ...(vehicle_id !== undefined && { vehicle_id: vehicle_id || null }),
      ...(start_location !== undefined && { start_location: start_location.trim() }),
      ...(end_location !== undefined && { end_location: end_location.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(is_active !== undefined && { is_active }),
    };

    if (stops && Array.isArray(stops)) {
      updateFields.stops = stops.map((stop, index) => ({
        _id: stop._id || undefined,
        stop_name: stop.stop_name?.trim() || `Stop ${index + 1}`,
        stop_order: stop.stop_order !== undefined ? Number(stop.stop_order) : index + 1,
        pickup_time: stop.pickup_time || "",
        drop_time: stop.drop_time || "",
        fare_amount: Number(stop.fare_amount || 0),
        landmark: stop.landmark || "",
      }));
    }

    const route = await TransportRoute.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    }).populate("vehicle_id");

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.json({
      success: true,
      message: "Route updated successfully",
      route,
    });
  } catch (error) {
    console.error("Error updating route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;

    const activeAllocations = await StudentTransportAllocation.countDocuments({
      route_id: id,
      status: "active",
    });

    if (activeAllocations > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete route with ${activeAllocations} active student allocation(s). Please transfer or remove student allocations first.`,
      });
    }

    const route = await TransportRoute.findByIdAndDelete(id);
    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    res.json({ success: true, message: "Route deleted successfully" });
  } catch (error) {
    console.error("Error deleting route:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Student Bus Route Allocation ────────────────────────────────────────────
export const getAllocations = async (req, res) => {
  try {
    const { route_id, class_id, section_id, status = "active", search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (route_id) query.route_id = route_id;

    let allocations = await StudentTransportAllocation.find(query)
      .populate({
        path: "student_id",
        populate: [
          { path: "user_id", select: "first_name last_name mobile email avatar" },
          { path: "class_id", select: "name" },
          { path: "section_id", select: "name" },
        ],
      })
      .populate({
        path: "route_id",
        populate: { path: "vehicle_id", select: "vehicle_no vehicle_model driver_name driver_phone seating_capacity" },
      })
      .sort({ createdAt: -1 })
      .lean();

    // In-memory filter for class_id, section_id, and search if populated
    if (class_id) {
      allocations = allocations.filter(
        (a) => a.student_id?.class_id?._id?.toString() === class_id
      );
    }

    if (section_id) {
      allocations = allocations.filter(
        (a) => a.student_id?.section_id?._id?.toString() === section_id
      );
    }

    if (search) {
      const q = search.toLowerCase();
      allocations = allocations.filter((a) => {
        const student = a.student_id;
        const user = student?.user_id;
        const name = `${user?.first_name || ""} ${user?.last_name || ""}`.toLowerCase();
        const roll = (student?.roll_no || "").toLowerCase();
        const adm = (student?.admission_no || "").toLowerCase();
        const stop = (a.pickup_stop_name || "").toLowerCase();
        const phone = (user?.mobile || "").toLowerCase();
        return (
          name.includes(q) ||
          roll.includes(q) ||
          adm.includes(q) ||
          stop.includes(q) ||
          phone.includes(q)
        );
      });
    }

    res.json({ success: true, count: allocations.length, allocations });
  } catch (error) {
    console.error("Error fetching allocations:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const allocateStudent = async (req, res) => {
  try {
    const {
      student_id,
      route_id,
      pickup_stop_id,
      drop_stop_id,
      allocation_type = "both_ways",
      academic_year = "2026-27",
      notes = "",
    } = req.body;

    if (!student_id || !route_id) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Route ID are required",
      });
    }

    const student = await Student.findById(student_id).populate("user_id", "first_name last_name");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const route = await TransportRoute.findById(route_id).populate("vehicle_id");
    if (!route) {
      return res.status(404).json({ success: false, message: "Transport Route not found" });
    }

    // Capacity Check
    const currentAllocatedCount = await StudentTransportAllocation.countDocuments({
      route_id,
      status: "active",
      student_id: { $ne: student_id },
    });

    const capacity = route.vehicle_id?.seating_capacity || 0;
    if (capacity > 0 && currentAllocatedCount >= capacity) {
      return res.status(400).json({
        success: false,
        message: `Bus Route "${route.route_name}" is at full capacity (${currentAllocatedCount}/${capacity} seats). Cannot allocate more students without increasing vehicle capacity or assigning a larger bus.`,
      });
    }

    // Resolve stop names
    let pickup_stop_name = "";
    let drop_stop_name = "";

    if (pickup_stop_id && route.stops?.length) {
      const pStop = route.stops.find((s) => s._id.toString() === pickup_stop_id);
      if (pStop) pickup_stop_name = pStop.stop_name;
    }

    if (drop_stop_id && route.stops?.length) {
      const dStop = route.stops.find((s) => s._id.toString() === drop_stop_id);
      if (dStop) drop_stop_name = dStop.stop_name;
    } else if (pickup_stop_name) {
      // Default drop stop to pickup stop if same
      drop_stop_name = pickup_stop_name;
    }

    // Deactivate previous active allocation for this student
    await StudentTransportAllocation.updateMany(
      { student_id, status: "active" },
      { $set: { status: "cancelled", notes: "Superseded by new route allocation" } }
    );

    // Create new allocation
    const allocation = await StudentTransportAllocation.create({
      student_id,
      route_id,
      pickup_stop_id: pickup_stop_id || null,
      pickup_stop_name,
      drop_stop_id: drop_stop_id || pickup_stop_id || null,
      drop_stop_name,
      allocation_type,
      academic_year,
      notes,
      status: "active",
      created_by: req.user?._id || null,
    });

    // Synchronize Student record
    student.transport_required = true;
    if (pickup_stop_name) {
      student.pickup_drop_address = pickup_stop_name;
    }
    await student.save();

    const populated = await StudentTransportAllocation.findById(allocation._id)
      .populate({
        path: "student_id",
        populate: [
          { path: "user_id", select: "first_name last_name mobile email avatar" },
          { path: "class_id", select: "name" },
          { path: "section_id", select: "name" },
        ],
      })
      .populate({
        path: "route_id",
        populate: { path: "vehicle_id" },
      });

    res.status(201).json({
      success: true,
      message: `Student ${student.user_id?.first_name || ""} allocated to ${route.route_name} successfully`,
      allocation: populated,
    });
  } catch (error) {
    console.error("Error allocating student to transport:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkAllocateStudents = async (req, res) => {
  try {
    const {
      student_ids,
      route_id,
      pickup_stop_id,
      drop_stop_id,
      allocation_type = "both_ways",
      academic_year = "2026-27",
    } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0 || !route_id) {
      return res.status(400).json({
        success: false,
        message: "Student IDs array and Route ID are required",
      });
    }

    const route = await TransportRoute.findById(route_id).populate("vehicle_id");
    if (!route) {
      return res.status(404).json({ success: false, message: "Transport Route not found" });
    }

    let pickup_stop_name = "";
    let drop_stop_name = "";

    if (pickup_stop_id && route.stops?.length) {
      const pStop = route.stops.find((s) => s._id.toString() === pickup_stop_id);
      if (pStop) pickup_stop_name = pStop.stop_name;
    }
    if (drop_stop_id && route.stops?.length) {
      const dStop = route.stops.find((s) => s._id.toString() === drop_stop_id);
      if (dStop) drop_stop_name = dStop.stop_name;
    } else if (pickup_stop_name) {
      drop_stop_name = pickup_stop_name;
    }

    let allocatedCount = 0;
    const errors = [];

    for (const sId of student_ids) {
      try {
        await StudentTransportAllocation.updateMany(
          { student_id: sId, status: "active" },
          { $set: { status: "cancelled" } }
        );

        await StudentTransportAllocation.create({
          student_id: sId,
          route_id,
          pickup_stop_id: pickup_stop_id || null,
          pickup_stop_name,
          drop_stop_id: drop_stop_id || pickup_stop_id || null,
          drop_stop_name,
          allocation_type,
          academic_year,
          status: "active",
          created_by: req.user?._id || null,
        });

        await Student.findByIdAndUpdate(sId, {
          transport_required: true,
          ...(pickup_stop_name ? { pickup_drop_address: pickup_stop_name } : {}),
        });

        allocatedCount++;
      } catch (err) {
        errors.push({ student_id: sId, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully allocated ${allocatedCount} students to route ${route.route_name}`,
      allocatedCount,
      errors,
    });
  } catch (error) {
    console.error("Error bulk allocating students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reset_student_record = false } = req.body;

    const allocation = await StudentTransportAllocation.findById(id);
    if (!allocation) {
      return res.status(404).json({ success: false, message: "Allocation not found" });
    }

    allocation.status = "cancelled";
    await allocation.save();

    if (reset_student_record && allocation.student_id) {
      await Student.findByIdAndUpdate(allocation.student_id, {
        transport_required: false,
      });
    }

    res.json({
      success: true,
      message: "Student transport allocation cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling transport allocation:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Unallocated Students List ───────────────────────────────────────────────
export const getUnallocatedStudents = async (req, res) => {
  try {
    const { class_id, section_id, transport_required_only = "false" } = req.query;

    const activeAllocations = await StudentTransportAllocation.find({
      status: "active",
    }).select("student_id");

    const allocatedStudentIds = activeAllocations.map((a) => a.student_id);

    const filter = {
      _id: { $nin: allocatedStudentIds },
    };

    if (class_id) filter.class_id = class_id;
    if (section_id) filter.section_id = section_id;
    if (transport_required_only === "true") {
      filter.transport_required = true;
    }

    const students = await Student.find(filter)
      .populate("user_id", "first_name last_name email mobile avatar")
      .populate("class_id", "name")
      .populate("section_id", "name")
      .sort({ "user_id.first_name": 1 })
      .lean();

    res.json({ success: true, count: students.length, students });
  } catch (error) {
    console.error("Error getting unallocated students:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Route Manifest (Printable Passenger Sheet for Drivers) ─────────────────
export const getRouteManifest = async (req, res) => {
  try {
    const { routeId } = req.params;

    const route = await TransportRoute.findById(routeId)
      .populate("vehicle_id")
      .lean();

    if (!route) {
      return res.status(404).json({ success: false, message: "Route not found" });
    }

    const allocations = await StudentTransportAllocation.find({
      route_id: routeId,
      status: "active",
    })
      .populate({
        path: "student_id",
        populate: [
          { path: "user_id", select: "first_name last_name mobile avatar" },
          { path: "class_id", select: "name" },
          { path: "section_id", select: "name" },
        ],
      })
      .lean();

    // Group students by pickup stop
    const stopsWithPassengers = (route.stops || []).map((stop) => {
      const passengers = allocations.filter(
        (a) =>
          (a.pickup_stop_id && a.pickup_stop_id.toString() === stop._id.toString()) ||
          a.pickup_stop_name === stop.stop_name
      );
      return {
        ...stop,
        passengerCount: passengers.length,
        passengers: passengers.map((p) => ({
          allocation_id: p._id,
          student_id: p.student_id?._id,
          admission_no: p.student_id?.admission_no,
          roll_no: p.student_id?.roll_no,
          student_name: `${p.student_id?.user_id?.first_name || ""} ${p.student_id?.user_id?.last_name || ""}`.trim(),
          class_name: p.student_id?.class_id?.name || "N/A",
          section_name: p.student_id?.section_id?.name || "N/A",
          primary_guardian_name: p.student_id?.primary_guardian_name || p.student_id?.father_name || "N/A",
          emergency_phone: p.student_id?.primary_guardian_phone || p.student_id?.user_id?.mobile || "N/A",
          allocation_type: p.allocation_type,
        })),
      };
    });

    res.json({
      success: true,
      manifest: {
        route_name: route.route_name,
        route_code: route.route_code,
        start_location: route.start_location,
        end_location: route.end_location,
        vehicle: route.vehicle_id || null,
        totalPassengers: allocations.length,
        capacity: route.vehicle_id?.seating_capacity || 0,
        stops: stopsWithPassengers,
      },
    });
  } catch (error) {
    console.error("Error generating route manifest:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Student / Parent Self-Service ───────────────────────────────────────────
export const getMyTransport = async (req, res) => {
  try {
    const student = await Student.findOne({ user_id: req.user._id });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found" });
    }

    const allocation = await StudentTransportAllocation.findOne({
      student_id: student._id,
      status: "active",
    })
      .populate({
        path: "route_id",
        populate: { path: "vehicle_id" },
      })
      .lean();

    if (!allocation || !allocation.route_id) {
      return res.json({
        success: true,
        is_allocated: false,
        transport_required: Boolean(student.transport_required),
        pickup_drop_address: student.pickup_drop_address || "",
        message: "No active school bus allocation found for this student.",
      });
    }

    const route = allocation.route_id;
    const vehicle = route.vehicle_id;

    // Find specific stop times
    let pickupStopInfo = null;
    let dropStopInfo = null;

    if (route.stops && Array.isArray(route.stops)) {
      pickupStopInfo = route.stops.find(
        (s) =>
          (allocation.pickup_stop_id && s._id.toString() === allocation.pickup_stop_id.toString()) ||
          s.stop_name === allocation.pickup_stop_name
      );
      dropStopInfo = route.stops.find(
        (s) =>
          (allocation.drop_stop_id && s._id.toString() === allocation.drop_stop_id.toString()) ||
          s.stop_name === allocation.drop_stop_name
      );
    }

    res.json({
      success: true,
      is_allocated: true,
      allocation: {
        _id: allocation._id,
        allocation_type: allocation.allocation_type,
        academic_year: allocation.academic_year,
        start_date: allocation.start_date,
        pickup_stop_name: allocation.pickup_stop_name || pickupStopInfo?.stop_name || "School Bus Stop",
        pickup_time: pickupStopInfo?.pickup_time || "Morning",
        drop_stop_name: allocation.drop_stop_name || dropStopInfo?.stop_name || "School Bus Stop",
        drop_time: dropStopInfo?.drop_time || "Afternoon",
        route: {
          _id: route._id,
          route_name: route.route_name,
          route_code: route.route_code,
          start_location: route.start_location,
          end_location: route.end_location,
          stops: route.stops || [],
        },
        vehicle: vehicle
          ? {
              _id: vehicle._id,
              vehicle_no: vehicle.vehicle_no,
              vehicle_model: vehicle.vehicle_model,
              vehicle_type: vehicle.vehicle_type,
              driver_name: vehicle.driver_name,
              driver_phone: vehicle.driver_phone,
              attendant_name: vehicle.attendant_name,
              attendant_phone: vehicle.attendant_phone,
              gps_device_id: vehicle.gps_device_id,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error retrieving student transport info:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

