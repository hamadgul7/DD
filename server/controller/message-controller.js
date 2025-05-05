const Message = require('../model/message-model');

async function createMessage(req, res){
    const { chatId, senderId, text } = req.body;

    try{
        const message = new Message({
            chatId,
            senderId,
            text
        })

       const response = await message.save();
       res.status(200).json(response);

    } catch(error){
        console.log("Server Errorrrrrrrrrrrrr", error);
        res.status(500).json("Server Errorrrrrrrrrrrrr", error)
    }

}

async function getMessages(req, res){
    const { chatId } = req.params;

    try{
        const messages = await Message.find({chatId})
        if(!messages){
            return res.status(200).json({message: "No message Found!"})
        }
        res.status(200).json(messages);

    } catch(error){
        console.log("Server Errorrrrrrrrrrrrr", error);
        res.status(500).json("Server Errorrrrrrrrrrrrr", error)
    }
}

module.exports = {
    createMessage: createMessage,
    getMessages: getMessages
}