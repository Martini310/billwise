#!/bin/bash

if ps aux | grep 'celery worker' | grep -v grep > /dev/null; then
  exit 0
else
  exit 1
fi