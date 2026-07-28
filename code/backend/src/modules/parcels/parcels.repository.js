const { query } = require('../../database/query');
const crypto = require('crypto');

// Initial pre-populated sample parcels for instant demo & testing
const memoryParcels = [
  {
    id: 'p-101',
    tracking_number: 'UTH-782910',
    sender_name: 'John Doe',
    sender_phone: '+8801712345678',
    receiver_name: 'Sarah Connor',
    receiver_phone: '+8801811223344',
    receiver_email: 'sarah@example.com',
    delivery_address_line1: 'House 42, Road 11, Banani',
    delivery_city: 'Dhaka',
    delivery_state: 'Dhaka Division',
    delivery_postal_code: '1213',
    origin_branch: 'Dhaka Central Hub',
    destination_branch: 'Banani Branch',
    category: 'electronics',
    weight_kg: 1.8,
    status: 'out_for_delivery',
    priority: 'express',
    is_fragile: true,
    delivery_cost: 215.00,
    payment_method: 'prepaid',
    is_paid: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    estimated_delivery: new Date(Date.now() + 14400000).toISOString(),
    agent: {
      name: 'Tanvir Hossain',
      phone: '+8801900112233',
      vehicle: 'Motorcycle (DH-HA-9823)',
      rating: 4.9
    },
    history: [
      { status: 'booked', location: 'Dhaka Central Hub', time: new Date(Date.now() - 86400000).toISOString(), notes: 'Parcel booked by sender' },
      { status: 'picked_up', location: 'Dhaka Central Hub', time: new Date(Date.now() - 64000000).toISOString(), notes: 'Picked up by agent' },
      { status: 'in_transit', location: 'Dhaka Express Warehouse', time: new Date(Date.now() - 32000000).toISOString(), notes: 'Processed at central hub' },
      { status: 'out_for_delivery', location: 'Banani Distribution Hub', time: new Date(Date.now() - 7200000).toISOString(), notes: 'Agent Tanvir out for delivery' }
    ]
  },
  {
    id: 'p-102',
    tracking_number: 'UTH-941028',
    sender_name: 'John Doe',
    sender_phone: '+8801712345678',
    receiver_name: 'Arif Chowdhury',
    receiver_phone: '+8801999887766',
    receiver_email: 'arif@example.com',
    delivery_address_line1: 'GEC Circle, Nasirabad',
    delivery_city: 'Chittagong',
    delivery_state: 'Chittagong Division',
    delivery_postal_code: '4000',
    origin_branch: 'Dhaka Central Hub',
    destination_branch: 'Chittagong Main Hub',
    category: 'document',
    weight_kg: 0.5,
    status: 'delivered',
    priority: 'standard',
    is_fragile: false,
    delivery_cost: 60.00,
    payment_method: 'cod',
    is_paid: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    estimated_delivery: new Date(Date.now() - 36000000).toISOString(),
    agent: {
      name: 'Rahim Uddin',
      phone: '+8801711223344',
      vehicle: 'Bicycle',
      rating: 4.8
    },
    history: [
      { status: 'booked', location: 'Dhaka Central Hub', time: new Date(Date.now() - 172800000).toISOString(), notes: 'Parcel registered' },
      { status: 'picked_up', location: 'Dhaka Central Hub', time: new Date(Date.now() - 150000000).toISOString(), notes: 'Picked up' },
      { status: 'in_transit', location: 'Highway Logistics Truck', time: new Date(Date.now() - 80000000).toISOString(), notes: 'In transit to Chittagong' },
      { status: 'delivered', location: 'Chittagong Nasirabad', time: new Date(Date.now() - 36000000).toISOString(), notes: 'Delivered to recipient with signature' }
    ]
  }
];

const branchesList = [
  { id: 1, name: 'Dhaka Central Hub', city: 'Dhaka', address: 'Tejgaon Industrial Area, Dhaka', phone: '+88029881122' },
  { id: 2, name: 'Chittagong Main Hub', city: 'Chittagong', address: 'Agrabad C/A, Chittagong', phone: '+88031712233' },
  { id: 3, name: 'Sylhet Zonal Branch', city: 'Sylhet', address: 'Zindabazar, Sylhet', phone: '+880821718899' },
  { id: 4, name: 'Rajshahi Hub', city: 'Rajshahi', address: 'Saheb Bazar, Rajshahi', phone: '+880721774411' },
  { id: 5, name: 'Khulna Hub', city: 'Khulna', address: 'KDA Avenue, Khulna', phone: '+88041720011' },
  { id: 6, name: 'Barishal Branch', city: 'Barishal', address: 'Sadat Road, Barishal', phone: '+88043164422' }
];

const findByTrackingNumber = async (trackingNumber) => {
  try {
    const res = await query(`SELECT * FROM parcels WHERE tracking_number = $1`, [trackingNumber]);
    if (res.rows.length > 0) return res.rows[0];
  } catch (e) {
    // fallback
  }
  return memoryParcels.find(p => p.tracking_number.toUpperCase() === trackingNumber.toUpperCase()) || null;
};

const getCustomerParcels = async (customerId) => {
  try {
    const res = await query(`SELECT * FROM parcels ORDER BY created_at DESC`);
    if (res.rows.length > 0) return res.rows;
  } catch (e) {
    // fallback
  }
  return memoryParcels;
};

const createParcel = async (parcelData) => {
  const trackingNumber = 'UTH-' + Math.floor(100000 + Math.random() * 900000);
  const newParcel = {
    id: crypto.randomUUID(),
    tracking_number: trackingNumber,
    sender_name: parcelData.sender_name || 'Customer',
    sender_phone: parcelData.sender_phone || '+8801700000000',
    receiver_name: parcelData.receiver_name,
    receiver_phone: parcelData.receiver_phone,
    receiver_email: parcelData.receiver_email || '',
    delivery_address_line1: parcelData.delivery_address_line1,
    delivery_city: parcelData.delivery_city,
    delivery_state: parcelData.delivery_state || 'Dhaka',
    delivery_postal_code: parcelData.delivery_postal_code || '1200',
    origin_branch: parcelData.origin_branch || 'Dhaka Central Hub',
    destination_branch: parcelData.destination_branch || 'Local Hub',
    category: parcelData.category || 'small_package',
    weight_kg: parseFloat(parcelData.weight_kg) || 1.0,
    status: 'booked',
    priority: parcelData.priority || 'standard',
    is_fragile: Boolean(parcelData.is_fragile),
    delivery_cost: parseFloat(parcelData.delivery_cost) || 100.0,
    payment_method: parcelData.payment_method || 'prepaid',
    is_paid: true,
    created_at: new Date().toISOString(),
    estimated_delivery: new Date(Date.now() + 86400000 * 2).toISOString(),
    agent: {
      name: 'Assigned Agent (Pending)',
      phone: '+8801700000000',
      vehicle: 'Courier Van',
      rating: 4.9
    },
    history: [
      {
        status: 'booked',
        location: parcelData.origin_branch || 'Origin Hub',
        time: new Date().toISOString(),
        notes: 'Parcel booked and label generated'
      }
    ]
  };

  try {
    // Attempt SQL insert if DB online
    await query(
      `INSERT INTO parcels (tracking_number, receiver_name, receiver_phone, delivery_address_line1, delivery_city, delivery_state, delivery_postal_code, category_id, weight_kg, delivery_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8, $9, $10)`,
      [newParcel.tracking_number, newParcel.receiver_name, newParcel.receiver_phone, newParcel.delivery_address_line1, newParcel.delivery_city, newParcel.delivery_state, newParcel.delivery_postal_code, newParcel.weight_kg, newParcel.delivery_cost, newParcel.status]
    );
  } catch (e) {
    // Save into memory list
  }
  memoryParcels.unshift(newParcel);
  return newParcel;
};

const updateStatus = async (trackingNumber, newStatus, location, notes) => {
  const parcel = await findByTrackingNumber(trackingNumber);
  if (!parcel) return null;
  
  parcel.status = newStatus;
  if (!parcel.history) parcel.history = [];
  parcel.history.push({
    status: newStatus,
    location: location || 'Branch Hub',
    time: new Date().toISOString(),
    notes: notes || `Status updated to ${newStatus}`
  });
  return parcel;
};

const getBranches = () => branchesList;

module.exports = {
  findByTrackingNumber,
  getCustomerParcels,
  createParcel,
  updateStatus,
  getBranches,
  memoryParcels
};
