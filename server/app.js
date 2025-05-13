const express = require('express');
const db = require('./config/database');
const path = require('path');
const authRoute = require('./routes/auth-routes');
const subscriptionRoute = require('./routes/subscriptionPlans-route');
const planStripePaymentRoute = require('./routes/stripePayment-routes');
const branchOwnerBusinessRoute = require('./routes/Branch Owner/business-routes');
const branchOwnerBranchRoute = require('./routes/Branch Owner/branch-routes');
const branchOwnerBranchProductRoute = require('./routes/Branch Owner/branchProduct-routes');
const branchOwnerSalespersonRoute = require('./routes/Branch Owner/salesperson-routes');
const branchOwnerGiftCardRoutes = require('./routes/Branch Owner/giftCard-routes');
const branchOwnerProductRoute = require('./routes/Branch Owner/product-routes');
const customerCartRoute = require('./routes/Customer/cart-routes');
const customerProductsRoute = require('./routes/Customer/customerProduct-routes');
const customerLoyaltyPointRoutes = require('./routes/Customer/loyaltyPoints-routes');
const customerGiftCardRoutes = require('./routes/Customer/purchasedGiftCard-routes');
const customerFAQSRoutes = require('./routes/Customer/customerFAQS-routes');
const orderRoutes = require('./routes/order-routes');
const customerProductReviewRoutes = require('./routes/Customer/customerProductReview-routes');
const businessProductReviewRoutes = require('./routes/Branch Owner/businessProductReviews-routes');
const businessSubscriptionRoutes = require('./routes/Branch Owner/businessSubscription-routes');
const businessSaleEventRoutes = require('./routes/Branch Owner/saleEvent-routes');
const businessReportRoutes = require('./routes/Branch Owner/report-routes');
const adminUserRoutes = require('./routes/Admin/user-routes');
const adminBusinessRoutes = require('./routes/Admin/business-routes');
const adminPlanSubscriberRoutes = require('./routes/Admin/subscription-routes');
const adminSubscriptionReportRoutes = require('./routes/Admin/subscriptionReport-routes');
const adminAchievementRoutes = require('./routes/Admin/achievementAndMissions-routes');
const adminRiderRoutes = require('./routes/Admin/rider-routes');
const adminFAQsRoutes = require('./routes/Admin/faqs-routes');
const riderController = require('./routes/Rider/personelInfo-routes')

const chatRoutes = require('./routes/chat-routes');
const messageRoutes = require('./routes/message-routes');

const userManageProfileRoutes = require('./routes/manageProfile-routes');


const cors = require('cors');

const app = express();
app.use(cors());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: 'GET,POST',
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use(authRoute);
app.use(subscriptionRoute);
app.use(planStripePaymentRoute);
app.use(branchOwnerBusinessRoute);
app.use(branchOwnerBranchRoute);
app.use('/branchOwner', branchOwnerSalespersonRoute);
app.use('/branchOwner', branchOwnerProductRoute);
app.use('/branchOwner', branchOwnerBranchProductRoute);
app.use('/branchOwner', branchOwnerGiftCardRoutes);
app.use('/customer', customerCartRoute);
app.use('/customer', customerProductsRoute);
app.use('/customer', customerLoyaltyPointRoutes);
app.use('/customer', customerGiftCardRoutes);
app.use('/customer', customerFAQSRoutes);
app.use(orderRoutes);
app.use('/customer', customerProductReviewRoutes);
app.use('/branchOwner', businessProductReviewRoutes);
app.use('/branchOwner', businessSubscriptionRoutes);
app.use('/branchOwner', businessSaleEventRoutes);
app.use('/branchOwner', businessReportRoutes);
app.use('/admin', adminUserRoutes);
app.use('/admin', adminBusinessRoutes);
app.use('/admin', adminPlanSubscriberRoutes);
app.use('/admin', adminSubscriptionReportRoutes);
app.use('/admin', adminAchievementRoutes);
app.use('/admin', adminRiderRoutes);
app.use('/admin', adminFAQsRoutes);
app.use('/rider', riderController);

app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

app.use('/user', userManageProfileRoutes);




db.connectToDatabase()
.then(function(){
    app.listen(3000)
})
.catch(function(error){
    console.log('Failed to Connect to the Database')
    console.log(error);
})