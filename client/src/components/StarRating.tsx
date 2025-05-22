import { useState, useEffect } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { useAuth } from '../context/Authcontext';
interface Review {
  _id: string;
  rating: number;
  comment: string;
  user: {
    name: string;
  };
}

const StarRating = ({ eventId }: { eventId: string }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
  const { user } = useAuth();

  const fetchReviews = async () => {
    try {
      const response = await API.get(`/reviews/${eventId}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [eventId]);

  const submitReview = async () => {
    if (!user) {
      toast.error('Please log in to submit a review');
      return;
    }

    try {
      await API.post(`/reviews/${eventId}`, userReview);
      setUserReview({ rating: 5, comment: '' });
      fetchReviews();
    } catch (error) {
      toast.error('Failed to submit review');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <h4 className="text-lg font-bold mb-4">Write a Review</h4>
      <div className="flex items-center gap-2 mb-4">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            onClick={() => setUserReview(prev => ({ ...prev, rating: i + 1 }))}
            className={`text-2xl ${i < userReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={userReview.comment}
        onChange={(e) => setUserReview(prev => ({ ...prev, comment: e.target.value }))}
        className="w-full p-2 border rounded mb-4"
        placeholder="Share your experience..."
      />
      <button
        onClick={submitReview}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        Submit Review
      </button>

      <div className="mt-8 space-y-6">
        {reviews.map(review => (
          <div key={review._id} className="border-b pb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600 text-sm">
                by {review.user.name}
              </span>
            </div>
            <p className="text-gray-800">{review.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StarRating;