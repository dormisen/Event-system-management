// routes/ReviewRoute.js
import express from 'express';
const router = express.Router();

router.post('/:eventId', async (req, res) => {
  try {
    const review = new Review({
      ...req.body,
      event: req.params.eventId,
      user: req.user.id
    });
    await review.save();
    
    // Update event average rating
    const event = await Event.findById(req.params.eventId);
    const reviews = await Review.find({ event: event._id });
    event.averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    event.reviews.push(review._id);
    await event.save();

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:eventId', async (req, res) => {
  try {
    const reviews = await Review.find({ event: req.params.eventId })
      .populate('user', 'name avatar');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});