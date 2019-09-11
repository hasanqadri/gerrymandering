import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Route | gerrymandering', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:gerrymandering');
    assert.ok(route);
  });
});
