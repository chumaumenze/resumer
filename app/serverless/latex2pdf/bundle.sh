#!/bin/bash

SITE_PACKAGES=$(pipenv --venv)/lib/python3.8/site-packages
echo "Pipenv Library Location: $SITE_PACKAGES"
DIR=$(pwd)

# Make sure pipenv is good to go
echo "Do fresh install to make sure everything is there"
pipenv install

zip -r9 $DIR/package.zip $SITE_PACKAGES/*

cd $DIR
zip -g package.zip posts.py
