name: Deploy Django + Vite (Production)

on:
  push:
    branches:
      - firstchange

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_IP }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            set -e

            echo "🚀 Pulling latest code"
            cd /var/www/KUTOM-CRM
            git pull origin firstchange

            echo "🐍 Backend: Django deploy"
            cd backend
            source venv/bin/activate
            pip install -r requirements.txt
            python manage.py migrate --noinput
            python manage.py collectstatic --noinput
            sudo systemctl restart gunicorn

            echo "⚛️ Frontend: Vite build"
            cd ../client
            npm install
            npm run build

            echo "🌐 Reload Nginx"
            sudo systemctl reload nginx

            echo "✅ DEPLOYMENT SUCCESSFUL"
