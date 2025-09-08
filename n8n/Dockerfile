FROM n8nio/n8n:latest

# Set timezone
ENV TZ=America/New_York

# Set the data directory
ENV N8N_USER_FOLDER=/home/node/.n8n

# Create the data directory
USER root
RUN mkdir -p /home/node/.n8n && chown -R node:node /home/node/.n8n
USER node

# Expose the port that n8n runs on
EXPOSE 5678

# Start n8n
CMD ["n8n"]