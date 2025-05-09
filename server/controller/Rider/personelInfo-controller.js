const cloudinary = require('cloudinary').v2;
const Rider = require('../../model/Rider/personelInfo-model');
const { Business, Branch } = require('../../model/Branch Owner/business-model');
const Salesperson = require('../../model/Branch Owner/salesperson-model');
const Order = require('../../model/orders-model');
const mongoose = require('mongoose');
const CartSummary = require('../../model/Customer/cartSummary-model')


async function addRiderDetails(req, res){
    try {
        const { fullName, contactNumber, city, bikeNumber, cnicNumber, userId } = req.body;
        const files = req.files;
    
        if (!files || !files.cnicFront || !files.cnicBack || !files.bikeDocuments) {
          return res.status(400).json({ message: "All required image fields must be uploaded." });
        }
    
        // Upload images to Cloudinary
        const uploadToCloudinary = async (file) => {
          const result = await cloudinary.uploader.upload(file.path);
          return result.url;
        };

        console.log("Image",uploadToCloudinary)
    
        const cnicFrontUrl = await uploadToCloudinary(files.cnicFront[0]);
        const cnicBackUrl = await uploadToCloudinary(files.cnicBack[0]);
        const bikeDocsUrl = await uploadToCloudinary(files.bikeDocuments[0]);

        console.log("Image",bikeDocsUrl)
    
        // Create new rider entry
        const newRider = new Rider({
          riderId: userId, 
          name: fullName,
          contactNo: contactNumber,
          CNIC: cnicNumber,
          city,
          bikeNo: bikeNumber,
          CNICFrontPath: cnicFrontUrl,
          CNICBackPath: cnicBackUrl,
          motorCycleDocPath: bikeDocsUrl,
          isApproved: false // Default approval
        });
    
        // Save to the database
        const savedRider = await newRider.save();
    
        res.status(201).json({ message: 'Rider added successfully', data: savedRider });
    
    } catch (error) {
        console.error("Error adding rider:", error);
        res.status(500).json({ message: "Error adding rider", error: error.message });
    }
}

async function listOfSalesperson(req, res){
    try {
        const { riderId } = req.query;
    
        // Step 1: Get Rider and their city
        const rider = await Rider.findOne({riderId});
        if (!rider) {
          return res.status(404).json({ message: 'Rider not found' });
        }
    
        const riderCity = rider.city;
    
        // Step 2: Find branches in the same city
        const branches = await Branch.find({ city: riderCity }).lean(); // Use .lean() for plain JS objects
    
        // Step 3: For each branch, attach salesperson details if exists
        const enrichedBranches = await Promise.all(
          branches.map(async (branch) => {
            if (branch.salesperson) {
              const salesperson = await User.findOne({assignedBranch: branch.salesperson}).lean();

              if (salesperson) {
                const business = await Business.findById(salesperson.business).lean();
                if (business) {
                  salesperson.business = {
                    _id: business._id,
                    name: business.name,
                  };
                }
                branch.salespersonDetails = salesperson;
              }
            }
            return branch;
          })
        );
    
        res.status(200).json({ branches: enrichedBranches });
    } catch (error) {
        console.error('Error fetching branches and salesperson:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

async function riderOrdersById(req, res){
  const { riderId }  = req.query;
  console.log(riderId)
  if (!mongoose.Types.ObjectId.isValid(riderId)) {
      return res.status(400).json({ error: 'Invalid riderId' });
  }

  try {
      const orders = await Order.find({ riderId })
          .populate('businessId', 'name') // populate business name
          .populate('userId', 'firstname lastname') // optionally populate user
          .lean(); // convert to plain JS objects for easier modification

      // For each order, fetch branch and salesperson details
      const enrichedOrders = await Promise.all(
          orders.map(async (order) => {
              const branch = await Branch.findOne({ branchCode: order.branchCode })
                  .populate('salesperson', 'name')
                  .lean();

              return {
                  ...order,
                  branch: branch ? {
                      name: branch.name,
                      city: branch.city,
                      address: branch.address,
                      contactNo: branch.contactNo,
                      emailAddress: branch.emailAddress,
                      salesperson: branch.salesperson ? {
                          _id: branch.salesperson._id,
                          name: branch.salesperson.name,
                      } : null
                  } : null
              };
          })
      );

      if (enrichedOrders.length === 0) {
          return res.status(404).json({ message: 'No orders found for this rider' });
      }

      return res.status(200).json({ orders: enrichedOrders });
  } catch (error) {
      console.error('Error fetching orders for rider:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateOrderStatusByRider(req, res){
    const { orderId, riderId, status } = req.body;

    try {
        if (!orderId || !riderId) {
            return res.status(400).json({ message: "Order ID and Rider ID are required" });
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId, riderId: riderId },
            { $set: { status: status } },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found or Rider ID mismatch" });
        }

        res.status(200).json({ message: "Status Updated Successfully", order });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



module.exports = {
    addRiderDetails: addRiderDetails,
    listOfSalesperson: listOfSalesperson,
    riderOrdersById:  riderOrdersById,
    updateOrderStatusByRider: updateOrderStatusByRider
}