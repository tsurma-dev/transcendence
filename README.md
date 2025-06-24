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

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

   The backend server will start on `http://localhost:3000` (or the port specified in your configuration).

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Serve the built files:
   ```bash
   npx serve dist
   ```

## Development Commands

### Frontend Development Commands

- **Install dependencies**: `npm install`
- **Build CSS**: `npm run build:css`
- **Build TypeScript**: `npm run build:ts`
- **Copy HTML files**: `npm run copy:html`
- **Copy assets**: `npm run copy:assets`
- **Full build**: `npm run build`

### Backend Development Commands

- **Install dependencies**: `npm install`
- **Start server**: `npm start`
- **Development mode** (if nodemon is configured): `npm run dev`

## Quick Start

To get the entire application running:

1. **Setup Backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Setup Frontend** (in a new terminal):
   ```bash
   cd frontend
   npm install
   npm run build
   npx serve dist
   ```

3. **Access the application**:
   - Frontend: `http://localhost:3000` (or the port shown by your serve command)
   - Backend API: `http://localhost:3000` (or your configured backend port)

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

- **Pong Game**: Classic Pong implementation using HTML5 Canvas
- **Controls**: 
  - Left paddle: W (up) / S (down)
  - Right paddle: Arrow keys (up/down)

## Development Notes

- The frontend uses TypeScript with strict type checking enabled
- Tailwind CSS is configured for styling
- The project structure separates concerns between frontend and backend
- Static assets are copied during the build process

## Troubleshooting

### Common Issues

1. **Node modules not found**: Run `npm install` in the respective directory
2. **Build errors**: Ensure all dependencies are installed and TypeScript configuration is correct
3. **Port conflicts**: Check if the default ports are available or configure different ones

### TypeScript Build Issues

If you encounter TypeScript compilation errors:
1. Ensure all dependencies are installed: `npm install`
2. Check that your `tsconfig.json` is properly configured
3. Verify that all required type definitions are available

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


