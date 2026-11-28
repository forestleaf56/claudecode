#!/bin/bash
# Working with files and folders
mkdir -p demo
echo "first line" > demo/notes.txt
echo "second line" >> demo/notes.txt
echo "Created demo/notes.txt with $(wc -l < demo/notes.txt) lines:"
cat demo/notes.txt
ls -l demo
rm -r demo
echo "Cleaned up."
