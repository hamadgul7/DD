const FAQ = require('../../model/faqs-model');

async function addFAQs(req, res){
    const { question, answer } = req.body;
    try {
        const newFaq = new FAQ({ question, answer });
        await newFaq.save();
        res.status(201).json({ message: 'FAQ created successfully', FAQ: newFaq });
    } catch (err) {
        res.status(400).json({ message: 'Failed to create FAQ', error: err.message });
    }
}

module.exports = {
    addFAQs: addFAQs
}