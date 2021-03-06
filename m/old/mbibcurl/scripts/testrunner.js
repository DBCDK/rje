    describe('test environment', function() {
        it('should have a bibdk username/password', function() {
            expect(typeof bibdkUser).toBe('string');
            expect(typeof bibdkPassword).toBe('string');
        });
    });

define(['require', 'exports', 'bibdk.spec'], function(require, exports) {
    jasmine.getEnv().addReporter(new jasmine.TrivialReporter());
    jasmine.getEnv().execute();
});
