#!/bin/bash

# create a new directory to move all the files to
mkdir output

# find all index.md files in subdirectories and rename them to the name of their parent directory
find . -name "index.md" -exec sh -c 'mv "$1" "$(dirname "$1")/$(basename "$(dirname "$1")").md"' _ {} \;

# move all files from subdirectories to the new directory
find . -mindepth 2 -type f -exec mv {} new_directory \;
