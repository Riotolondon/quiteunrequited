# Quite Unrequited

A platform for sharing unspoken words and messages that were never delivered.

## Features

- Share anonymous messages
- Browse approved messages
- Admin dashboard for message moderation
- Category-based message organization
- Real-time updates with Firebase

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Firebase account and project

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quiteunrequited.git
cd quiteunrequited
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Development

Run the development server:
```bash
npm run dev
```

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
npm run deploy
```

Or deploy specific services:
```bash
npm run deploy:hosting  # Deploy only hosting
npm run deploy:firestore  # Deploy only Firestore rules
```

## Project Structure

- `src/` - Source code
  - `components/` - React components
  - `contexts/` - React contexts
  - `firebase.js` - Firebase configuration
- `public/` - Static assets
- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Firestore indexes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
