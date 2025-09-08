FROM n8nio/n8n:latest

# Set timezone
ENV TZ=America/New_York

# Set the data directory
ENV N8N_USER_FOLDER=/home/node/.n8n

# Create the data directory and set permissions
USER root
RUN mkdir -p /home/node/.n8n && \
    chown -R node:node /home/node/.n8n && \
    chmod -R 755 /home/node/.n8n

# Switch back to node user
USER node

# Create subdirectories for n8n data
RUN mkdir -p /home/node/.n8n/nodes && \
    mkdir -p /home/node/.n8n/custom && \
    mkdir -p /home/node/.n8n/workflows

# Expose the port that n8n runs on
EXPOSE 5678

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5678/healthz || exit 1

# Start n8n
CMD ["n8n"]