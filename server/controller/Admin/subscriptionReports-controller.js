const User = require("../../model/auth-model");


function cleanAndParseDate(dateString) {
    if (!dateString) return null;
  
    const cleanedString = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1');
    
    const parsedDate = new Date(cleanedString);
  
    if (isNaN(parsedDate)) {
      return null; 
    }
  
    return parsedDate;
}

async function weeklySubscriptionReports(req, res) {
    try {
        let { startDate, endDate } = req.query;
    
  
        if (!startDate || !endDate) {
          const today = new Date();
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6); 
          endDate = today;
        }
    

        const start = new Date(startDate);
        const end = new Date(endDate);
    
        const users = await User.find({
          activePlan: { $ne: null },
          planActivation: { $ne: null } 
        }).populate('activePlan');
    
        const dailyRevenue = {};
    

        let current = new Date(start);
        while (current <= end) {
          const dateKey = current.toISOString().split('T')[0]; 
          dailyRevenue[dateKey] = 0;
          current.setDate(current.getDate() + 1);
        }
    
        users.forEach(user => {
          if (user.planActivation) {
            const parsedDate = cleanAndParseDate(user.planActivation);
    
            if (parsedDate && parsedDate >= start && parsedDate <= end) {
              const dateKey = parsedDate.toISOString().split('T')[0]; 
    
              if (dailyRevenue.hasOwnProperty(dateKey)) {
                dailyRevenue[dateKey] += user.activePlan.price;
              }
            }
          }
        });
    
        const totalWeekRevenue = Object.values(dailyRevenue).reduce((acc, revenue) => acc + revenue, 0);
    

        res.status(200).json({
          success: true,
          startDate: start.toISOString().split('T')[0], 
          endDate: end.toISOString().split('T')[0],
          weekDaysSubscriptionRevenue: dailyRevenue,
          totalWeeklySubscriptionRevenue: totalWeekRevenue 
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
      
        const today = new Date();
        if (!month || !year) {
          month = today.getMonth();
          year = today.getFullYear(); 
        } else {
        
          month = monthNameToNumber(month);
          if (month === null) {
            return res.status(400).json({ success: false, message: "Invalid month name" });
          }
          year = parseInt(year);
        }
    
        
        const startDate = new Date(Date.UTC(year, month, 1)); 
        
        const endDate = new Date(Date.UTC(year, month + 1, 0));
        endDate.setUTCHours(23, 59, 59, 999); 
    
        const users = await User.find({
          activePlan: { $ne: null },
          planActivation: { $ne: null } 
        }).populate('activePlan');
    
        const dailyRevenue = {};
        

        let current = new Date(startDate);
        while (current <= endDate) {
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(current.getUTCDate()).padStart(2, '0')}`;
          dailyRevenue[dateKey] = 0;
          current.setUTCDate(current.getUTCDate() + 1);
        }
    
        users.forEach(user => {
          if (user.planActivation) {
            const parsedDate = cleanAndParseDate(user.planActivation);
            
            if (parsedDate) {
              const year = parsedDate.getUTCFullYear();
              const month = parsedDate.getUTCMonth() + 1; 
              const day = parsedDate.getUTCDate();
              
              const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              if (parsedDate >= startDate && parsedDate <= endDate && dailyRevenue.hasOwnProperty(dateKey)) {
                dailyRevenue[dateKey] += user.activePlan.price;
              }
            }
          }
        });
    
        const totalMonthlyRevenue = Object.values(dailyRevenue).reduce((sum, dailyAmount) => sum + dailyAmount, 0);
    
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
        
        const today = new Date();
        if (!year) {
            year = today.getFullYear(); 
        } else {
            year = parseInt(year);
        }

        let monthNum = null;
        if (month) {
            monthNum = monthNameToNumber(month);
            if (monthNum === null) {
                return res.status(400).json({ success: false, message: "Invalid month name" });
            }
        }
    
        const yearStart = new Date(Date.UTC(year, 0, 1)); 
        const yearEnd = new Date(Date.UTC(year + 1, 0, 0, 23, 59, 59, 999)); 
        
        const pipeline = [
            {
                $match: {
                activePlan: { $ne: null },
                planActivation: { $ne: null }
                }
            },
            {
                $lookup: {
                from: "plans", 
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
                month: { $month: "$activationDate" }, 
                day: { $dayOfMonth: "$activationDate" },
                price: "$planDetails.price"
                }
            }
        ];
    
        const subscriptions = await User.aggregate(pipeline);
    
        const monthlyRevenueArray = Array(12).fill(0).map((_, index) => {
            return {
                month: monthNumberToName(index),
                revenue: 0
            };
        });

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
    
 
        subscriptions.forEach(sub => {
          const monthIndex = sub.month - 1; 
          monthlyRevenueArray[monthIndex].revenue += sub.price;
          
            if (monthNum !== null && sub.month === monthNum + 1) {
                const dateKey = `${year}-${String(sub.month).padStart(2, '0')}-${String(sub.day).padStart(2, '0')}`;
                if (dailyRevenue.hasOwnProperty(dateKey)) {
                dailyRevenue[dateKey] += sub.price;
                totalMonthlyRevenue += sub.price;
                }
            }
        });
    
        const totalYearlyRevenue = monthlyRevenueArray.reduce((sum, month) => sum + month.revenue, 0);

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