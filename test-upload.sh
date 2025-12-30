#!/bin/bash

# Test the chat upload endpoint
curl -X POST http://localhost:4000/api/chat/upload \
  -F "file=@test.jpg" \
  -H "Content-Type: multipart/form-data"
