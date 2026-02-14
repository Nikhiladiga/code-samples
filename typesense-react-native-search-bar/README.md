# React Native Search Bar with Typesense

A modern search bar application built with React Native (Expo) and Typesense, featuring instant search capabilities for mobile devices.

## Tech Stack

- React Native (Expo)
- Typesense
- TypeScript

## Prerequisites

- Node.js 18+ and npm 9+.
- Docker (for running Typesense locally). Alternatively, you can use a Typesense Cloud cluster.
- Expo Go app on your mobile device or an iOS/Android simulator.
- Basic knowledge of React Native.

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/typesense/code-samples.git
cd typesense-react-native-search-bar
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root with the following content:

```env
EXPO_PUBLIC_TYPESENSE_API_KEY=xyz
EXPO_PUBLIC_TYPESENSE_HOST=10.0.2.2
EXPO_PUBLIC_TYPESENSE_PORT=8108
EXPO_PUBLIC_TYPESENSE_PROTOCOL=http
```

**Note**:

- For Android emulator, use `10.0.2.2` as the host (this maps to `localhost` on your machine).
- For iOS simulator, use `localhost` as the host.
- For physical devices, use your machine's local IP address (e.g., `192.168.1.100`) or use Typesense Cloud cluster.

### 4. Project Structure

```text
├── components
│   ├── BookCard.tsx
│   ├── BookList.tsx
│   ├── Heading.tsx
│   └── SearchInput.tsx
├── types
│   └── Book.ts
├── utils
│   └── typesense.ts
├── App.tsx
├── app.json
└── package.json
```

### 5. Start the development server

```bash
npx expo start
```

This will start the Expo development server. You can then:

- Scan the QR code with Expo Go app (Android) or Camera app (iOS).
- Press `a` to open in Android emulator.
- Press `i` to open in iOS simulator.

### 6. Deployment

For production deployment, we don't recommend storing sensitive information in the environment variables. Instead, use a backend service to handle the API requests with some form of authentication.
