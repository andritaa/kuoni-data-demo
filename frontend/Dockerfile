FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
ARG CACHEBUST=1
RUN echo "Build ID: $CACHEBUST"
COPY dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
