const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        members: [
            {
                userId: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                name: {
                    type: String,
                },
                role: {
                    type: String,
                }
            }
        ]    
    },
    { timestamps: true }
);

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;