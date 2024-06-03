### Usage

1. **Register**: Send a POST request to `/register` with a JSON body containing `username` and `password`.
2. **Login**: Send a POST request to `/login` with a JSON body containing `username` and `password`. You will receive a JWT token.
3. **Create Item**: Send a POST request to `/items` with the JWT token in the `Authorization` header and a JSON body containing `name` and `description`.
4. **List Items**: Send a GET request to `/items` with the JWT token in the `Authorization` header.

By following these steps, you can set up an Express server with SQLite for user authentication and basic CRUD operations.
