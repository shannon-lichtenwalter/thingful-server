const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Protected Endpoints', function () {
  let db;

  const {
    testThings,
    testUsers,
  } = helpers.makeThingsFixtures();

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('cleanup', () => helpers.cleanTables(db));

  afterEach('cleanup', () => helpers.cleanTables(db));

  beforeEach('insert things', () =>
    helpers.seedThingsTables(
      db,
      testUsers,
      testThings
    ));

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:thing_id',
      path: '/api/things/1',
      method: supertest(app).get
    },
    {
      name: 'GET /api/things/:thing_id/reviews',
      path: '/api/things/1/reviews',
      method: supertest(app).get
    },
    {
      name: 'POST /api/reviews',
      path: '/api/reviews',
      method: supertest(app).post
    }

  ];
  protectedEndpoints.forEach(endpoint => {
    describe(endpoint.name, () => {
      it('responds with 401 \'Missing basic token\' when no basic token', () => {
        return endpoint.method(endpoint.path)
          .expect(401, { error: 'Missing bearer token' });
      });
      it('responds 401 \'Unauthorized Request\' when no invalid JWT secret', () => {
        const validUser = testUsers[0];
        const invalidSecret = 'bad-secret';

        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(validUser, invalidSecret))
          .expect(401, { error: 'Unauthorized Request' });
      });
      it('responds 401 Unauthorized Request when invalid sub in payload', () => {
        const invalidUser = { user_name: 'user-not-existy', id:1 };
        return endpoint.method(endpoint.path)
          .set('Authorization', helpers.makeAuthHeader(invalidUser))
          .expect(401, { error: 'Unauthorized Request' });
      });

    });
  });

});