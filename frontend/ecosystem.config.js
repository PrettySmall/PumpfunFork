module.exports = {
    apps: [
        {
            name: "nextjs-app", // Name of your app
            script: "node_modules/next/dist/bin/next", // Path to the Next.js start script
            args: "start", // Command to run the app in production mode
            instances: 12, // Number of CPU cores to utilize (max cores = 16)
            exec_mode: "cluster", // Use cluster mode for load balancing
            watch: false, // Disable watching for production
            env: {
            NODE_ENV: "production", // Environment variables
            PORT: 3000, // App port
            },
        },
    ],
};