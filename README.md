# Transcendence

A full-stack web application with a Fastify backend and TypeScript frontend featuring a Pong game, styled with TailwindCSS.

## Project Structure

```
transcendence/
├── backend/          # Fastify backend server
│   ├── src/
│   ├── public/
│   └── package.json
├── frontend/         # TypeScript frontend with Tailwind CSS
│   ├── src/
│   ├── dist/
│   └── package.json
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Redis (for backend session management)

## Installation & Setup

### Backend Setup

1. **Start Redis** (required for backend):
   ```bash
   # On macOS (using Homebrew)
   brew install redis
   brew services start redis
   
   # On Linux - Option 1: Using Docker
   docker run -d -p 6379:6379 --name redis redis:alpine
   
   # On Linux - Option 2: Download and run manually
   # Download Redis from https://redis.io/download
   # Extract and run: ./redis-server
   
   # Or start manually for this session (any OS)
   redis-server
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   The backend server will start on `https://localhost:8443`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will build and serve on `http://localhost:3000`

## Development Commands

### Frontend Development Commands

- **Development server**: `npm run dev` (builds and serves)
- **Build only**: `npm run build`
- **Serve existing build**: `npm run serve`
- **Install dependencies**: `npm install`

### Backend Development Commands

- **Development server**: `npm run dev` (with auto-restart)
- **Install dependencies**: `npm install`

## Quick Start

To get the entire application running:

1. **Start Redis** (required):
   ```bash
   # On macOS
   brew services start redis
   
   # On Linux - Using Docker
   docker run -d -p 6379:6379 --name redis redis:alpine
   
   # On Linux - Manual start (if downloaded)
   redis-server
   ```

2. **Setup Backend** (Terminal 1):
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Backend will be available at `https://localhost:8443`

3. **Setup Frontend** (Terminal 2):
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

4. **Access the application**:
   - **Game**: Open `http://localhost:3000` in your browser
   - **Backend API**: Available at `https://localhost:8443`
   - **Backend Registration**: `https://localhost:8443/register`

## Technologies Used

### Frontend
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework for rapid UI development
- **PostCSS** - CSS post-processor
- **HTML5 Canvas** - For the Pong game rendering

### Backend
- **Node.js** - JavaScript runtime
- **Fastify** - Fast and low overhead web framework
- **Various middleware** - For authentication, database, etc.

## Game Features

- **Pong Game**: Classic Pong implementation with scalable SPA architecture
- **Player Setup**: Enter player names before starting the game
- **Score Tracking**: Real-time score counter for both players
- **Online Users**: Shows count of logged-in users (backend integration)
- **Controls**: 
  - Player 1 (Left): W (up) / S (down)
  - Player 2 (Right): Arrow keys (up/down)

## Architecture

### Frontend
- **Component-based SPA**: Scalable single-page application structure
- **Screen Management**: Easy navigation between different game screens
- **Template System**: HTML templates for reusable UI components
- **Backend Integration**: Connects to backend for user data

### Backend
- **Fastify Framework**: Fast and efficient web server
- **Redis Integration**: Session management and user tracking
- **CORS Enabled**: Allows frontend-backend communication
- **Authentication**: User registration and login system

## Development Notes

- The frontend uses TypeScript with strict type checking enabled
- Tailwind CSS is configured for styling
- The project structure separates concerns between frontend and backend
- Static assets are copied during the build process

## Troubleshooting

### Common Issues

1. **"0 users online" showing**: 
   - Ensure Redis is running: `brew services start redis`
   - Restart backend: `npm run dev` in backend folder
   - Check browser console for CORS errors

2. **Backend won't start**:
   - **Install Redis (choose one option)**:
     - **macOS**: `brew install redis`
     - **Linux with Docker**: `docker run -d -p 6379:6379 --name redis redis:alpine`
     - **Linux manual install**: Download from https://redis.io/download and run `./redis-server`
   - **Start Redis**: Use appropriate command from above
   - Install backend dependencies: `npm install`

3. **CORS errors in browser**:
   - Ensure backend includes `@fastify/cors` package
   - Backend should allow `http://localhost:3000` origin

4. **Certificate warnings**:
   - Visit `https://localhost:8443` directly and accept the certificate
   - This allows frontend to call backend APIs

5. **Port conflicts**: 
   - Backend uses `https://localhost:8443`
   - Frontend uses `http://localhost:3000`
   - Change ports in configuration if needed

### Development Tips

- Use browser Developer Tools (F12) to debug API calls
- Check backend logs for errors
- Ensure both servers are running simultaneously for full functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## MIT License

This project is licensed under the MIT License - see below for details.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```


