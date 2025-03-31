import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const categories = [
  'All',
  'Love',
  'Regret',
  'Goodbye',
  'Apology',
  'Gratitude',
  'Friendship',
  'Family',
  'Other'
];

function MessageWall() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [relatedMessages, setRelatedMessages] = useState(new Set());

  useEffect(() => {
    // Load related messages from localStorage
    const savedRelatedMessages = localStorage.getItem('relatedMessages');
    if (savedRelatedMessages) {
      setRelatedMessages(new Set(JSON.parse(savedRelatedMessages)));
    }
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesRef = collection(db, 'posts');
      const q = query(
        messagesRef,
        where('approved', '==', true),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        relateCount: 0,
        ...doc.data()
      }));
      
      setMessages(fetchedMessages);
    } catch (err) {
      setError('Error fetching messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRelate = async (messageId) => {
    try {
      const messageRef = doc(db, 'posts', messageId);
      
      // Update local state first for immediate feedback
      setRelatedMessages(prev => {
        const next = new Set(prev);
        if (next.has(messageId)) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        // Save to localStorage
        localStorage.setItem('relatedMessages', JSON.stringify([...next]));
        return next;
      });

      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                relateCount: (msg.relateCount || 0) + (relatedMessages.has(messageId) ? -1 : 1)
              }
            : msg
        )
      );

      // Update Firestore
      await updateDoc(messageRef, {
        relateCount: increment(relatedMessages.has(messageId) ? -1 : 1)
      });
    } catch (err) {
      setError('Error updating relate count: ' + err.message);
      // Revert local state on error
      setRelatedMessages(prev => {
        const next = new Set(prev);
        if (next.has(messageId)) {
          next.delete(messageId);
        } else {
          next.add(messageId);
        }
        return next;
      });
    }
  };

  const filteredAndSortedMessages = () => {
    let result = [...messages];

    // Apply category filter
    if (selectedCategory !== 'All') {
      result = result.filter(message => message.category === selectedCategory);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(message =>
        message.message.toLowerCase().includes(searchLower) ||
        message.to.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (sortOrder === 'oldest') {
      result.reverse();
    }

    return result;
  };

  const displayedMessages = filteredAndSortedMessages();

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
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
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
        <h2 className="text-2xl font-bold text-gray-800">Message Wall</h2>
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Sort order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : displayedMessages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
          {searchTerm
            ? 'No messages found matching your search.'
            : selectedCategory === 'All'
              ? 'No messages found.'
              : `No messages found in the ${selectedCategory} category.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedMessages.map((message) => (
            <div
              key={message.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">To: {message.to}</h3>
                  <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                    {message.category}
                  </span>
                </div>
                <span className="text-sm text-gray-500">
                  {message.createdAt?.toDate().toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mb-4">{message.message}</p>
              <div className="flex justify-end items-center">
                <button
                  onClick={() => handleRelate(message.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                    relatedMessages.has(message.id)
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill={relatedMessages.has(message.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  <span>
                    {relatedMessages.has(message.id) ? 'Related' : 'Relate'} 
                    {message.relateCount > 0 && ` (${message.relateCount})`}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MessageWall; 