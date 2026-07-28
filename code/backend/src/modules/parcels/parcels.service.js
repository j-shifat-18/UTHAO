const parcelsRepo = require('./parcels.repository');

const categoryPricing = {
  document: { base: 50, perKg: 10 },
  small_package: { base: 80, perKg: 25 },
  medium_package: { base: 120, perKg: 20 },
  large_package: { base: 200, perKg: 15 },
  fragile: { base: 150, perKg: 35 },
  perishable: { base: 180, perKg: 30 },
  electronics: { base: 160, perKg: 30 }
};

const priorityMultiplier = {
  standard: 1.0,
  express: 1.5,
  overnight: 2.2
};

const calculatePrice = ({ category = 'small_package', weightKg = 1.0, priority = 'standard', isFragile = false }) => {
  const catInfo = categoryPricing[category] || categoryPricing.small_package;
  const weight = Math.max(0.5, parseFloat(weightKg) || 1.0);
  let total = catInfo.base + (weight * catInfo.perKg);
  
  if (priorityMultiplier[priority]) {
    total *= priorityMultiplier[priority];
  }
  if (isFragile && category !== 'fragile') {
    total += 40.0;
  }

  return Math.round(total * 100) / 100;
};

const trackParcel = async (trackingNumber) => {
  if (!trackingNumber) throw new Error('Tracking number is required');
  const parcel = await parcelsRepo.findByTrackingNumber(trackingNumber);
  if (!parcel) {
    const error = new Error('Parcel not found with the specified tracking ID');
    error.statusCode = 404;
    throw error;
  }
  return parcel;
};

const bookParcel = async (data) => {
  const calculatedCost = calculatePrice({
    category: data.category,
    weightKg: data.weight_kg,
    priority: data.priority,
    isFragile: data.is_fragile
  });

  const parcelData = {
    ...data,
    delivery_cost: calculatedCost
  };

  return await parcelsRepo.createParcel(parcelData);
};

const getUserParcels = async (userId) => {
  return await parcelsRepo.getCustomerParcels(userId);
};

const updateParcelStatus = async (trackingNumber, newStatus, location, notes) => {
  return await parcelsRepo.updateStatus(trackingNumber, newStatus, location, notes);
};

const getBranches = () => {
  return parcelsRepo.getBranches();
};

module.exports = {
  calculatePrice,
  trackParcel,
  bookParcel,
  getUserParcels,
  updateParcelStatus,
  getBranches
};
