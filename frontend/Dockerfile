FROM node:20-alpine
ARG CACHEBUST=1
RUN echo "Build ID: $CACHEBUST" && npm install -g serve
WORKDIR /app
COPY dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
# cache-bust: 1772990495
