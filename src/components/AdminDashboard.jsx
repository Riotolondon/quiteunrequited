import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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

function AdminDashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const messagesRef = collection(db, 'posts');
      const q = query(messagesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedMessages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetchedMessages);
    } catch (err) {
      setError('Error fetching messages: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (messageId) => {
    try {
      const messageRef = doc(db, 'posts', messageId);
      await updateDoc(messageRef, {
        approved: true
      });
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, approved: true } : msg
      ));
      setSelectedMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    } catch (err) {
      setError('Error approving message: ' + err.message);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const messageRef = doc(db, 'posts', messageId);
      await deleteDoc(messageRef);
      setMessages(messages.filter(msg => msg.id !== messageId));
      setSelectedMessages(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    } catch (err) {
      setError('Error deleting message: ' + err.message);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedMessages.size === 0) return;
    
    try {
      const batch = writeBatch(db);
      selectedMessages.forEach(messageId => {
        const messageRef = doc(db, 'posts', messageId);
        batch.update(messageRef, { approved: true });
      });
      
      await batch.commit();
      
      setMessages(messages.map(msg => 
        selectedMessages.has(msg.id) ? { ...msg, approved: true } : msg
      ));
      setSelectedMessages(new Set());
    } catch (err) {
      setError('Error approving messages: ' + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMessages.size === 0 || !window.confirm(`Are you sure you want to delete ${selectedMessages.size} messages?`)) {
      return;
    }
    
    try {
      const batch = writeBatch(db);
      selectedMessages.forEach(messageId => {
        const messageRef = doc(db, 'posts', messageId);
        batch.delete(messageRef);
      });
      
      await batch.commit();
      
      setMessages(messages.filter(msg => !selectedMessages.has(msg.id)));
      setSelectedMessages(new Set());
    } catch (err) {
      setError('Error deleting messages: ' + err.message);
    }
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const toggleSelectAll = (filteredMessages) => {
    if (selectedMessages.size === filteredMessages.length) {
      setSelectedMessages(new Set());
    } else {
      setSelectedMessages(new Set(filteredMessages.map(msg => msg.id)));
    }
  };

  const filteredAndSortedMessages = () => {
    let result = [...messages];

    // Apply status filter
    if (filterStatus !== 'all') {
      const isApproved = filterStatus === 'approved';
      result = result.filter(message => message.approved === isApproved);
    }

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
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <button
            onClick={fetchMessages}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Messages
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search input */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>

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

        {selectedMessages.size > 0 && (
          <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
            <span className="text-sm text-gray-600">
              {selectedMessages.size} message{selectedMessages.size === 1 ? '' : 's'} selected
            </span>
            <button
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Approve Selected
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : displayedMessages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-500 mt-8">
          {searchTerm
            ? 'No messages found matching your search.'
            : filterStatus === 'all'
              ? 'No messages found.'
              : `No ${filterStatus} messages found.`}
        </div>
      ) : (
        <div className="space-y-6 mt-8">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedMessages.size === displayedMessages.length}
              onChange={() => toggleSelectAll(displayedMessages)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600">Select All</span>
          </div>

          {displayedMessages.map((message) => (
            <div
              key={message.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                message.approved ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'
              }`}
            >
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedMessages.has(message.id)}
                  onChange={() => toggleMessageSelection(message.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-4 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">To: {message.to}</h3>
                      <div className="flex space-x-2 mt-1">
                        <span className="inline-block px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-100 rounded-full">
                          {message.category}
                        </span>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          message.approved
                            ? 'text-green-600 bg-green-100'
                            : 'text-yellow-600 bg-yellow-100'
                        }`}>
                          {message.approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {message.createdAt?.toDate().toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{message.message}</p>
                  <div className="flex justify-end space-x-4">
                    {!message.approved && (
                      <button
                        onClick={() => handleApprove(message.id)}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard; 