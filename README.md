# OutClimb

This is a general web service for everything OutClimb. (Not including our marketing website.) Originally we had separate services for individual domains, however to save money we wanted to combine them.

## Structure

The backend of this project uses N-Layer architecture that uses three consecutive layers:

- HTTP Layer for handling requests and responses
- App Layer for handling business logic
- Store Layer for handling database transactions

This allows for a separation of concerns throughout the web application making sure only the necessary data is passed through to each layer.

The frontends can be found in the `packages` folder:

- `form` - This will be the frontend for the registration forms.
- `manager` - This is the frontend for the management portal.

## Running locally

Make sure you have Docker installed. Copy the `configs/local.env.sample` to `configs/local.env` and adjust any values as needed.

Add the following entries to your hosts file (`/etc/hosts` on macOS/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows) so the local domains resolve correctly:

```
127.0.0.1 outclimb.local
127.0.0.1 assets.outclimb.local
127.0.0.1 register.outclimb.local
127.0.0.1 donate.outclimb.local
```

Then from the root of the project directory run:

```
docker compose up -d
```

This will start the backend, frontend, and PostgreSQL database. The backend and frontend will automatically rebuild on changes. Once running, the url shortner is available at `http://outclimb.local`, registration at `http://register.outclimb.local`, donations at `http://donate.outclimb.local`, and assets at `http://assets.outclimb.local`. The management portal can be accessed via `/manage` on any domain.

To follow logs:

```
docker compose logs -f
```

To stop everything:

```
docker compose down
```

However you will need an account, which can be created with the following command:

```
docker compose exec be-builder go run ./main.go create-user -u test-user -p password -n Test -r Admin -e foo@example.com
```

## Contributing

### Commit messages

Commits must follow the [Conventional Commits](https://www.conventionalcommits.org) standard. A local Husky `commit-msg` hook and a CI check on pull requests both enforce this.

### Releases

The whole repository shares one version, which is set by the commit messages on `main`. When CI passes on a push to `main`, [semantic-release](https://semantic-release.gitbook.io) tags the version and publishes a GitHub Release with generated notes. The Docker image is tagged with that version as well as `latest`.

- `feat` produces a minor release.
- `fix` and `perf` produce a patch release.
- `!` after the type, or a `BREAKING CHANGE` footer, produces a major release.
- Other types, such as `chore`, `docs` and `ci`, do not produce a release.

Release notes are on the GitHub Releases page.
