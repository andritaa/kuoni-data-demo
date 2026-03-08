FROM node:20-alpine
ARG CACHEBUST=1
RUN echo "Deploy ID: $CACHEBUST" && npm install -g serve
WORKDIR /app
COPY dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
