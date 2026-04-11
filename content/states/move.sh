#!/bin/bash

# Find all index.md files in subdirectories
find . -name index.md -type f | while read file; do
  # Get the parent directory of the file
  dir=$(dirname "$file")
  # Rename the file to the parent directory
  mv "$file" "$dir/`basename "$dir"`.md"
  # Find all image files in the same directory as the index.md file
  find "$dir" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" \) | while read image; do
    # Move the image to the parent directory
    mv "$image" "$dir/.."
  done
  # Move the file to the parent directory
  mv "$dir/`basename "$dir"`.md" "$dir/.."
done
