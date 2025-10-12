# OutClimb

This is a general web service for everything OutClimb. (Not including our marketing website.) Originally we had separate services for individual domains, however to save money we wanted to combine them.

## Structure

This project user N-Layer architecture that uses three consecutive layers:

- HTTP Layer for handling requests and responses
- App Layer for handling business logic
- Store Layer for handling database transactions

This allows for a seperation of concerns throughout the web application making sure only the necessary data is passed through to each layer.

## Running locally

Make sure you have Go v1.25 or newer installed, then run the following from the root of the project directory to install dependencies:

```
go mod download
```

You will also need PostgreSQL running and configured as well. Copy the `configs/local.env.sample` to `configs/local.env` and fill out the proper information for your local database. With the environment variables all configured on your system you should then be able to run the following to start the service:

```
go run ./cmd/service/main.go
```
