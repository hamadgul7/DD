const GiftCard = require('../../model/Branch Owner/giftCard-model');
const { Business } = require('../../model/Branch Owner/business-model');
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: 'dxeumdgez', 
    api_key: '245894938873442', 
    api_secret: 'Io6lfY0VSf49RTbdmq6ZyLeGtxI'
});

async function addGiftCard(req, res) {
    try {
        const { businessId, minPrice, maxPrice, description } = req.body;

        let imageDetails = await cloudinary.uploader.upload(req.file.path);

        // const codeExist = await GiftCard.findOne({code});
        // if(codeExist){
        //     return res.status(400).json({ 
        //         message: 'Gift card code already exists',
        //         errorCode: 'DUPLICATE_GIFT_CARD_CODE'
        //     });
        // }
        
        const { name } = await Business.findById(businessId)

        const newGiftCard = new GiftCard({
            businessId,
            businessName: name,
            minPrice,
            maxPrice,   
            description,
            imagePath: imageDetails.url
        });

        const savedCard = await newGiftCard.save();
    
        res.status(201).json({ message: 'Gift card added successfully', data: savedCard });

    } catch (error) {
        res.status(500).json({ message: 'Error adding gift card................', error: error.message });
    }
}

async function viewGiftCardDetails(req, res){
    try {
        const { giftCardId } = req.query;
       
    
        const giftCard = await GiftCard.findById(giftCardId);
    
        if (!giftCard) {
          return res.status(404).json({ message: 'Gift card not found' });
        }
    
        res.status(200).json({ message: 'Gift card retrieved successfully', data: giftCard });
      } catch (error) {
        res.status(500).json({ message: 'Error retrieving gift card', error: error.message });
      }
}

async function updateGiftCardDetails(req, res){
    try {
        const { giftCardId, minPrice, maxPrice, description } = req.body;

        const existingGiftCard = await GiftCard.findById(giftCardId);
        if (!existingGiftCard) {
            return res.status(404).json({ message: 'Gift card not found' });
        }

        // const duplicateCode = await GiftCard.findOne({ code, _id: { $ne: giftCardId } });
        // if (duplicateCode) {
        // return res.status(400).json({ 
        //     message: 'Gift card code already exists',
        //     errorCode: 'DUPLICATE_GIFT_CARD_CODE'
        // });
        // }

        let imageUrl = existingGiftCard.imagePath;
        if (req.file) {
            const imageDetails = await cloudinary.uploader.upload(req.file.path);
            imageUrl = imageDetails.url;
        }


        existingGiftCard.minPrice = minPrice;
        existingGiftCard.maxPrice = maxPrice;
        existingGiftCard.description = description;
        existingGiftCard.imagePath = imageUrl;

        const updatedCard = await existingGiftCard.save();

        res.status(200).json({ message: 'Gift card updated successfully', data: updatedCard });

    } catch (error) {
        res.status(500).json({ message: 'Error updating gift card', error: error.message });
    }
}

async function listGiftCardsWithPagination(req, res){
    const { businessId, pageNo, limit } = req.query;

    try {
        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (!businessId) {
        return res.status(404).json({ message: "BusinessId not available" });
        }

        if (pageNumber < 1 || pageLimit < 1) {
        return res.status(400).json({ message: "Page Number and Limit must be positive numbers" });
        }

        const skip = (pageNumber - 1) * pageLimit;

        const giftCards = await GiftCard.find({ businessId }).skip(skip).limit(pageLimit);
        const totalGiftCards = await GiftCard.countDocuments({ businessId });
        const totalPages = Math.ceil(totalGiftCards / pageLimit);

        let nextPage = pageNumber < totalPages ? pageNumber + 1 : null;
        let previousPage = pageNumber > 1 ? pageNumber - 1 : null;

        if (giftCards.length === 0) {
        return res.status(200).json({ message: "No Gift Cards found!" });
        }

        res.status(200).json({
        giftCards,
        meta: {
            totalItems: totalGiftCards,
            totalPages,
            currentPage: pageNumber,
            pageLimit,
            nextPage,
            previousPage
        },
        message: "Gift Cards Retrieved Successfully"
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function listAllGiftCards(req, res){
    try {
        const giftCards = await GiftCard.find(); // Populate entire Business document

        res.status(200).json(giftCards);
    } catch (err) {
        console.error('Error fetching gift cards:', err);
        res.status(500).json({ error: 'Failed to fetch gift cards' });
    }
}

async function deleteGiftCard(req, res){
    try {
        const  { giftCardId } = req.body;
        console.log(giftCardId)
    
        const deletedGiftCard = await GiftCard.findByIdAndDelete(giftCardId);
    
        if (!deletedGiftCard) {
          return res.status(404).json({ message: 'Gift Card not found' });
        }
    
        res.status(200).json({
          message: 'Gift Card deleted successfully',
          data: deletedGiftCard
        });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting gift card', error: error.message });
    }
}


module.exports = {
    addGiftCard: addGiftCard,
    viewGiftCardDetails: viewGiftCardDetails,
    updateGiftCardDetails: updateGiftCardDetails,
    listGiftCardsWithPagination: listGiftCardsWithPagination,
    listAllGiftCards: listAllGiftCards,
    deleteGiftCard: deleteGiftCard
}