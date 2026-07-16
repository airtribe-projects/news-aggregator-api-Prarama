const tap = require('tap');
const supertest = require('supertest');
const app = require('../src/app');
const server = supertest(app);

const mockUser = {
    name: 'Clark Kent',
    email: 'clark@superman.com',
    password: 'Krypt()n8',
    preferences:['movies', 'comics']
};

let token = '';

// Auth tests

tap.test('POST /register', async (t) => { 
    const User = require('../src/models/user');
    await User.deleteMany({ email: mockUser.email.toLowerCase() });

    const response = await server.post('/register').send(mockUser);
    t.equal(response.status, 200);
    t.end();
});

tap.test('POST /register with missing email', async (t) => {
    const response = await server.post('/register').send({
        name: mockUser.name,
        password: mockUser.password
    });
    t.equal(response.status, 400);
    t.end();
});

tap.test('POST /register with invalid email format', async (t) => {
    const response = await server.post('/register').send({
        name: mockUser.name,
        email: 'invalid-email-format',
        password: mockUser.password
    });
    t.equal(response.status, 400);
    t.end();
});

tap.test('POST /register with short password', async (t) => {
    const response = await server.post('/register').send({
        name: mockUser.name,
        email: mockUser.email,
        password: '123'
    });
    t.equal(response.status, 400);
    t.end();
});

tap.test('POST /login', async (t) => { 
    const response = await server.post('/login').send({
        email: mockUser.email,
        password: mockUser.password
    });
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'token');
    token = response.body.token;
    t.end();
});

tap.test('POST /login with wrong password', async (t) => {
    const response = await server.post('/login').send({
        email: mockUser.email,
        password: 'wrongpassword'
    });
    t.equal(response.status, 401);
    t.end();
});

// Preferences tests

tap.test('GET /preferences', async (t) => {
    const response = await server.get('/preferences').set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'preferences');
    t.same(response.body.preferences, mockUser.preferences);
    t.end();
});

tap.test('GET /preferences without token', async (t) => {
    const response = await server.get('/preferences');
    t.equal(response.status, 401);
    t.end();
});

tap.test('PUT /preferences', async (t) => {
    const response = await server.put('/preferences').set('Authorization', `Bearer ${token}`).send({
        preferences: ['movies', 'comics', 'games']
    });
    t.equal(response.status, 200);
});

tap.test('Check PUT /preferences', async (t) => {
    const response = await server.get('/preferences').set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.same(response.body.preferences, ['movies', 'comics', 'games']);
    t.end();
});


// News tests

tap.test('GET /news', async (t) => {
    const response = await server.get('/news').set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'news');
    t.end();
});

tap.test('GET /news without token', async (t) => {
    const response = await server.get('/news');
    t.equal(response.status, 401);
    t.end();
});



// Read & Favorite news tests (optional features)

const mockArticle = {
    title: 'Test Article Title',
    description: 'This is a test article.',
    url: 'https://example.com/test-article',
    source: 'Test Source',
    publishedAt: '2026-07-16T10:00:00Z',
    image: 'https://example.com/image.jpg'
};

tap.test('POST /news/read', async (t) => {
    const response = await server.post('/news/read').set('Authorization', `Bearer ${token}`).send(mockArticle);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'readArticles');
    t.end();
});

tap.test('GET /news/read', async (t) => {
    const response = await server.get('/news/read').set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'read');
    t.same(response.body.read[0].url, mockArticle.url);
    t.end();
});

tap.test('POST /news/favorites', async (t) => {
    const response = await server.post('/news/favorites').set('Authorization', `Bearer ${token}`).send(mockArticle);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'favoriteArticles');
    t.end();
});

tap.test('GET /news/favorites', async (t) => {
    const response = await server.get('/news/favorites').set('Authorization', `Bearer ${token}`);
    t.equal(response.status, 200);
    t.hasOwnProp(response.body, 'favorites');
    t.same(response.body.favorites[0].url, mockArticle.url);
    t.end();
});

tap.teardown(() => {
    process.exit(0);
});