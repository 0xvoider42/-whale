### Welcome to the @whale price fetching project
### This is the API/DB part you can find FE [here](https://github.com/0xvoider42/-whale-FE/edit/)

## How to?
- clone the repo
- run `yarn` this should install the necessary dependencies
- run `docker compose up --build` this will start the API with the database
- run `yarn migration:run` this will run the migration for the DB
- the API is ready to accept requests

### Endpoints
- `GET (historical)` Example URL: http://localhost:3000/crypto-price/historical?pair=TON_USDT&startDate=2024-03-17&endDate=2024-12-18
 #### historical endpoint will return prices from the database, these prices are the ones you have requested before.
- `GET (:pair)` Example URL: http://localhost:3000/crypto-price/TON_USDT

#### Notes
cors is set to accept all `*` for the speed of setup
