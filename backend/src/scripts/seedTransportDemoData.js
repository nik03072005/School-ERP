import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Vehicle from "../models/Vehicle.js";
import TransportRoute from "../models/TransportRoute.js";
import StudentTransportAllocation from "../models/StudentTransportAllocation.js";
import Student from "../models/Student.js";

dotenv.config();

const DEMO_VEHICLES = [
  {
    vehicle_no: "UP-32-BN-1042",
    vehicle_model: "Tata Starbus 34-Seater Ultra",
    vehicle_type: "bus",
    seating_capacity: 34,
    driver_name: "Ram Lakhan Yadav",
    driver_phone: "9839102456",
    driver_license: "UP32-2015-0045129",
    attendant_name: "Sunita Devi",
    attendant_phone: "9839108923",
    insurance_policy_no: "ICICI-LOMB-892314",
    insurance_expiry_date: new Date(2027, 2, 15),
    fitness_expiry_date: new Date(2027, 4, 20),
    pollution_expiry_date: new Date(2026, 11, 10),
    gps_device_id: "GPS-KG-01",
    status: "active",
    notes: "Primary bus covering East Gomti Nagar sector.",
  },
  {
    vehicle_no: "UP-32-CJ-2384",
    vehicle_model: "Eicher Skyline Pro 3008",
    vehicle_type: "bus",
    seating_capacity: 32,
    driver_name: "Surendra Pratap Singh",
    driver_phone: "9838204891",
    driver_license: "UP32-2017-0091823",
    attendant_name: "Meena Sharma",
    attendant_phone: "9838207712",
    insurance_policy_no: "BAJAJ-ALLZ-472910",
    insurance_expiry_date: new Date(2027, 1, 28),
    fitness_expiry_date: new Date(2027, 5, 12),
    pollution_expiry_date: new Date(2026, 10, 18),
    gps_device_id: "GPS-KG-02",
    status: "active",
    notes: "Serving Aliganj & Mahanagar arterial route.",
  },
  {
    vehicle_no: "UP-32-DK-4590",
    vehicle_model: "Force Traveller 26-Seater Monobus",
    vehicle_type: "mini_bus",
    seating_capacity: 26,
    driver_name: "Mohammed Irfan",
    driver_phone: "9792305541",
    driver_license: "UP32-2018-0012784",
    attendant_name: "Anita Verma",
    attendant_phone: "9792308901",
    insurance_policy_no: "TATA-AIG-682103",
    insurance_expiry_date: new Date(2027, 0, 10),
    fitness_expiry_date: new Date(2027, 3, 5),
    pollution_expiry_date: new Date(2026, 9, 25),
    gps_device_id: "GPS-KG-03",
    status: "active",
    notes: "Indira Nagar & Ring Road shuttle.",
  },
  {
    vehicle_no: "UP-32-EL-7812",
    vehicle_model: "Force Traveller 18-Seater Super Luxury",
    vehicle_type: "van",
    seating_capacity: 18,
    driver_name: "Harish Chandra Joshi",
    driver_phone: "9415403219",
    driver_license: "UP32-2016-0034901",
    attendant_name: "Pooja Rawat",
    attendant_phone: "9415406644",
    insurance_policy_no: "HDFC-ERGO-193847",
    insurance_expiry_date: new Date(2026, 11, 31),
    fitness_expiry_date: new Date(2027, 2, 22),
    pollution_expiry_date: new Date(2026, 11, 1),
    gps_device_id: "GPS-KG-04",
    status: "active",
    notes: "Hazratganj, Cantt & Raj Bhavan residential corridor.",
  },
  {
    vehicle_no: "UP-32-FM-9021",
    vehicle_model: "Tata Winger 15-Seater",
    vehicle_type: "van",
    seating_capacity: 15,
    driver_name: "Dinesh Kumar Maurya",
    driver_phone: "9125501832",
    driver_license: "UP32-2020-0083219",
    attendant_name: "Suman Tiwari",
    attendant_phone: "9125509911",
    insurance_policy_no: "NEW-INDIA-938201",
    insurance_expiry_date: new Date(2027, 3, 10),
    fitness_expiry_date: new Date(2027, 6, 15),
    pollution_expiry_date: new Date(2026, 10, 5),
    gps_device_id: "GPS-KG-05",
    status: "active",
    notes: "Vikas Nagar & Kalyanpur feeder van.",
  },
];

const DEMO_ROUTES = [
  {
    route_name: "Route 01 - Gomti Nagar Express",
    route_code: "RT-01",
    vehicle_index: 0,
    start_location: "Patrakarpuram Chauraha",
    end_location: "Kidz Galaxy School Campus",
    description: "Covers Patrakarpuram, Husariya, Manoj Pandey Chowk, and Dayal Paradise axis.",
    stops: [
      {
        stop_name: "Patrakarpuram Chauraha",
        stop_order: 1,
        pickup_time: "07:10 AM",
        drop_time: "02:40 PM",
        fare_amount: 1800,
        landmark: "Opposite SBI Main Branch",
      },
      {
        stop_name: "Husariya Crossing",
        stop_order: 2,
        pickup_time: "07:20 AM",
        drop_time: "02:30 PM",
        fare_amount: 1800,
        landmark: "Near Police Booth",
      },
      {
        stop_name: "Manoj Pandey Chowk",
        stop_order: 3,
        pickup_time: "07:30 AM",
        drop_time: "02:20 PM",
        fare_amount: 1700,
        landmark: "Near City Montessori School Crossing",
      },
      {
        stop_name: "Mithai Kheda / Mithai Toll",
        stop_order: 4,
        pickup_time: "07:40 AM",
        drop_time: "02:10 PM",
        fare_amount: 1600,
        landmark: "Near HP Petrol Pump",
      },
      {
        stop_name: "Kidz Galaxy Main Gate",
        stop_order: 5,
        pickup_time: "07:55 AM",
        drop_time: "02:00 PM",
        fare_amount: 0,
        landmark: "School Campus Entrance",
      },
    ],
  },
  {
    route_name: "Route 02 - Aliganj & Mahanagar Route",
    route_code: "RT-02",
    vehicle_index: 1,
    start_location: "Kapoorthala Complex",
    end_location: "Kidz Galaxy School Campus",
    description: "Direct service connecting Kapoorthala, Dandiya, IT Chauraha, and Nishatganj.",
    stops: [
      {
        stop_name: "Kapoorthala Plaza",
        stop_order: 1,
        pickup_time: "07:05 AM",
        drop_time: "02:45 PM",
        fare_amount: 2000,
        landmark: "Near Sahara India Bhawan",
      },
      {
        stop_name: "Dandiya Bazar Crossing",
        stop_order: 2,
        pickup_time: "07:18 AM",
        drop_time: "02:32 PM",
        fare_amount: 1900,
        landmark: "Under the pedestrian footbridge",
      },
      {
        stop_name: "IT Chauraha / Lucknow University",
        stop_order: 3,
        pickup_time: "07:28 AM",
        drop_time: "02:22 PM",
        fare_amount: 1800,
        landmark: "Metro Station Pillar #42",
      },
      {
        stop_name: "Nishatganj Bridge",
        stop_order: 4,
        pickup_time: "07:38 AM",
        drop_time: "02:12 PM",
        fare_amount: 1700,
        landmark: "Near Gole Market Turn",
      },
      {
        stop_name: "Kidz Galaxy Main Gate",
        stop_order: 5,
        pickup_time: "07:55 AM",
        drop_time: "02:00 PM",
        fare_amount: 0,
        landmark: "School Campus Entrance",
      },
    ],
  },
  {
    route_name: "Route 03 - Indira Nagar & Ring Road",
    route_code: "RT-03",
    vehicle_index: 2,
    start_location: "Munshipulia Metro Station",
    end_location: "Kidz Galaxy School Campus",
    description: "Rapid route serving Munshipulia, Bhootnath, and Polytechnic flyover junctions.",
    stops: [
      {
        stop_name: "Munshipulia Metro Pillar 118",
        stop_order: 1,
        pickup_time: "07:15 AM",
        drop_time: "02:35 PM",
        fare_amount: 1750,
        landmark: "Metro Gate No. 2",
      },
      {
        stop_name: "Bhootnath Market Crossing",
        stop_order: 2,
        pickup_time: "07:25 AM",
        drop_time: "02:25 PM",
        fare_amount: 1700,
        landmark: "Temple Gate",
      },
      {
        stop_name: "Polytechnic Chauraha",
        stop_order: 3,
        pickup_time: "07:35 AM",
        drop_time: "02:15 PM",
        fare_amount: 1600,
        landmark: "Near Flyover Service Lane",
      },
      {
        stop_name: "Kidz Galaxy Main Gate",
        stop_order: 4,
        pickup_time: "07:55 AM",
        drop_time: "02:00 PM",
        fare_amount: 0,
        landmark: "School Campus Entrance",
      },
    ],
  },
  {
    route_name: "Route 04 - Hazratganj & Cantt Shuttle",
    route_code: "RT-04",
    vehicle_index: 3,
    start_location: "GPO Hazratganj",
    end_location: "Kidz Galaxy School Campus",
    description: "VIP corridor connecting Cantt, Raj Bhavan, Hazratganj, and Bandariya Bag.",
    stops: [
      {
        stop_name: "GPO Hazratganj",
        stop_order: 1,
        pickup_time: "07:12 AM",
        drop_time: "02:38 PM",
        fare_amount: 2200,
        landmark: "Near Post Master General Office",
      },
      {
        stop_name: "Raj Bhavan Crossing",
        stop_order: 2,
        pickup_time: "07:22 AM",
        drop_time: "02:28 PM",
        fare_amount: 2100,
        landmark: "Gate No. 3 roundabout",
      },
      {
        stop_name: "Cantt Sadar Bazar",
        stop_order: 3,
        pickup_time: "07:32 AM",
        drop_time: "02:18 PM",
        fare_amount: 2000,
        landmark: "Army Mess Circle",
      },
      {
        stop_name: "Kidz Galaxy Main Gate",
        stop_order: 4,
        pickup_time: "07:55 AM",
        drop_time: "02:00 PM",
        fare_amount: 0,
        landmark: "School Campus Entrance",
      },
    ],
  },
];

export const seedTransportDemoData = async () => {
  try {
    console.log("Starting Transport & Bus Route Demo Data Seeding...");
    await connectDB();

    // 1. Seed Vehicles
    console.log("Upserting demo school transport vehicles...");
    const createdVehicles = [];
    for (const vData of DEMO_VEHICLES) {
      const v = await Vehicle.findOneAndUpdate(
        { vehicle_no: vData.vehicle_no },
        vData,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdVehicles.push(v);
    }
    console.log(`✓ ${createdVehicles.length} Vehicles ready.`);

    // 2. Seed Routes & Stops
    console.log("Upserting demo transport routes and sequenced stops...");
    const createdRoutes = [];
    for (const rData of DEMO_ROUTES) {
      const vehicle = createdVehicles[rData.vehicle_index];
      const routePayload = {
        route_name: rData.route_name,
        route_code: rData.route_code,
        vehicle_id: vehicle?._id || null,
        start_location: rData.start_location,
        end_location: rData.end_location,
        description: rData.description,
        stops: rData.stops,
        is_active: true,
      };

      const route = await TransportRoute.findOneAndUpdate(
        { route_code: rData.route_code },
        routePayload,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdRoutes.push(route);
    }
    console.log(`✓ ${createdRoutes.length} Routes with sequential stops configured.`);

    // 3. Allocate Students to Routes
    console.log("Allocating students requiring transport to routes...");
    const studentsNeedingTransport = await Student.find({ transport_required: true })
      .limit(80)
      .lean();

    let allocatedCount = 0;
    if (studentsNeedingTransport.length > 0) {
      for (let i = 0; i < studentsNeedingTransport.length; i++) {
        const student = studentsNeedingTransport[i];
        const route = createdRoutes[i % createdRoutes.length];
        const stops = route.stops || [];
        // Choose stop (excluding final school gate stop if multiple stops exist)
        const stopIndex = stops.length > 1 ? i % (stops.length - 1) : 0;
        const assignedStop = stops[stopIndex];

        const existingAllocation = await StudentTransportAllocation.findOne({
          student_id: student._id,
          status: "active",
        });

        if (!existingAllocation) {
          await StudentTransportAllocation.create({
            student_id: student._id,
            route_id: route._id,
            pickup_stop_id: assignedStop?._id || null,
            pickup_stop_name: assignedStop?.stop_name || "Assigned Stop",
            drop_stop_id: assignedStop?._id || null,
            drop_stop_name: assignedStop?.stop_name || "Assigned Stop",
            allocation_type: "both_ways",
            academic_year: "2026-27",
            status: "active",
            notes: "Seeded demo transport allocation",
          });

          // Sync student address
          if (assignedStop?.stop_name) {
            await Student.findByIdAndUpdate(student._id, {
              pickup_drop_address: assignedStop.stop_name,
            });
          }
          allocatedCount++;
        }
      }
    }

    console.log(`✓ Allocated ${allocatedCount} students to active bus routes.`);
    console.log("==========================================================");
    console.log("   TRANSPORT MODULE SEEDING COMPLETED SUCCESSFULLY!       ");
    console.log("==========================================================");

    return { createdVehicles, createdRoutes, allocatedCount };
  } catch (error) {
    console.error("Error in transport seeding:", error);
    throw error;
  }
};

// If run directly from terminal
if (process.argv[1]?.endsWith("seedTransportDemoData.js")) {
  seedTransportDemoData()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

