const express = require('express');
const Gun = require('gun');
const cors = require('cors');

const app = express();
const port = 8765;

// Enable CORS
app.use(cors());

// Serve static files if needed
app.use(express.static('public'));
app.use(Gun.serve);

// Create an HTTP server
const server = app.listen(port, () => {
  console.log(`Gun server running at http://localhost:${port}`);
});

// Initialize Gun
const gun = Gun({
  web: server,
  file: 'data.json', // Persist data to this file
  multicast: false   // Disable multicast for production
});

// Create a reference to the files data
const filesRef = gun.get('files');

// Optional: Monitor file changes
filesRef.on((data) => {
  console.log('File change detected:', data);
});

// Optional: Set up a route for health check
app.get('/health', (req, res) => {
  res.send('Server is running');
});

// Function to clean up old data
const cleanUpOldData = () => {
  console.log('Running cleanup task...');
  filesRef.map().once((data, key) => {
    if (data && data.timestamp) {
      const currentTime = Date.now();
      const dataTime = data.timestamp;
      const timeDifference = currentTime - dataTime;

      // Check if the data is older than 24 hours (86400000 milliseconds)
      if (timeDifference > 86400000) {
        console.log(`Deleting old data with key: ${key}`);
        filesRef.get(key).put(null); // Remove the data
      }
    }
  });
};

// Schedule the cleanup task to run every hour
setInterval(cleanUpOldData, 3600000); // 3600000 milliseconds = 1 hour