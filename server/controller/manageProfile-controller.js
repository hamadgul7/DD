const User = require('../model/auth-model');
const { Business } = require('../model/Branch Owner/business-model');
const Salesperson = require('../model/Branch Owner/salesperson-model');
const Rider = require('../model/Rider/personelInfo-model');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: 'dxeumdgez', 
    api_key: '245894938873442', 
    api_secret: 'Io6lfY0VSf49RTbdmq6ZyLeGtxI'
});


async function getUserDetails(req, res){
    const { userId } = req.query;

    try {
        const user = await User.findById(userId, 'firstname lastname email phone role profilePicture')
        .populate({
            path: 'business',
            select: 'name description accountHolderName bankName accountNumber',
        });

        if (!user) {
        return res.status(404).json({ message: 'User not found' });
        }

        const response = {
        basicInfo: {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profilePicture: user.profilePicture
        }
        };

        if (user.role === 'Branch Owner' && user.business) {
        response.businessDetails = {
            name: user.business.name,
            description: user.business.description,
            accountHolderName: user.business.accountHolderName,
            bankName: user.business.bankName,
            accountNumber: user.business.accountNumber
        };
        }

        res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
}

async function updateUserDetails(req, res){
    try {
        const {
            userId, 
            firstname, 
            lastname, 
            email, 
            phone,  
            oldPassword,  
            newPassword,  
            businessName,
            businessDescription,
            accountHolderName,
            bankName,
            accountNumber
        } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if the old password matches the stored password
        if (oldPassword && newPassword) {
            const isMatch = await bcrypt.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Old password is incorrect' });
            }

            // Hash the new password before saving
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Upload profile picture if provided
        if (req.file) {
            const imageDetails = await cloudinary.uploader.upload(req.file.path);
            user.profilePicture = imageDetails.url;
        }

        // Update user fields
        user.firstname = firstname || user.firstname;
        user.lastname = lastname || user.lastname;
        user.email = email || user.email;
        user.phone = phone || user.phone;

        await user.save();

        const basicInfo = {
            _id: user._id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            profilePicture: user.profilePicture || null
        };

        const response = { basicInfo };

        // If Branch Owner, update business info too
        if (user.role === 'Branch Owner' && user.business) {
            const business = await Business.findById(user.business);
            if (business) {
                business.name = businessName || business.name;
                business.description = businessDescription || business.description;
                business.accountHolderName = accountHolderName || business.accountHolderName;
                business.bankName = bankName || business.bankName;
                business.accountNumber = accountNumber || business.accountNumber;

                await business.save();

                response.businessDetails = {
                    name: business.name,
                    description: business.description,
                    accountHolderName: business.accountHolderName,
                    bankName: business.bankName,
                    accountNumber: business.accountNumber
                };
            }
        }

        // If Salesperson, update their details in the Salesperson schema as well
        if (user.role === 'Salesperson') {
            const salesperson = await Salesperson.findOne({ business: user.business, assignBranch: user.assignedBranch });
            if (salesperson) {
                salesperson.name = `${user.firstname} ${user.lastname}`;  // Update salesperson name
                salesperson.email = user.email;  // Update salesperson email
                await salesperson.save();
            }
        }

        // If Rider, update their details in the Rider schema as well
        if (user.role === 'Rider') {
            const rider = await Rider.findOne({ riderId: user._id });
            if (rider) {
                rider.name = `${user.firstname} ${user.lastname}`;  // Update rider name
                rider.contactNo = phone || rider.contactNo;  // Update rider contactNo
                await rider.save();
            }
        }

        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
};


module.exports = {
    getUserDetails: getUserDetails,
    updateUserDetails: updateUserDetails
}