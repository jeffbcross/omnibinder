var protractor = require('protractor'),
    tractor = protractor.getInstance();

describe('TestApp', function () {
  beforeEach(function () {
    browser.driver.get('http://localhost:8080');
  });



  it('should update the UI shortly after writing directly to localStorage', function () {
    browser.driver.findElements(protractor.By.css('ul#itemsList li')).then(function (list) {
      expect(list.length).toBe(0);
    });

    var keyInput = browser.driver.findElement(protractor.By.css('#localStorageKey'));
    var valInput = browser.driver.findElement(protractor.By.css('#localStorageValue'));

    keyInput.click();
    keyInput.sendKeys('updateTest');

    valInput.click();
    valInput.sendKeys(JSON.stringify({items: [{id: '1'}]}));

    var btn = browser.driver.findElement(protractor.By.css('#localStorageSave'));
    btn.click();

    tractor.sleep(100);

    browser.driver.findElements(protractor.By.css('ul#itemsList li')).then(function (list) {
      expect(list.length).toBe(1);
    });
  });
});
