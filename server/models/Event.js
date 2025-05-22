import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  location: String, 
  coordinates: {
    lat: Number,
    lng: Number
  },
  image: {
    type: String,
    default: "",
    validate: {
      validator: (v) => v === "" || /^(https?:\/\/).+\.(jpg|jpeg|png|gif|webp)$/i.test(v),
      message: "Invalid image URL format"
    }
  },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tickets: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    description: String,
  }],
  stripePriceId: String,
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ticketType: String,
    purchaseDate: Date,
    pricePaid: Number,
  }],
  categories: [String],
averageRating: { type: Number, default: 0 },
reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }]
}, { timestamps: true });

export default mongoose.model('Event', EventSchema);

const defaultImages = [
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800',
  'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=800',
  'https://images.unsplash.com/photo-1621609764095-b32bbe3792f1?auto=format&fit=crop&w=800'
];