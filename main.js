// Import .env Variables
import "dotenv/config";

// Import the Express app and database connection
import app from "./app.js";
import connectDB from "./config/database.config.js";

// Define the port to listen on
const PORT = process.env.PORT || 3000;

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Start the server and listen on the specified port
    app
      .listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
      })
      .on("error", (error) => {
        console.error(`Server Error: ${error.message}`);
        process.exit(1);
      });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
