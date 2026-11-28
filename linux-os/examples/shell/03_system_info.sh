#!/bin/bash
# Print some system information
echo "User:     $(whoami)"
echo "Host:     $(hostname)"
echo "Folder:   $(pwd)"
echo "Date:     $(date)"
echo "Files here: $(ls | wc -l)"
