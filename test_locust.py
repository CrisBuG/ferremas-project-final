from locust import HttpUser, task, between


class WebsiteUser(HttpUser):
    wait_time = between(1, 3)

    @task(3)
    def view_homepage(self):
        self.client.get("/")

    @task(1)
    def view_about(self):
        self.client.get("/about")

    @task(3)
    def view_api(self):
        # Probar un endpoint conocido del backend
        self.client.get("/api/auth/csrf/")

    def on_start(self):
        # Intento de login genérico de ejemplo
        with self.client.post(
            "/index2.html",
            data={"username": "student", "password": "test"},
            catch_response=True,
        ) as response:
            if response.status_code in (200, 405):
                response.success()
            else:
                response.failure("Login failed")

