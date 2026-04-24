#!/bin/sh

# Wait for DB (optional, but good for stability)
echo "Running database synchronization..."
prisma db push --accept-data-loss

echo "Starting server..."
node server.js
