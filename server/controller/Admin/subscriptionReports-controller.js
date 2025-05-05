const User = require("../../model/auth-model");


function cleanAndParseDate(dateString) {
    if (!dateString) return null;
  
    // Remove suffixes like 'st', 'nd', 'rd', 'th'
    const cleanedString = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
    
    const parsedDate = new Date(cleanedString);
  
    if (isNaN(parsedDate)) {
      return null; // invalid date
    }
  
    return parsedDate;
}

async function weeklySubscriptionReports(req, res) {
    try {
        let { startDate, endDate } = req.query;
    
        // If no start and end date provided, set the default to previous 6 days plus today
        if (!startDate || !endDate) {
          const today = new Date();
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6); // Previous 6 days
          endDate = today;
        }
    
        // Convert startDate and endDate into Date objects
        const start = new Date(startDate);
        const end = new Date(endDate);
    
        const users = await User.find({
          activePlan: { $ne: null },
          planActivation: { $ne: null } // must exist
        }).populate('activePlan');
    
        const dailyRevenue = {};
    
        // Initialize daily revenue with all 0s for each day between start and end dates
        let current = new Date(start);
        while (current <= end) {
          const dateKey = current.toISOString().split('T')[0]; // "YYYY-MM-DD"
          dailyRevenue[dateKey] = 0;
          current.setDate(current.getDate() + 1);
        }
    
        // Now manually filter and calculate the daily revenue
        users.forEach(user => {
          if (user.planActivation) {
            const parsedDate = cleanAndParseDate(user.planActivation);
    
            if (parsedDate && parsedDate >= start && parsedDate <= end) {
              const dateKey = parsedDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    
              if (dailyRevenue.hasOwnProperty(dateKey)) {
                dailyRevenue[dateKey] += user.activePlan.price;
              }
            }
          }
        });
    
        // Calculate the total revenue for the week
        const totalWeekRevenue = Object.values(dailyRevenue).reduce((acc, revenue) => acc + revenue, 0);
    
        // Respond with the daily subscription revenue and the total weekly revenue
        res.status(200).json({
          success: true,
          startDate: start.toISOString().split('T')[0], // "YYYY-MM-DD"
          endDate: end.toISOString().split('T')[0], // "YYYY-MM-DD"
          weekDaysSubscriptionRevenue: dailyRevenue,
          totalWeeklySubscriptionRevenue: totalWeekRevenue // Total revenue for the week
        });
      } catch (error) {
        console.error("Error generating subscription report:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

const monthNameToNumber = (month) => {
    const months = {
      January: 0,
      February: 1,
      March: 2,
      April: 3,
      May: 4,
      June: 5,
      July: 6,
      August: 7,
      September: 8,
      October: 9,
      November: 10,
      December: 11
    };
    return months[month] !== undefined ? months[month] : null;
};

async function monthlySubscriptionReports(req, res){
    try {
        let { month, year } = req.query;
        // If month or year is not provided, use the current month and year
        const today = new Date();
        if (!month || !year) {
          month = today.getMonth(); // Current month (0-indexed)
          year = today.getFullYear(); // Current year
        } else {
          // Convert month name to numeric value
          month = monthNameToNumber(month);
          if (month === null) {
            return res.status(400).json({ success: false, message: "Invalid month name" });
          }
          year = parseInt(year);
        }
    
        // Set the start date to the 1st of the specified month at midnight (00:00:00)
        const startDate = new Date(Date.UTC(year, month, 1)); // 1st of the specified month in UTC
        
        // Set the end date to the last date of the specified month
        const endDate = new Date(Date.UTC(year, month + 1, 0)); // Last day of the specified month in UTC
        endDate.setUTCHours(23, 59, 59, 999); // Ensure the time is at the end of the day
    
        // Fetch users with active plans and valid planActivation
        const users = await User.find({
          activePlan: { $ne: null },
          planActivation: { $ne: null } // Must exist
        }).populate('activePlan');
    
        const dailyRevenue = {};
        
        // Initialize daily revenue for all days in the range (1st of the month to last day of the month)
        let current = new Date(startDate);
        while (current <= endDate) {
          // Use UTC method to get consistent date strings
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(current.getUTCDate()).padStart(2, '0')}`;
          dailyRevenue[dateKey] = 0;
          current.setUTCDate(current.getUTCDate() + 1);
        }
    
        // Calculate revenue for each user
        users.forEach(user => {
          if (user.planActivation) {
            const parsedDate = cleanAndParseDate(user.planActivation);
            
            if (parsedDate) {
              // Convert to UTC for consistent date handling
              const year = parsedDate.getUTCFullYear();
              const month = parsedDate.getUTCMonth() + 1; // Month is 0-indexed
              const day = parsedDate.getUTCDate();
              
              // Format the date key consistently
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              if (parsedDate >= startDate && parsedDate <= endDate && dailyRevenue.hasOwnProperty(dateKey)) {
                dailyRevenue[dateKey] += user.activePlan.price;
              }
            }
          }
        });
    
        // Calculate total monthly revenue by summing all daily revenues
        const totalMonthlyRevenue = Object.values(dailyRevenue).reduce((sum, dailyAmount) => sum + dailyAmount, 0);
    
        // Respond with the daily subscription revenue for the date range and total monthly revenue
        res.status(200).json({
          success: true,
          startDate: `${month + 1}/1/${year}`,
          endDate: `${month + 1}/${new Date(year, month + 1, 0).getDate()}/${year}`,
          monthDaysSubscriptionRevenue: dailyRevenue,
          totalMonthlySubscriptionRevenue: totalMonthlyRevenue
        });
      } catch (error) {
        console.error("Error generating subscription report:", error);
        res.status(500).json({ success: false, message: "Server Error" });
      }
}


const monthNumberToName = (monthNum) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNum];
};

async function yearlySubscriptionReports(req, res){
    try {
        let { month, year } = req.query;
        
        // If year is not provided, use the current year
        const today = new Date();
        if (!year) {
            year = today.getFullYear(); // Current year
        } else {
            year = parseInt(year);
        }
    
        // Check if month is provided for monthly report
        let monthNum = null;
        if (month) {
            monthNum = monthNameToNumber(month);
            if (monthNum === null) {
                return res.status(400).json({ success: false, message: "Invalid month name" });
            }
        }
    
        // Set up date range for the pipeline
        const yearStart = new Date(Date.UTC(year, 0, 1)); // January 1st of the specified year
        const yearEnd = new Date(Date.UTC(year + 1, 0, 0, 23, 59, 59, 999)); // December 31st of the specified year
        
        // Set up the aggregation pipeline
        const pipeline = [
            {
                $match: {
                activePlan: { $ne: null },
                planActivation: { $ne: null }
                }
            },
            {
                $lookup: {
                from: "plans", // Assuming your plans collection is named "plans"
                localField: "activePlan",
                foreignField: "_id",
                as: "planDetails"
                }
            },
            {
                $unwind: "$planDetails"
            },
            {
                $addFields: {
                // Convert planActivation string to date if it's not already a date
                activationDate: {
                    $cond: {
                    if: { $eq: [{ $type: "$planActivation" }, "date"] },
                    then: "$planActivation",
                    else: { $dateFromString: { dateString: "$planActivation" } }
                    }
                }
                }
            },
            {
                $match: {
                activationDate: { $gte: yearStart, $lte: yearEnd }
                }
            },
            {
                $project: {
                year: { $year: "$activationDate" },
                month: { $month: "$activationDate" }, // 1-12
                day: { $dayOfMonth: "$activationDate" },
                price: "$planDetails.price"
                }
            }
        ];
    
        // Execute the aggregation
        const subscriptions = await User.aggregate(pipeline);
    
        // Process the results for yearly report
        // Create array of months with revenue data
        const monthlyRevenueArray = Array(12).fill(0).map((_, index) => {
            return {
                month: monthNumberToName(index),
                revenue: 0
            };
        });
        
        // Initialize daily revenue if month is specified
        let dailyRevenue = {};
        let totalMonthlyRevenue = 0;
        let startDate, endDate;
        
        if (monthNum !== null) {
            startDate = new Date(Date.UTC(year, monthNum, 1));
            endDate = new Date(Date.UTC(year, monthNum + 1, 0));
            const daysInMonth = endDate.getUTCDate();
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                dailyRevenue[dateKey] = 0;
            }
        }
    
        // Process each subscription
        subscriptions.forEach(sub => {
          const monthIndex = sub.month - 1; // Convert 1-12 to 0-11
          monthlyRevenueArray[monthIndex].revenue += sub.price;
          
          // If month is specified, calculate daily revenue for that month
            if (monthNum !== null && sub.month === monthNum + 1) {
                const dateKey = `${year}-${String(sub.month).padStart(2, '0')}-${String(sub.day).padStart(2, '0')}`;
                if (dailyRevenue.hasOwnProperty(dateKey)) {
                dailyRevenue[dateKey] += sub.price;
                totalMonthlyRevenue += sub.price;
                }
            }
        });
    
        // Calculate total yearly revenue
        const totalYearlyRevenue = monthlyRevenueArray.reduce((sum, month) => sum + month.revenue, 0);
    
        // Build the response based on whether month was specified
        const response = {
            success: true,
            year,
            yearlySubscriptionRevenue: {
                monthlySubscriptionRevenue: monthlyRevenueArray,
                totalYearlySubscriptionRevenue: totalYearlyRevenue
            }
        };
    
        // Add monthly report if month was specified
        // if (monthNum !== null) {
        //   response.monthlyReport = {
        //     month: monthNumberToName(monthNum),
        //     startDate: `${monthNum + 1}/1/${year}`,
        //     endDate: `${monthNum + 1}/${endDate.getUTCDate()}/${year}`,
        //     dailyRevenue,
        //     totalMonthlyRevenue
        //   };
        // }
    
        res.status(200).json(response);
    } catch (error) {
        console.error("Error generating subscription report:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
}



module.exports = {
    weeklySubscriptionReports: weeklySubscriptionReports,
    monthlySubscriptionReports: monthlySubscriptionReports,
    yearlySubscriptionReports: yearlySubscriptionReports
}