import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const categories = [
  'Love',
  'Regret',
  'Goodbye',
  'Apology',
  'Gratitude',
  'Friendship',
  'Family',
  'Other'
];

const MAX_MESSAGE_LENGTH = 1000;
const MAX_TO_LENGTH = 100;

function PostForm() {
  const [formData, setFormData] = useState({
    to: '',
    message: '',
    category: 'Love'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Apply length restrictions
    if (name === 'message' && value.length > MAX_MESSAGE_LENGTH) return;
    if (name === 'to' && value.length > MAX_TO_LENGTH) return;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.to.trim().length < 2) {
      setError('Recipient name must be at least 2 characters long');
      return false;
    }
    if (formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters long');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await addDoc(collection(db, 'posts'), {
        ...formData,
        to: formData.to.trim(),
        message: formData.message.trim(),
        approved: false,
        createdAt: serverTimestamp()
      });

      // Reset form
      setFormData({
        to: '',
        message: '',
        category: 'Love'
      });
      setSuccess(true);

      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Error submitting message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getCharacterCountClass = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage < 70) return 'text-gray-500';
    if (percentage < 90) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Share Your Unspoken Words</h2>
      
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">Your message has been submitted for review. Thank you for sharing.</span>
          <button
            onClick={() => setSuccess(false)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            type="text"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            placeholder="Who is this message for?"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
          <div className={`text-right text-sm mt-1 ${getCharacterCountClass(formData.to.length, MAX_TO_LENGTH)}`}>
            {formData.to.length}/{MAX_TO_LENGTH}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Write your message here..."
            rows="6"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
          <div className={`text-right text-sm mt-1 ${getCharacterCountClass(formData.message.length, MAX_MESSAGE_LENGTH)}`}>
            {formData.message.length}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Message'}
        </button>
      </form>
    </div>
  );
}

export default PostForm; 