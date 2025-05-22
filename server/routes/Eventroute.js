import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const router = express.Router();


const verifyOrganizer = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ msg: "Unauthorized" });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || user.role !== 'organizer') {
      return res.status(403).json({ msg: "Organizer access required" });
    }
    
    req.user = user; // Attach the user document
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
  }
};

// POST /events route
router.post('/', verifyOrganizer, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user._id, // Ensure this is correctly set
      image: req.body.image || defaultImages[Math.floor(Math.random() * defaultImages.length)],
      tickets: req.body.tickets.map(ticket => ({
        ...ticket,
        quantity: parseInt(ticket.quantity)
      }))
    };
    const event = new Event(eventData);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get public events
router.get('/public/events', async (req, res) => {
  try {
    const { page = 1, search = '', upcomingOnly = false } = req.query;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    
    const query = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (upcomingOnly === 'true') {
      query.date = { $gte: new Date() };
    }
    
    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('organizer', 'name')
        .sort({ date: 1 })
        .skip(skip)
        .limit(pageSize)
        .select('-attendees'),
      Event.countDocuments(query)
    ]);

    res.json({
      events,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error("Get Public Events Error:", error.message);
    res.status(500).json({ 
      msg: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Failed to get events' 
    });
  }
});

// Get all events for logged-in organizer
router.get('/', verifyOrganizer, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id })
      .populate('organizer', 'name')
      .sort({ date: 1 })
      .select('-attendees.paymentDetails');

    res.json(events);
  } catch (error) {
    console.error("Get Events Error:", error.message);
    res.status(500).json({ 
      msg: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Server error' 
    });
  }
});

// Create new event
const defaultImages = [
  'https://example.com/default1.jpg',
  'https://example.com/default2.jpg',
  'https://example.com/default3.jpg'
];


// Update event
router.get('/event/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate({
        path: 'organizer',
        select: 'name email organizerInfo.stripeAccountId organizerInfo.stripeAccountStatus' // Populate organizer details
      });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get event attendees (organizer only)
router.get('/event/:eventId/attendees', verifyOrganizer, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.eventId)) {
      return res.status(400).json({ msg: "Invalid event ID" });
    }

    const event = await Event.findById(req.params.eventId)
      .select('attendees')
      .populate('attendees.user', 'name email');

    if (!event) return res.status(404).json({ msg: "Event not found" });
    
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    res.json(event.attendees);
  } catch (error) {
    console.error("Get Attendees Error:", error.message);
    res.status(500).json({ 
      msg: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Failed to get attendees' 
    });
  }
});

// Delete event
router.delete('/event/:eventId', verifyOrganizer, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ 
      _id: req.params.eventId,
      organizer: req.user._id 
    });
    
    if (!event) return res.status(404).json({ msg: "Event not found" });
    
    res.json({ msg: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: 'Failed to delete event' });
  }
});

export default router;