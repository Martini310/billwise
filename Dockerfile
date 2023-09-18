# Use an official Python runtime as a parent image
FROM python:3.11

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y libpq-dev

# Install vim
RUN ["apt-get", "update"]
RUN ["apt-get", "-y", "install", "vim"]

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the Django project into the container
COPY . /app/

# Expose the port your application runs on
EXPOSE 8000

# Start Gunicorn and run migrations when the container starts
CMD ["sh", "-c", "python manage.py migrate && gunicorn billwise.wsgi:application --bind 0.0.0.0:8000"]
