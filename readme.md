# BillWise

Billwise is my first fullstack project in Django Rest Framework, NextJS and Celery. 

## Try it

### Live
Billwise is deployed on Render. You can see the App in action [here](https://bill-wise.onrender.com).<br>
**IMPORTANT**<br>
This is only the free tier so it have some serious limitations:<br>
* after 15 minutes of idle servers fall asleep
* wake up can take up to a few minutes so **be patient**
* celery worker is deployed as a normal web-server not as a background worker so it need to be restarted manually every time


### Docker
Much better option is to run the app locally using Docker. There are ready to use Dockerfiles and docker-compose. You only need to clone the repository and run docker compose.
```bash
git clone https://github.com/Martini310/billwise.git
```
And run the container
```bash
docker-compose up
```

### Run locally
If you want to run all the services manually it is also easy but require a little more work.
Firstly clone the repo

```bash
git clone https://github.com/Martini310/billwise.git
```
Then install required prerequisites
```bash
pip install -r requirements.txt
```
Migrate data into Database
```bash
python manage.py migrate
```
Now you can run all needed servers
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


## Features
Main features for now:
- Payments synchronized with major platforms in Poland (*PGNiG, Enea, Aquanet*)
- Yearly summary with monthly chart and y2y comparission
- Newest/Nearest Payment
- Payment Percentage
- Month summary with m2m comparission
- Add own invoices manually
- and many small details that required a lot of work and education
- background  worker to scheduled refresh data

Plans:
- Login with Facebook or Google
- Email notifications
- Payments directly from app
- Many more suppliers (*Inea, Orange, Tmobile etc.*)
- Dark mode


### Some images
![dashboard](https://github.com/Martini310/billwise/assets/108935246/2408401e-a045-4c97-bd77-6476fff6549d)
![dashboard2](https://github.com/Martini310/billwise/assets/108935246/cc41c1de-3bcf-4a10-9502-9393d7821f40)
![suppliers](https://github.com/Martini310/billwise/assets/108935246/f28ffd0e-6a2f-4f26-a729-153c41a97064)
![profile](https://github.com/Martini310/billwise/assets/108935246/94490e2b-c23c-493c-aa90-907870fca099)
![login](https://github.com/Martini310/billwise/assets/108935246/633fc1d2-5436-4fde-9d6d-48d3dd0f77c1)
