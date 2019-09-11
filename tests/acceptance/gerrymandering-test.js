import { module, test } from 'qunit';
import { visit, currentURL } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | gerrymandering', function(hooks) {
  setupApplicationTest(hooks);

  test('visiting /gerrymandering', async function(assert) {
    await visit('/gerrymandering');

    assert.equal(currentURL(), '/gerrymandering');
  });
});
