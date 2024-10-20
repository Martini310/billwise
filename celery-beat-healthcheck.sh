#!/bin/bash

if ps aux | grep 'celery beat' | grep -v grep > /dev/null; then
  exit 0
else
  exit 1
fi