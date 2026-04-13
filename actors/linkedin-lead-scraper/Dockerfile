# Use the Apify Playwright+Chrome base image
FROM apify/actor-node-playwright-chrome:20

# Copy package files
COPY package*.json ./

# Install dependencies (including Playwright browsers)
RUN npm --quiet set progress=false \
    && npm install --omit=dev --omit=optional \
    && echo "All packages installed"

# Copy source code
COPY . ./

# Run the actor
CMD npm start --silent
