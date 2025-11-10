import requests

BACKEND = "http://localhost:8000"
EMAIL = "bodeguero_e2e@example.com"
USERNAME = "bodeguero_e2e"
PASSWORD = "S3lenium!"

def main():
    try:
        resp = requests.post(
            BACKEND + "/api/auth/register/",
            json={
                "username": USERNAME,
                "email": EMAIL,
                "password": PASSWORD,
                "first_name": "Bodeguero",
                "last_name": "E2E",
            },
            timeout=5,
        )
        print("status:", resp.status_code)
        print("body:", resp.text[:200])
    except Exception as e:
        print("error:", e)

if __name__ == "__main__":
    main()

