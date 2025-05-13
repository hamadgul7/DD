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

async function viewFAQsWithPagination(req, res){
    try {
        const { pageNo, limit } = req.query;

        const pageNumber = parseInt(pageNo);
        const pageLimit = parseInt(limit);

        if (pageNumber < 1 || pageLimit < 1) {
        return res.status(400).json({ message: 'Page Number and Limit must be positive numbers' });
        }

        const skip = (pageNumber - 1) * pageLimit;

        const totalFAQs = await FAQ.countDocuments();
        const totalPages = Math.ceil(totalFAQs / pageLimit);

        const faqs = await FAQ.find().skip(skip).limit(pageLimit);

        res.status(200).json({
        faqs,
        meta: {
            totalItems: totalFAQs,
            totalPages,
            currentPage: pageNumber,
            pageLimit,
            nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
            previousPage: pageNumber > 1 ? pageNumber - 1 : null
        },
        message: 'FAQs retrieved successfully'
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch FAQs', error: err.message });
    }
}

async function updateFAQs(req, res){
    const { faqId, question, answer } = req.body;

    try {
        const updatedFaq = await FAQ.findByIdAndUpdate(
        faqId,
        { question, answer },
        { new: true, runValidators: true }
        );

        if (!updatedFaq) {
        return res.status(404).json({ message: 'FAQ not found' });
        }

        res.json({ message: 'FAQ updated successfully', faq: updatedFaq });
    } catch (err) {
        res.status(400).json({ message: 'Failed to update FAQ', error: err.message });
    }
}

async function deleteFAQs(req, res){
    try {
        const { faqId } = req.body;
        const deletedFaq = await FAQ.findByIdAndDelete(faqId);

    if (!deletedFaq) {
        return res.status(404).json({ message: 'FAQ not found' });
    }

    res.json({ message: 'FAQ deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete FAQ', error: err.message });
    }
}

module.exports = {
    addFAQs: addFAQs,
    viewFAQsWithPagination: viewFAQsWithPagination,
    updateFAQs: updateFAQs,
    deleteFAQs: deleteFAQs
}