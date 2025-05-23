require("dotenv").config();
const crypto = require('crypto'); 
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer'); 
const Salesperson = require('../../model/Branch Owner/salesperson-model'); 
const User = require('../../model/auth-model'); 
const { Branch } = require('../../model/Branch Owner/business-model');
const Rider = require('../../model/Rider/personelInfo-model');

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

async function viewSalesperson(req, res){
    const { business, pageNo, limit } = req.query;
    try{

        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
            return res.status(400).json({ message: "PageNo and page limit must be positive numbers" });
        }

        const skip = (pageNumber - 1) * pageLimit;

        const salesperson = await Salesperson.find({business: business})
        .skip(skip)
        .limit(pageLimit);

        const totalSalesperson = await Salesperson.countDocuments({business: business});
        const totalPages = Math.ceil(totalSalesperson/ pageLimit);

        if(salesperson.length === 0){
            return res.status(404).json({ message: "No Salesperson Found!" })
        }

        let nextPage = null;
        if(pageNumber < totalPages){
            nextPage = pageNumber + 1
        }

        let previousPage = null;
        if(pageNumber > 1){
            previousPage = pageNumber - 1
        }


        res.status(200).json({
            salesperson,
            meta: {
                totalItems: totalSalesperson,
                totalPages,
                currentPage: pageNumber,
                pageLimit,
                nextPage,
                previousPage,
            },
            message: "Salesperson Retrived Successfully"
        })
    } 
    catch(error){
        res.status(400).json({ message: error.message });
    }
}

async function addSalesperson(req, res){
    const { name, email, assignBranch, business } = req.body;
    console.log("Email user:", process.env.EMAIL_USER);
    console.log(process.env.EMAIL_PASSWORD);

    const validateInput = () => {
        const errors = {};
        
        if (!name || name.trim() === "") errors.name = "Name is required";
        if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errors.email = "Valid email is required";
        if (!assignBranch) errors.assignBranch = "Branch assignment is required";
        if (!business) errors.business = "Business is required";
        
        return Object.keys(errors).length === 0 ? null : errors;
    };

    const capitalizeFirstLetter = (str) => str.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

    const parseName = (fullName) => {
        if (!fullName) return { firstName: "", lastName: "" };
        const parts = fullName.trim().split(" ");
        return { firstName: parts[0], lastName: parts.length > 1 ? parts.slice(1).join(" ") : "" };
    };

    try {
        const validationErrors = validateInput();
        if (validationErrors) return res.status(400).json({ errors: validationErrors });

        const salespersonData = { name: capitalizeFirstLetter(name), email, assignBranch, business };

        const existBranch = await Branch.findOne({ branchCode: assignBranch, business });
        if (!existBranch) return res.status(404).json({ message: "Branch Not Found!" });

        if (existBranch.salesperson) return res.status(400).json({ message: "A salesperson is already assigned to this branch." });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "A user with this email already exists." });

        const generatedPassword = crypto.randomBytes(3).toString("hex");
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const { firstName, lastName } = parseName(name);

        const userData = new User({
            firstname: firstName,
            lastname: lastName,
            email,
            role: "Salesperson",
            phone: "03130000000",
            password: hashedPassword,
            assignedBranch: assignBranch,
            business
        });

        const savedUser = await userData.save();

        if (existBranch.hasMainBranch) {
            await User.findByIdAndUpdate(savedUser._id, { hasMainBranch: true }, { new: true });
        }

        const salesperson = new Salesperson(salespersonData);
        const newSalesperson = await salesperson.save();

        await Branch.findOneAndUpdate(
            { branchCode: assignBranch, business },
            { $set: { salesperson: newSalesperson._id } },
            { new: true }
        );

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
            tls: { rejectUnauthorized: false }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Your Salesperson Account Credentials",
            text: `Hello ${name},

            You have been added as a Salesperson.

            Your login credentials:
            Email: ${email}
            Password: ${generatedPassword}

            Please log in and change your password immediately for security.

            Best Regards,
            Diverse Den`
        };

        try {
            await transporter.verify(); 
            console.log("SMTP Verified. Sending email...");
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully!");

            res.status(201).json({
                newSalesperson,
                savedUser,
                message: "Salesperson Added Successfully. Credentials sent via email."
            });
        } catch (emailError) {
            console.error("Failed to send email but user was created:", emailError);
            res.status(201).json({
                newSalesperson,
                savedUser,
                message: `Salesperson Added Successfully. Warning: Failed to send email. Password: ${generatedPassword}`
            });
        }
    } catch (error) {
        console.error("Error creating salesperson:", error);
        res.status(400).json({ message: error.message });
    }
}

async function deleteSalesperson(req, res){
    const { salespersonId } = req.body;
    try{
        const salesperson = await Salesperson.findOneAndDelete({_id: salespersonId});
        
        const deleteFromUsers = await User.findOneAndDelete({email: salesperson.email})

        if(!salesperson){
            return res.status(404).json({ message: "No Salesperson Found!" });
        }

        const updatedBranch = await Branch.findOneAndUpdate(
            { 
                branchCode: salesperson.assignBranch,
                business: salesperson.business 
            },
            { $unset: { salesperson: "" } }, 
            { new: true }
        );

        if(!updatedBranch){
            return res.status(400).json({ message: "Branch Not Found! For Removing Salesperson" })
        }

        res.status(200).json({
            message: "Salesperson Deleted Successfully"
        });
    }

    catch(error){
        res.status(400).json({ message: error.message })
    }
}

async function listAllRiders(req, res){
    try {
        const salespersonId = req.query.userId;
      
        const salesperson = await User.findById(salespersonId);
        if (!salesperson) return res.status(404).json({ message: "Salesperson not found" });
      
        const branchCode = salesperson.assignedBranch;

        const branch = await Branch.findOne({ branchCode });
        if (!branch) return res.status(404).json({ message: "Branch not found" });
      
        const city = branch.city;
      
        const riders = await Rider.find({ city }).select('riderId name');
      
        res.status(200).json({ riders });
    } catch (error) {
        console.error("Error fetching riders:", error);
        res.status(500).json({ message: "Server error" });
    }      
}

module.exports = {
    addSalesperson: addSalesperson,
    viewSalesperson: viewSalesperson,
    deleteSalesperson: deleteSalesperson,
    listAllRiders: listAllRiders
}