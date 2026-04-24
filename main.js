// Importing necessary modules and configurations
import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config.js";

// Load environment variables
dotenv.config();

// Define the port to listen on
const PORT = process.env.PORT || 3000;

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Start the server and listen on the specified port
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    }).on('error', (error) => {
      console.error(`Server Error: ${error.message}`);
      process.exit(1);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
