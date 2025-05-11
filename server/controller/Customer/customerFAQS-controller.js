const FAQ = require('../../model/faqs-model');


async function getQuestions(req, res){
    try {
        const questions = await FAQ.find().select('_id question');
        res.status(200).json(questions);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch questions' });
    }
}

async function getAnswers(req, res){
    try {
        const { answerId } = req.query;
        const faq = await FAQ.findById(answerId).select('answer');
    if (!faq) {
        return res.status(404).json({ message: 'FAQ not found' });
    }
        res.status(200).json({ answer: faq.answer });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch answer' });
    }
}


module.exports = {
    getQuestions: getQuestions,
    getAnswers: getAnswers
}