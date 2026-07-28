const parcelsService = require('./parcels.service');

const trackParcel = async (req, res, next) => {
  try {
    const { trackingNumber } = req.params;
    const parcel = await parcelsService.trackParcel(trackingNumber);
    res.json({
      success: true,
      message: 'Parcel status fetched successfully',
      data: parcel
    });
  } catch (err) {
    next(err);
  }
};

const bookParcel = async (req, res, next) => {
  try {
    const parcel = await parcelsService.bookParcel(req.body);
    res.status(201).json({
      success: true,
      message: 'Parcel booked successfully',
      data: parcel
    });
  } catch (err) {
    next(err);
  }
};

const estimatePrice = async (req, res, next) => {
  try {
    const price = parcelsService.calculatePrice(req.body);
    res.json({
      success: true,
      message: 'Price estimated successfully',
      data: { estimated_cost: price }
    });
  } catch (err) {
    next(err);
  }
};

const getMyParcels = async (req, res, next) => {
  try {
    const parcels = await parcelsService.getUserParcels(req.user?.id);
    res.json({
      success: true,
      message: 'Customer parcels fetched',
      data: parcels
    });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { trackingNumber, status, location, notes } = req.body;
    const updated = await parcelsService.updateParcelStatus(trackingNumber, status, location, notes);
    res.json({
      success: true,
      message: 'Parcel status updated',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

const getBranches = async (req, res, next) => {
  try {
    const branches = parcelsService.getBranches();
    res.json({
      success: true,
      data: branches
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  trackParcel,
  bookParcel,
  estimatePrice,
  getMyParcels,
  updateStatus,
  getBranches
};
