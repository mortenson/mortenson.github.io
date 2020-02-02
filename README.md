![Build and deploy site](https://github.com/mortenson/mortenson.github.io/workflows/Build%20and%20deploy%20site/badge.svg)

# mortenson.github.io site

This is my personal homepage, built with Drupal and Tome!

# Requirements

- PHP 7+
- [Composer](https://getcomposer.org/)
- [Drush](https://github.com/drush-ops/drush-launcher#installation---phar)
- SQLite and the related PHP extensions

## Usage

To re-install Tome, run:

```bash
drush tome:install
```

To start a local webserver, run:

```bash
drush runserver
```

To build the static site, run:

```bash
drush tome:static
```
