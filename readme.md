# BillWise

Billwise is my first fullstack project in Django Rest Framework, NextJS and Celery.  
The purpose of the app is to manage payments from different suppliers in one place. No more logging to every supplier page separately. Here you have everything in one complex dashboard with overall view, statistics and charts.

## 🛠️ Tech stack

<img src="https://img.shields.io/badge/Python-FFD43B?style=for-the-badge&logo=python&logoColor=blue">
<img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green">
<img src="https://img.shields.io/badge/django%20rest-ff1709?style=for-the-badge&logo=django&logoColor=white">
<img src="https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E">
<img src="https://img.shields.io/badge/next%20js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white">
<img src="https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white">
<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white">
<img src="https://img.shields.io/badge/rabbitmq-%23FF6600.svg?&style=for-the-badge&logo=rabbitmq&logoColor=white">
<img src="https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white">
<img src="https://img.shields.io/badge/axios-671ddf?&style=for-the-badge&logo=axios&logoColor=white">
<img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white">

## 📋 Table of Contents

- [Installation](#🏗️installation)
  - [Live preview](#live-preview-🔍)
  - [Docker](#docker-🐋)
  - [Run locally](#run-locally-💻)
- [Usage](#🚀usage)
- [Configuration](#🔧configuration)
- [Feature Roadmap](#📒feature-roadmap)
- [Contributing](#👥contributing)
- [License](#📋license)
- [Support & Contact](#📨support--contact)

## 🏗️Installation

### Live preview 🔍

#### Billwise is deployed on:
 - [Render](https://render.com/) (*Redis*)
 - [DigitalOcean](https://digitalocean.com/) (*API and Celery*)
 - [Koyeb](https://www.koyeb.com/) (*Frontend*)<br>
 to minimize costs. You can see the App in action [here](https://billwise-martini310.koyeb.app/).  
<br>



---

### Docker 🐋

You can also run the app locally using Docker. There are ready to use Dockerfiles and docker-compose. You only need to clone the repository and run docker compose.

```bash
git clone https://github.com/Martini310/billwise.git
```

And run the container

```bash
docker-compose up
```

---

### Run locally 💻

If you want to run all the services manually it is also easy but require a little more work.

### Prerequisites

Before you get started, make sure you have the following installed:

- [Python](https://www.python.org/downloads/) (3.10.7 or higher)
- [Node.js](https://nodejs.org/) (18.16.1 or higher)
- RabbitMQ / Redis

Firstly clone the repo

```bash
git clone https://github.com/Martini310/billwise.git
```

Then install required prerequisites

```bash
pip install -r requirements.txt
```

Migrate data into Database. Default Database is SQLite, if you want to configure another DB set it in settings.py:
```bash
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```
and then:
```bash
python manage.py migrate
```

Locally I use RabbitMQ and Redis on Render. You can change it here:
```bash
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER', 'pyamqp://guest@rabbitmq:5672//')
```

#### Now you can run all needed servers

```bash
python manage.py runserver
```

```bash
cd frontend
npm start
```

```bash
celery -A billwise worker -l info --pool=solo
```

```bash
celery -A billwise beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

```bash
celery -A billwise flower --port=5555   
```

The App is available under [localhost:3000](localhost:3000)

## 🚀Usage

some usage description

### Some images

![dashboard](https://github.com/Martini310/billwise/assets/108935246/2408401e-a045-4c97-bd77-6476fff6549d)
![dashboard2](https://github.com/Martini310/billwise/assets/108935246/cc41c1de-3bcf-4a10-9502-9393d7821f40)
![suppliers](https://github.com/Martini310/billwise/assets/108935246/f28ffd0e-6a2f-4f26-a729-153c41a97064)
![profile](https://github.com/Martini310/billwise/assets/108935246/94490e2b-c23c-493c-aa90-907870fca099)
![login](https://github.com/Martini310/billwise/assets/108935246/633fc1d2-5436-4fde-9d6d-48d3dd0f77c1)


## 🔧Configuration

You can customize Billwise Project by modifying the configuration in `settings.py`. Here are some of the available settings:

- `DEBUG_MODE`: Set to `True` to enable debug mode.
- `DATABASES`: By default Billwise is running locally with sqlite, you can specify another database if needed.
- `ACCESS_TOKEN_LIFETIME`: Set lifetime of the acces token
- `CELERY_BEAT_SCHEDULE`: Set your own scheduled tasks.

## 📒Feature Roadmap

Main features for now:

- :white_check_mark: Payments synchronized with major platforms in Poland (*PGNiG, Enea, Aquanet*)
- :white_check_mark: Yearly summary with monthly chart and year-2-year comparission
- :white_check_mark: Newest/Nearest Payment
- :white_check_mark: Payment Percentage
- :white_check_mark: Month summary with month-2-month comparission
- :white_check_mark: Add own invoices manually
- :white_check_mark: Invoice details in modal window
- :white_check_mark: Background  worker to scheduled data fetching

Plans:

- :soon: Real-time notifications
- :white_check_mark: Autheticate with Google
- :soon: Email notifications
- :soon: Payments directly from app
- :soon: Many more suppliers (*Inea, Orange, Tmobile etc.*)
- :soon: Dark mode

## 👥Contributing

Welcome contributions! Here's how to get started:

- Report issues on my [Issue Tracker](https://github.com/Martini310/billwise/issues).
- Submit pull requests with improvements or bug fixes.

## 📋License

This project is licensed under the [MIT License](LICENSE). See the [LICENSE](LICENSE) file for details.

## 📨Support & Contact

If you encounter any issues or have questions, please send me an  [email](mailto:maritn.brzezinski@wp.eu)

## Changelog

#### **2024-02-11**
*Implemented Google authentication*