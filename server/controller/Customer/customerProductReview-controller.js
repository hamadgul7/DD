const { Branch, Business } = require('../../model/Branch Owner/business-model');
const Product = require('../../model/Branch Owner/products-model');
const User = require('../../model/auth-model');
const ProductReviews = require('../../model/productReviews-model');
const UserPoints = require('../../model/Customer/loyaltyPoints-model');

async function addProductReview(req, res){
    const { userData, rating, comment, businessId, productId } = req.body;
    try {
        if (!userData || !rating || !comment || !businessId || !productId) {
            return res.status(400).json({ message: "Invalid Data" });
        }

        const userExist = await User.findById(userData._id);
        if (!userExist) {
            return res.status(404).json({ message: "User Not Found! First Signup please" });
        }

        const businessExist = await Business.findById(businessId);
        if (!businessExist) {
            return res.status(404).json({ message: "Business Not Found" });
        }

        const productExist = await Product.findById(productId);
        if (!productExist) {
            return res.status(404).json({ message: "Product Not Found" });
        }

        // Save the review
        const reviewDetails = {
            customerName: `${userData.firstname} ${userData.lastname}`,
            rating,
            comment,
            userId: userData._id,
            businessId,
            productId
        };

        const customerReview = new ProductReviews(reviewDetails);
        const savedReview = await customerReview.save();

        // ---------------------------
        // Mission logic begins here
        // ---------------------------
        if(userData.role == "Customer"){
            const userPoints = await UserPoints.findOne({ userId: userData._id });
            if (userPoints) {
                const missionIdToComplete = "6814e74179fc0d3edcc192c1"; // "One Review" mission ID
                const mission = userPoints.dailyMissions.find(m => 
                    m.missionId?.toString() === missionIdToComplete && !m.completed
                );

                if (mission) {
                    mission.completed = true;

                    // Add to point history
                    userPoints.pointHistory.push({
                        type: "mission",
                        description: "Completed mission: One Review",
                        points: mission.points,
                        date: new Date()
                    });

                    // Automatically update totalPoints due to pre-save hook
                    await userPoints.save();
                }
            }
        }

        // ---------------------------
        // Response
        // ---------------------------
        res.status(201).json({
            customerReview: savedReview,
            message: "Review Submitted Successfully"
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function viewProductReview(req, res){
    const { productId } = req.query;
    try {
        if (!productId) {
            return res.status(400).json({ message: "Invalid Product ID" });
        }
        const productReviews = await ProductReviews.find({ productId });

        if (!productReviews.length) {
            return res.status(200).json({
                productReviews: [], 
                averageRating: 0, 
                message: "No Reviews Found!"
            });
        }

        const totalRatings = productReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRatings / productReviews.length;

        res.status(200).json({
            productReviews,
            averageRating: averageRating.toFixed(1),
            message: "Reviews Fetched Successfully"
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    addProductReview: addProductReview,
    viewProductReview: viewProductReview
}