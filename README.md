# salsa

Simple, extensible scaffolding.  This is very much a prototype.  Please help make it better.

## Huh?

Expose bowls to bootstrap a project.  Each bowl has all the setup code for a different project layout.

## Configuration

node-salsa is configured via a JSON-formatted .salsarc file located in either the node-salsa/ directory or the user's home directory.  In fact, this file is required to exist and must contain a Github OAuth2 token defined as "auth_token".

The available configuration options are:

* auth_token (required)
* author_name
* author_email
* organization
* team_id
* webhook_url

## Usage

    // create a new browser based module that has a prebuilt mocha harness
    // for running tests.
    $ salsa create browser chip-viewer
