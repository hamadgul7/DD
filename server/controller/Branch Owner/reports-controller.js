const Order = require('../../model/orders-model');
const mongoose = require("mongoose");
const Product = require('../../model/Branch Owner/products-model');
const moment = require('moment');


function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
  
    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().slice(0, 10)); 
      
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 1); 
      currentDate = nextDate;
    }
    
    return dates;
}

async function weeklySalesReports(req, res) {
    try {
        const { businessId, startDate, endDate } = req.query;
    
        let start, end;
    
    
        if (startDate && endDate) {
   
          start = new Date(startDate + "T00:00:00.000Z");
          end = new Date(endDate + "T23:59:59.999Z");
        } else {
       
          end = new Date();
          end.setHours(23, 59, 59, 999);
          
  
          start = new Date(end);
          start.setDate(end.getDate() - 5); 
          start.setHours(0, 0, 0, 0);
        }
    
        console.log("Start Date in UTC:", start.toISOString());
        console.log("End Date in UTC:", end.toISOString());

        const checkDateRange = getDatesInRange(
          start.toISOString().slice(0, 10),
          end.toISOString().slice(0, 10)
        );
        console.log("Number of days in range:", checkDateRange.length);
        if (checkDateRange.length !== 7) {
          console.warn("Warning: Date range is not exactly 7 days. Actual days:", checkDateRange.length);
        }
        console.log("Date range:", checkDateRange);
    

        if (!businessId) {
          return res.status(400).json({ error: "Business ID is required." });
        }
    
  
        const salesData = await Order.aggregate([
          {
            $match: {
              businessId: new mongoose.Types.ObjectId(businessId),
              status: "Delivered",
              createdAt: { 
                $gte: start, 
                $lte: end     
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }  
              },
              totalSales: { $sum: "$subTotal" },  
              orderCount: { $sum: 1 }  
            }
          },
          {
            $sort: { _id: 1 }  
          }
        ]);

        const weeklyTotal = await Order.aggregate([
          {
            $match: {
              businessId: new mongoose.Types.ObjectId(businessId),
              status: "Delivered",
              createdAt: { 
                $gte: start,
                $lte: end
              }
            }
          },
          {
            $group: {
              _id: null, 
              totalWeeklySales: { $sum: "$subTotal" },
              totalWeeklyOrders: { $sum: 1 }
            }
          }
        ]);
    
        const allDates = getDatesInRange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
    
        const formattedSalesData = allDates.map(date => {
          const salesForDay = salesData.find(sale => sale._id === date);
          return {
            date: date,
            dailySales: salesForDay ? salesForDay.totalSales : 0,
            dailyOrders: salesForDay ? salesForDay.orderCount : 0
          };
        });
    
        return res.json({ 
          dailySales: formattedSalesData,
          weeklySales: {
            totalSales: weeklyTotal[0]?.totalWeeklySales || 0,
            totalOrders: weeklyTotal[0]?.totalWeeklyOrders || 0,
            startDate: start.toISOString().slice(0, 10),
            endDate: end.toISOString().slice(0, 10)
          }
        });
    
    } catch (error) {
        console.error("Error in fetching sales data:", error);
        return res.status(500).json({ error: "Server error while fetching sales data" });
    }
}

const monthNameToNumber = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12
};

function getAllDaysOfMonth(year, monthNumber) {
  const days = [];
  const lastDay = new Date(year, monthNumber, 0).getDate(); 

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(Date.UTC(year, monthNumber - 1, day));
    days.push(date.toISOString().slice(0, 10)); 
  }

  return days;
}

async function monthlySalesReports(req, res) {
  try {
    const { businessId, month, year } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: "businessId is required." });
    }

    let selectedMonth, selectedYear;

    if (month && year) {

      selectedMonth = monthNameToNumber[month];
      if (!selectedMonth) {
        return res.status(400).json({ error: "Invalid month name provided." });
      }
      selectedYear = parseInt(year);
    } else {

      const currentDate = new Date();
      selectedMonth = currentDate.getUTCMonth() + 1; 
      selectedYear = currentDate.getUTCFullYear();
    }

    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    const salesData = await Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: "Delivered",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalSales: { $sum: "$subTotal" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const allDaysInMonth = getAllDaysOfMonth(selectedYear, selectedMonth);


    const formattedSalesData = allDaysInMonth.map(date => {
      const sale = salesData.find(s => s._id === date);
      return {
        date,
        totalSales: sale ? sale.totalSales : 0,
        orderCount: sale ? sale.orderCount : 0
      };
    });


    const totalMonthlySales = formattedSalesData.reduce((sum, day) => sum + day.totalSales, 0);

    res.json({
      monthlySalesData: formattedSalesData,
      totalMonthlySales
    });

  } catch (error) {
    console.error("Error fetching monthly sales:", error);
    res.status(500).json({ error: "Server error while fetching monthly sales" });
  }
};

async function yearlySalesReports(req, res){
  try {
    const { businessId, year } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: "businessId is required." });
    }

    const selectedYear = year ? parseInt(year) : new Date().getUTCFullYear();

    const startDate = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0)); 
    const endDate = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999)); 

    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    const salesData = await Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: "Delivered",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalSales: { $sum: "$subTotal" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    const monthNumberToName = {
      1: "January",
      2: "February",
      3: "March",
      4: "April",
      5: "May",
      6: "June",
      7: "July",
      8: "August",
      9: "September",
      10: "October",
      11: "November",
      12: "December"
    };

    const formattedSalesData = [];
    for (let month = 1; month <= 12; month++) {
      const sale = salesData.find(s => s._id === month);
      formattedSalesData.push({
        month: monthNumberToName[month],
        totalSales: sale ? sale.totalSales : 0,
        orderCount: sale ? sale.orderCount : 0
      });
    }


    const totalYearlySales = formattedSalesData.reduce((sum, month) => sum + month.totalSales, 0);

    res.json({
      salesData: formattedSalesData,
      totalYearlySales
    });

  } catch (error) {
    console.error("Error fetching yearly sales:", error);
    res.status(500).json({ error: "Server error while fetching yearly sales" });
  }
}



async function weeklyRevenueReports(req, res) {
  try {
    const { businessId, startDate, endDate } = req.query;

    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate + "T00:00:00.000Z");
      end = new Date(endDate + "T23:59:59.999Z");
    } else {

      end = new Date();
      end.setHours(23, 59, 59, 999);

      start = new Date(end);
      start.setDate(end.getDate() - 6); 
      start.setHours(0, 0, 0, 0);
    }

    console.log("Start Date in UTC:", start.toISOString());
    console.log("End Date in UTC:", end.toISOString());


    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required." });
    }

    const revenueData = await Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: "Delivered",
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const weeklyTotal = await Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: "Delivered",
          createdAt: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: null,
          totalWeeklyRevenue: { $sum: "$totalAmount" },
          totalWeeklyOrders: { $sum: 1 }
        }
      }
    ]);

    const allDates = getDatesInRange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));


    const formattedRevenueData = allDates.map(date => {
      const revenueForDay = revenueData.find(rev => rev._id === date);
      return {
        date: date,
        dailyRevenue: revenueForDay ? revenueForDay.totalRevenue : 0,
        dailyOrders: revenueForDay ? revenueForDay.orderCount : 0
      };
    });


    return res.json({
      dailyRevenue: formattedRevenueData,
      weeklyRevenue: {
        totalRevenue: weeklyTotal[0]?.totalWeeklyRevenue || 0,
        totalOrders: weeklyTotal[0]?.totalWeeklyOrders || 0,
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10)
      }
    });

  } catch (error) {
    console.error("Error in fetching revenue data:", error);
    return res.status(500).json({ error: "Server error while fetching revenue data." });
  }
}

async function monthlyRevenueReports(req, res) {
  try {
    const { businessId, month, year } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required." });
    }

    let selectedMonth, selectedYear;

    if (month && year) {
      selectedMonth = monthNameToNumber[month];
      if (!selectedMonth) {
        return res.status(400).json({ error: "Invalid month name provided." });
      }
      selectedYear = parseInt(year);
    } else {
  
      const currentDate = new Date();
      selectedMonth = currentDate.getUTCMonth() + 1; 
      selectedYear = currentDate.getUTCFullYear();
    }

    const startDate = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(selectedYear, selectedMonth, 0, 23, 59, 59, 999));

    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);


    const revenueData = await Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: "Delivered",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);


    const allDaysInMonth = getAllDaysOfMonth(selectedYear, selectedMonth);


    const formattedRevenueData = allDaysInMonth.map(date => {
      const revenue = revenueData.find(r => r._id === date);
      return {
        date,
        totalRevenue: revenue ? revenue.totalRevenue : 0,
        orderCount: revenue ? revenue.orderCount : 0
      };
    });


    const totalMonthlyRevenue = formattedRevenueData.reduce((sum, day) => sum + day.totalRevenue, 0);

    res.json({
      monthlyRevenueData: formattedRevenueData,
      totalMonthlyRevenue
    });

  } catch (error) {
    console.error("Error fetching monthly revenue:", error);
    res.status(500).json({ error: "Server error while fetching monthly revenue." });
  }
}

async function yearlyRevenueReports(req, res) {
  try {
    const { businessId, year } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: "Business ID is required." });
    }


    const selectedYear = year ? parseInt(year) : new Date().getUTCFullYear();


    const startDate = new Date(Date.UTC(selectedYear, 0, 1, 0, 0, 0));   
    const endDate = new Date(Date.UTC(selectedYear, 11, 31, 23, 59, 59, 999)); 

    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    const revenueData = await Order.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: "Delivered",
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, 
          totalRevenue: { $sum: "$totalAmount" },  
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);

    const monthNumberToName = {
      1: "January",
      2: "February",
      3: "March",
      4: "April",
      5: "May",
      6: "June",
      7: "July",
      8: "August",
      9: "September",
      10: "October",
      11: "November",
      12: "December"
    };


    const formattedRevenueData = [];
    for (let month = 1; month <= 12; month++) {
      const revenue = revenueData.find(r => r._id === month);
      formattedRevenueData.push({
        month: monthNumberToName[month],
        totalRevenue: revenue ? revenue.totalRevenue : 0,
        orderCount: revenue ? revenue.orderCount : 0
      });
    }


    const totalYearlyRevenue = formattedRevenueData.reduce((sum, month) => sum + month.totalRevenue, 0);

    res.json({
      revenueData: formattedRevenueData,
      totalYearlyRevenue
    });

  } catch (error) {
    console.error("Error fetching yearly revenue:", error);
    res.status(500).json({ error: "Server error while fetching yearly revenue" });
  }
}



async function dailyTrendingProducts(req, res) {
  const { businessId, date } = req.query;

  if (!businessId) {
    return res.status(400).json({ error: 'BusinessId is required' });
  }

  try {

    const businessIdObjectId = new mongoose.Types.ObjectId(businessId);


    const selectedDate = date ? moment(date) : moment();
    const start = selectedDate.startOf('day').toDate();
    const end = selectedDate.endOf('day').toDate();

    console.log(`Start of Day: ${start}`);
    console.log(`End of Day: ${end}`);

    const trendingProducts = await Order.aggregate([
      {
        $match: {
          businessId: businessIdObjectId,
          status: 'Delivered',
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $unwind: '$cartItems',
      },
      {
        $group: {
          _id: '$cartItems.productId._id', 
          totalSold: { $sum: '$cartItems.quantity' }, 
          productTitle: { $first: '$cartItems.productId.title' }, 
        },
      },
      {
        $sort: { totalSold: -1 }, 
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productTitle: 1,
          totalSold: 1,
        },
      },
    ]);

    res.json({
      date: selectedDate.format('YYYY-MM-DD'),
      trendingProducts,
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching trending products' });
  }
}

async function weeklyTrendingProducts(req, res){
  try {
    const { businessId, startDate, endDate } = req.query;

    if (!businessId) {
      return res.status(400).json({ error: 'BusinessId is required' });
    }

    const businessIdObjectId = new mongoose.Types.ObjectId(businessId);

    let start, end;

    if (startDate && endDate) {
      start = moment(startDate).startOf('day').toDate();
      end = moment(endDate).endOf('day').toDate();
    } else {
      start = moment().subtract(6, 'days').startOf('day').toDate();
      end = moment().endOf('day').toDate();
    }

    console.log(`Start Date: ${start}`);
    console.log(`End Date: ${end}`);

    const trendingProducts = await Order.aggregate([
      {
        $match: {
          businessId: businessIdObjectId,
          status: 'Delivered',
          createdAt: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $unwind: '$cartItems',
      },
      {
        $group: {
          _id: {
            productId: '$cartItems.productId._id',
            productTitle: '$cartItems.productId.title'
          },
          totalSold: { $sum: '$cartItems.quantity' },
        },
      },
      {
        $project: {
          productTitle: '$_id.productTitle',
          totalSold: 1,
          _id: 0,
        },
      },
      {
        $sort: { totalSold: -1 },
      },
    ]);

    res.json({
      startDate: moment(start).format('YYYY-MM-DD'),
      endDate: moment(end).format('YYYY-MM-DD'),
      trendingProducts,
    });

  } catch (error) {
    console.error('Error calculating trending products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function monthlyTrendingProducts(req, res){
  const { businessId, month, year } = req.query;

  if (!businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    
    const businessIdObjectId = new mongoose.Types.ObjectId(businessId);

    let startOfMonth, endOfMonth;
    let finalMonth, finalYear;

    if (month && year) {
      
      const monthNumber = moment().month(month).format("M"); 
      if (!monthNumber) {
        return res.status(400).json({ error: 'Invalid month provided' });
      }

      startOfMonth = moment(`${year}-${monthNumber}-01`).startOf('month').toDate();
      endOfMonth = moment(`${year}-${monthNumber}-01`).endOf('month').toDate();

      finalMonth = month;
      finalYear = year;
    } else {
      
      startOfMonth = moment().startOf('month').toDate();
      endOfMonth = moment().endOf('month').toDate();

      finalMonth = moment().format('MMMM'); 
      finalYear = moment().format('YYYY');  
    }

    console.log(`Start of Month: ${startOfMonth}`);
    console.log(`End of Month: ${endOfMonth}`);

    const trendingProducts = await Order.aggregate([
      {
        $match: {
          businessId: businessIdObjectId,
          status: 'Delivered',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $unwind: '$cartItems',
      },
      {
        $group: {
          _id: '$cartItems.productId._id', 
          totalSold: { $sum: '$cartItems.quantity' }, 
          productTitle: { $first: '$cartItems.productId.title' }, 
        },
      },
      {
        $sort: { totalSold: -1 }, 
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productTitle: 1,
          totalSold: 1,
        },
      },
    ]);

    res.status(200).json({
      month: finalMonth,
      year: finalYear,
      trendingProducts,
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching monthly trending products' });
  }
}

module.exports = {
    weeklySalesReports: weeklySalesReports,
    monthlySalesReports: monthlySalesReports,
    yearlySalesReports: yearlySalesReports,

    weeklyRevenueReports: weeklyRevenueReports,
    monthlyRevenueReports: monthlyRevenueReports,
    yearlyRevenueReports: yearlyRevenueReports,

    dailyTrendingProducts: dailyTrendingProducts,
    weeklyTrendingProducts: weeklyTrendingProducts,
    monthlyTrendingProducts: monthlyTrendingProducts
}