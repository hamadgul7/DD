const {Achievement, Mission} = require('../../model/achievementAndMissions-model');

async function addAchievement(req, res){
    const { title, description, points, target } = req.body;

    if (!title || !target) {
        return res.status(400).json({ error: 'User ID, title, and target are required.' });
    }

    try {
        const newAchievement = new Achievement({
            title,
            description,
            points,
            target,
            progress: 0, 
            completed: false, 
            dateAchieved: null 
        });

        await newAchievement.save();

        res.status(201).json({
        message: 'Achievement milestone created successfully',
        achievement: newAchievement
        });
    } catch (error) {
        console.error('Error adding achievement:', error);
        res.status(500).json({ error: 'Server error while adding achievement' });
    }
}

async function addMission(req, res){
    try {
        const { title, description, points, target } = req.body;
    
        if (!title || typeof target !== 'number') {
          return res.status(400).json({ message: 'Title and target are required' });
        }
    
        const mission = new Mission({
          title,
          description,
          points,
          target
        });
    
        await mission.save();
        res.status(201).json(mission);
      } catch (error) {
        console.error('Error creating mission:', error);
        res.status(500).json({ message: 'Server error' });
      }
}

module.exports = {
    addAchievement: addAchievement,
    addMission: addMission
}