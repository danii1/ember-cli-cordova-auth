/* globals match, localStorage */

import simpleModule from '../helpers/simple-module';
import stubRequest from '../helpers/stub-request';
import { test } from 'ember-qunit';
import config from '../../config/environment';

var session;
simpleModule('Initializers/CordovaAuth/SignIn', function(app, _session){
  session = _session;
}, function() {
  session.signOut();
});

test('exists', function() {
  ok(session);
});

test('signInUrl is configured in config', function() {
  equal(session.signInUrl(), config.signInUrl);
});

test('sessionLocalStorageKey can be configured in config', function() {
  config.sessionLocalStorageKey = 'test-localstorage';
  var lsKey = session.localStorageKey();

  equal(lsKey, config.sessionLocalStorageKey);
});

test('successful sign in - sets isSignedIn to true', function() {
  expect(1);
  stubRequest('/sessions', {
    user: {
      email: 'example@example.com',
      access_token: '1234'
    }
  });

  return session.signIn({email: 'example@example.com', password: 'password'}).then(function(res) {
    equal(session.get('isSignedIn'), true);
  });
});

test('successful sign in - sets properties on the session and localstorage', function() {
  expect(6);
  var properties = {
    user: {
      email: 'example@example.com',
      access_token: '1234',
      first_name: 'Jane',
      last_name: 'Doe',
      id: 1
    }
  };
  var user = properties.user;
  stubRequest('/sessions', properties);

  return session.signIn({email: 'example@example.com', password: 'password'}).then(function() {
    equal(session.get('email'), user.email);
    equal(session.get('access_token'), user.access_token);
    equal(session.get('first_name'), user.first_name);
    equal(session.get('last_name'), user.last_name);
    equal(session.get('id'), user.id);

    var lsKey = session.localStorageKey();
    deepEqual(JSON.parse(localStorage.getItem(lsKey)), properties);
  });
});

test('successful sign in - requires an access_token in the response', function() {
  expect(1);
  stubRequest('/sessions', {
    user: {
      email: 'example@example.com'
    }
  });

  return session.signIn({email: 'example@example.com', password: 'password'}).then(function() {
    ok(false, 'Should not hit here');
  }, function(err) {
    match('An access_token must', err);
  });
});

test('successful sign in - signOut() resets values', function() {
  expect(4);
  stubRequest('/sessions', {
    user: {
      email: 'example@example.com',
      access_token: '1234',
    }
  });

  return session.signIn({email: 'example@example.com', password: 'password'}).then(function() {
    session.signOut();
    equal(session.get('email'), null);
    equal(session.get('access_token'), null);
    equal(session.get('isSignedIn'), false);

    var lsKey = session.localStorageKey();
    equal(localStorage.getItem(lsKey), null);
  });
});

test('successful sign in - setPrefilter is called', function() {
  expect(1);
  stubRequest('/sessions', {
    user: {
      email: 'example@example.com',
      access_token: '1234'
    }
  });

  var _setPrefilter = session.setPrefilter;
  session.setPrefilter = function() {
    var addedPrefilter = _setPrefilter.apply(this, arguments);
    equal(addedPrefilter, true);
  };

  return session.signIn({email: 'example@example.com', password: 'password'});
});

test('failed sign in - sets isSignedIn to false', function() {
  expect(1);
  stubRequest('/sessions', {}, { status: 400 });

  return session.signIn({email: 'example@example.com', password: 'password'})
    .then(function() {}, function() {
      equal(session.get('isSignedIn'), false);
    });
});

