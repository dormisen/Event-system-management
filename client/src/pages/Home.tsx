import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Ticket, ArrowRight, Music, Camera, Utensils } from 'lucide-react';
import landingpicture from '../assets/images/landing.jpg';
import EventCard from '../components/EventCard';
import { EventType } from '../assets/types';

function Home() {
  const sampleEvents: EventType[] = [
    {
      _id: '1',
      title: 'Summer Music Festival 2024',
      date: '2024-07-15T18:00:00',
      startTime: '18:00',
      endTime: '23:00',
      location: 'Central Park, New York',
      description: 'Join us for the biggest summer music festival featuring top artists from around the world. Three stages of non-stop music and entertainment!',
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
      imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063',
      price: 89.99,
      quantity: 1000,
      tickets: [{ _id: 't1', name: 'General Admission', price: 89.99, quantity: 1000, description: 'Standard entry ticket with access to all main stages' }],
      category: 'Music',
      organizer: {
        id: 'org1',
        name: 'EventHub Productions',
        email: 'contact@eventhub.com',
        role: 'organizer',
        isVerified: true,
        accessToken: '',
        isBlocked: false
      },
      status: 'upcoming',
      cordinates: { lat: 40.7829, lng: -73.9654 },
      attendees: []
    },
    {
      _id: '2',
      title: 'Food & Wine Experience',
      date: '2024-06-22T12:00:00',
      startTime: '12:00',
      endTime: '20:00',
      location: 'Downtown Convention Center',
      description: 'A gourmet journey through world cuisines with master chefs and sommeliers. Unlimited tastings and cooking demonstrations.',
      image: 'https://images.unsplash.com/photo-1576796373954-5b046a2f55b0',
      imageUrl: 'https://images.unsplash.com/photo-1576796373954-5b046a2f55b0',
      price: 199.99,
      quantity: 200,
      tickets: [{ _id: 't2', name: 'VIP Pass', price: 199.99, quantity: 200, description: 'Premium access with exclusive benefits' }],
      category: 'Food',
      organizer: {
        id: 'org2',
        name: 'Culinary Events Co.',
        email: 'events@culinary.com',
        role: 'organizer',
        isVerified: true,
        accessToken: '',
        isBlocked: false
      },
      status: 'upcoming',
      cordinates: { lat: 40.7128, lng: -74.0060 },
      attendees: []
    },
    {
      _id: '3',
      title: 'Tech Innovators Conference',
      date: '2024-09-05T09:00:00',
      startTime: '09:00',
      endTime: '17:00',
      location: 'Silicon Valley Expo Hall',
      description: 'Annual gathering of tech leaders and startups showcasing the latest innovations in AI, blockchain, and quantum computing.',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
      price: 299.99,
      quantity: 500,
      tickets: [{ _id: 't3', name: 'Early Bird', price: 299.99, quantity: 500, description: 'Early bird ticket with special pricing' }],
      category: 'Technology',
      organizer: {
        id: 'org3',
        name: 'Tech Events Inc',
        email: 'info@techevents.com',
        role: 'organizer',
        isVerified: true,
        accessToken: '',
        isBlocked: false
      },
      status: 'upcoming',
      cordinates: { lat: 37.4484, lng: -122.1607 },
      attendees: []
    },
  ];

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center md:h-[700px]">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={landingpicture} 
            alt="People enjoying an event" 
            className="w-full h-full object-cover object-center lg:object-[center_top_-50px]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        </div>
        
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="max-w-3xl text-center md:text-left"
          >
            <h1 className="text-4xl font-bold mb-6 sm:text-5xl md:text-6xl lg:leading-tight bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
              Experience Moments That Matter
            </h1>
            <p className="text-lg text-gray-200 mb-8 md:text-xl md:max-w-2xl">
              Discover, connect, and celebrate with unforgettable events curated just for you. Your next adventure starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                to="/events"
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                Explore Events <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/register"
                className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/20 transition-all duration-300 flex items-center justify-center border border-white/20 shadow-lg hover:shadow-xl"
              >
                Create Account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12 md:text-4xl">
          Explore By Category
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
          {[
            { icon: <Music className="h-8 w-8" />, name: 'Music' },
            { icon: <Camera className="h-8 w-8" />, name: 'Art' },
            { icon: <Utensils className="h-8 w-8" />, name: 'Food' },
            { icon: <Ticket className="h-8 w-8" />, name: 'Sports' },
            { icon: <Users className="h-8 w-8" />, name: 'Networking' },
          ].map((category, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                  {category.icon}
                </div>
                <h3 className="text-lg font-medium text-gray-800">{category.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-gray-800 md:text-4xl">
            Featured Events
          </h2>
          <Link
            to="/events"
            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 group"
          >
            View All Events
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {sampleEvents.map((event, index) => (
            <motion.div 
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <EventCard event={event} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 lg:p-12 shadow-xl">
          <h2 className="text-3xl font-bold text-center text-white mb-12 md:text-4xl">
            Why Choose EventHub?
          </h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
            {[
              {
                title: "Curated Selection",
                description: "Hand-picked events ensuring quality and authenticity"
              },
              {
                title: "Secure Payments",
                description: "Encrypted transactions with multiple payment options"
              },
              {
                title: "Smart Recommendations",
                description: "Personalized suggestions based on your interests"
              },
              {
                title: "24/7 Support",
                description: "Dedicated customer service team always available"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 text-2xl font-bold text-white">0{index + 1}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-indigo-100 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 100 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4 md:text-4xl">
              Ready to Create Unforgettable Memories?
            </h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Join our community of event enthusiasts and discover experiences that will stay with you forever.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Start Exploring
              </Link>
              <Link
                to="/events"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Browse Events
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Home;