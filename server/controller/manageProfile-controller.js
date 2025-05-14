const User = require('../model/auth-model');
const { Business } = require('../model/Branch Owner/business-model');
const Salesperson = require('../model/Branch Owner/salesperson-model');
const Rider = require('../model/Rider/personelInfo-model');
const cloudinary = require('cloudinary').v2;
const bcrypt = require('bcryptjs');

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

async function updatePersonelDetails(req, res) {
    try {
        const {
            userId, 
            formData
        } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update user fields
        user.firstname = formData.firstname;
        user.lastname = formData.lastname ;
        user.email = formData.email;
        user.phone = formData.phone;

        const updatedDetails = await user.save();

        // If Salesperson, update their details in the Salesperson schema as well
        if (user.role === 'Salesperson') {
            const salesperson = await Salesperson.findOne({ business: user.business, assignBranch: user.assignedBranch });
            if (salesperson) {
                salesperson.name = `${formData.firstname} ${formData.lastname}`;  // Update salesperson name
                salesperson.email = formData.email;  // Update salesperson email
                await salesperson.save();
            }
        }

        // If Rider, update their details in the Rider schema as well
        if (user.role === 'Rider') {
            const rider = await Rider.findOne({ riderId: user._id });
            if (rider) {
                rider.name = `${formData.firstname} ${formData.lastname}`;  // Update rider name
                rider.contactNo = formData.phone ;  // Update rider contactNo
                await rider.save();
            }
        }

        res.status(200).json(updatedDetails);

    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
}

async function updateBusinessDetails(req, res) {
        try {
        const {
            userId, 
            formData
        } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });


            const business = await Business.findById(user.business);
            if (!business) {
                return res.status(404).json({ message: 'Business not found' });
            }

            business.name = formData.name;
            business.description = formData.description;
            business.accountHolderName = formData.accountHolderName ;
            business.bankName = formData.bankName;
            business.accountNumber = formData.accountNumber;

            await business.save();
        
        res.status(200).json({message: "Business Details Updated Successfully"});

    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
}

async function updatePicture(req, res){
     try {
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!req.file) {
            return res.status(404).json({ message: 'image not found' });
        }

        const imageDetails = await cloudinary.uploader.upload(req.file.path);
        user.profilePicture = imageDetails.url;

        await user.save();


        
        res.status(200).json({message: "Picture Updated Successfully"});

    } catch (error) {
        res.status(500).json({ message: 'Error updating profile', error: error.message });
    }
}

async function changePassword(req, res){
    try {
    const { userId, formData } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const { oldPassword, newPassword } = formData;

    console.log("UserID:", userId);
    console.log("Old Password:", oldPassword);
    console.log("New Password:", newPassword);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }


    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Old password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
    } else if (oldPassword || newPassword) {
      return res.status(400).json({
        message: 'Both old and new passwords must be provided to update the password',
      });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      message: 'Server error while updating password',
      error: error.message,
    });
  }

}


module.exports = {
    getUserDetails: getUserDetails,
    updatePersonelDetails: updatePersonelDetails,
    updateBusinessDetails: updateBusinessDetails,
    updatePicture: updatePicture,
    changePassword: changePassword
}