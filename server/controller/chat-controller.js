const Chat = require('../model/chat-model');
const Rider = require('../model/Rider/personelInfo-model');
const Salesperson = require('../model/Branch Owner/salesperson-model');
const User = require('../model/auth-model');

async function createChat(req, res){
    const { firstId, secondId } = req.body;
    try {

        const existingChat = await Chat.findOne({
            "members.userId": { $all: [firstId, secondId] }
        });

        if (existingChat) {
            return res.status(200).json(existingChat);
        }

        const firstRider = await Rider.findOne({ riderId: firstId });
        const firstSales = await User.findById(firstId);

        const secondRider = await Rider.findOne({ riderId: secondId });
        const secondSales = await User.findById(secondId);

        const members = [];

        if (firstRider) {
            members.push({
                userId: firstRider.riderId,
                name: firstRider.name,
                role: "rider"
            });
        } else if (firstSales) {
            members.push({
                userId: firstSales._id,
                name: firstSales.firstname + ' ' + firstSales.lastname,
                role: "salesperson"
            });
        } else {
            return res.status(404).json({ message: "First user not found" });
        }

        if (secondRider) {
            members.push({
                userId: secondRider.riderId,
                name: secondRider.name,
                role: "rider"
            });
        } else if (secondSales) {
            members.push({
                userId: secondSales._id,
                name: secondSales.firstname + ' ' + secondSales.lastname,
                role: "salesperson"
            });
        } else {
            return res.status(404).json({ message: "Second user not found" });
        }

 
        const newChat = new Chat({ members });
        const response = await newChat.save();

        res.status(200).json(response);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function findUserChats(req, res){
    const userId = req.query.userId;

    try {
        const chats = await Chat.find({
            "members.userId": userId
        });

        res.status(200).json(chats);

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}

async function findChat(req, res){
    const { firstId, secondId } = req.query;

    try {
        const chat = await Chat.findOne({
            "members.userId": { $all: [firstId, secondId] }
        });

        res.status(200).json(chat);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
}


module.exports = {
    createChat: createChat,
    findUserChats: findUserChats,
    findChat: findChat
}