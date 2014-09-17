ifeq ($(TEST_ENV),travis)
	command := sudo
	param := riak-admin
else
	command := riak-admin
	param :=
endif

test: dt-setup
	@node node_modules/lab/bin/lab

test-cov: dt-setup
	@node node_modules/lab/bin/lab -t 99.57

test-cov-html: dt-setup
	@node node_modules/lab/bin/lab -r html -o coverage.html

dt-setup:
	@$(command) $(param) bucket-type create _test_crdt_counter '{"props":{"datatype":"counter","allow_mult":true}}' > /dev/null || true
	@$(command) $(param) bucket-type create _test_crdt_map '{"props":{"datatype":"map","allow_mult":true}}' > /dev/null || true
	@$(command) $(param) bucket-type create _test_crdt_set '{"props":{"datatype":"set","allow_mult":true}}' > /dev/null || true
	@$(command) $(param) bucket-type activate _test_crdt_counter > /dev/null || true
	@$(command) $(param) bucket-type activate _test_crdt_map > /dev/null || true
	@$(command) $(param) bucket-type activate _test_crdt_set > /dev/null || true

enable-security:
	@$(command) $(param) security enable > /dev/null || true
	@$(command) $(param) security add-user riak password=testing > /dev/null || true
	@$(command) $(param) security add-grant riak_kv.put,riak_kv.get,riak_kv.del on any to riak > /dev/null || true
	@$(command) $(param) security add-source riak 127.0.0.1/32 password > /dev/null || true

disable-security:
	@$(command) $(param) security disable > /dev/null || true

.PHONY: test test-cov test-cov-html dt-setup enable-security disable-security
