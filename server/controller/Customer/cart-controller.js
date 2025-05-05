const Cart = require('../../model/Customer/cart-model');
const User = require('../../model/auth-model');
const CartSummary = require('../../model/Customer/cartSummary-model');

async function viewCart(req, res) {
    const { userId } = req.query;

    try {
        
        const userCart = await Cart.find({ userId: userId }).populate('productId');

        if (userCart.length === 0) {
            return res.status(200).json({ message: "No Products Found in Cart" });
        }

        const productsWithImages = userCart
            .filter(cartItem => cartItem.productId)
            .map(cartItem => {
                const product = cartItem.productId.toObject();
                return {
                    ...cartItem.toObject(),
                    productId: product,
                };
            });

        res.status(200).json({
            userCart: productsWithImages,
            message: "Cart Retrieved Successfully",
        });
    } 
    catch (error) {
        res.status(400).json({ message: error.message });
    }
}

async function addToCart(req, res) {
    const { userId, productId, quantity, selectedVariant } = req.body;
    try {
        // Check if user exists
        const userExist = await User.findById(userId);
        if (!userExist) {
            return res.status(404).json({ message: "Please first login/sign up to add products in cart" });
        }
      
        // Create and save cart item
        const cartProduct = new Cart({
            userId,
            productId,
            quantity,
            selectedVariant
        });
      
        await cartProduct.save();
      
        // Delete the user's cart summary (if it exists)
        await CartSummary.findOneAndDelete({ userId });
      
        res.status(201).json({
            productId,
            message: "Product added successfully in cart. Cart summary reset."
        });
    } catch (error) {
        console.error("Error adding product to cart:", error);
        res.status(400).json({ message: error.message });
    } 
}

async function createDiscountSummary(req, res){
    const {
        userId,
        discountAmount,
        orderSubtotal,
        orderTotal,
        pointsRedeemed,
        shippingCost
    } = req.body;
    
    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }
    
    try {
        const updatedSummary = await CartSummary.findOneAndUpdate(
            { userId },
            {
                discountAmount,
                orderSubtotal,
                orderTotal,
                pointsRedeemed,
                shippingCost
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
    
        res.status(200).json({ message: "Cart summary saved", data: updatedSummary });
    } catch (err) {
        console.error("Error saving cart summary:", err);
        res.status(500).json({ error: "Server error" });
    }
}

async function viewDiscountSummary(req, res) {
    const { userId } = req.query;

    if (!userId) {
        return res.status(400).json({ error: "userId is required" });
    }

    try {
        const cartSummary = await CartSummary.findOne({ userId });

        if (!cartSummary) {
        return res.status(404).json({ message: "Cart summary not found" });
        }

        res.status(200).json({ discountData: cartSummary });
    } catch (err) {
        console.error("Error fetching cart summary:", err);
        res.status(500).json({ error: "Server error" });
    }
}

async function updateProductQuantityInCart(req, res){
    const { cartId, quantity } = req.body;
    try{

        if (quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1." });
        }

        const cartUpdatedProduct = await Cart.findByIdAndUpdate(
            cartId,
            {
                $set: {
                    quantity: quantity
                }
            },
            { new: true }
        )

        if(!cartUpdatedProduct){
            return res.status(404).json({message: "Cart Product Not found!"})
        }

        res.status(200).json({
            cartUpdatedProduct,
            message: "Quantity Successfully Updated"
        })

    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

async function deleteProductFromCart(req, res) {
    const { cartId } = req.body;
    try {
        // Delete the cart item
        const deletedCartProduct = await Cart.findByIdAndDelete(cartId);

        if (!deletedCartProduct) {
        return res.status(404).json({ message: "Cart item not found" });
        }

        const userId = deletedCartProduct.userId;

        // Try deleting the user's cart summary
        const deletedSummary = await CartSummary.findOneAndDelete({ userId });

        if (!deletedSummary) {
        console.log(`No CartSummary found for user ${userId}. Skipping deletion.`);
        }

        res.status(200).json({ message: "Product deleted from cart. Cart summary removed if it existed." });
    } catch (error) {
        console.error("Error during cart product deletion:", error);
        res.status(400).json({ message: error.message });
    }
}

async function emptyCart(req, res){
    const { userId } = req.body;
    try{
        const deletedItems = await Cart.deleteMany({userId: userId})
        if(!deletedItems){
            return res.status(200).json({message: `No Items found for user have Id: ${userId}`})
        }

        res.status(200).json({
            deletedItems,
            message: "Items deleted Successfully"
        })
    }
    catch(error){
        res.status(400).json({ message: error.message })
    }
}

module.exports = {
    viewCart: viewCart,
    addToCart: addToCart,
    createDiscountSummary: createDiscountSummary,
    viewDiscountSummary: viewDiscountSummary,
    updateProductQuantityInCart: updateProductQuantityInCart,
    deleteProductFromCart: deleteProductFromCart,
    emptyCart: emptyCart
}