test: dt-setup
	@node node_modules/lab/bin/lab

test-cov: dt-setup
	@node node_modules/lab/bin/lab -t 99.57

test-cov-html: dt-setup
	@node node_modules/lab/bin/lab -r html -o coverage.html

dt-setup:
	ifeq ($(TEST_ENV),travis)
		@sudo riak-admin bucket-type create _test_crdt_counter '{"props":{"datatype":"counter","allow_mult":true}}' > /dev/null || true
		@sudo riak-admin bucket-type create _test_crdt_map '{"props":{"datatype":"map","allow_mult":true}}' > /dev/null || true
		@sudo riak-admin bucket-type create _test_crdt_set '{"props":{"datatype":"set","allow_mult":true}}' > /dev/null || true
		@sudo riak-admin bucket-type activate _test_crdt_counter > /dev/null || true
		@sudo riak-admin bucket-type activate _test_crdt_map > /dev/null || true
		@sudo riak-admin bucket-type activate _test_crdt_set > /dev/null || true
	else
		@riak-admin bucket-type create _test_crdt_counter '{"props":{"datatype":"counter","allow_mult":true}}' > /dev/null || true
		@riak-admin bucket-type create _test_crdt_map '{"props":{"datatype":"map","allow_mult":true}}' > /dev/null || true
		@riak-admin bucket-type create _test_crdt_set '{"props":{"datatype":"set","allow_mult":true}}' > /dev/null || true
		@riak-admin bucket-type activate _test_crdt_counter > /dev/null || true
		@riak-admin bucket-type activate _test_crdt_map > /dev/null || true
		@riak-admin bucket-type activate _test_crdt_set > /dev/null || true
	endif

enable-security:
	ifeq ($(TEST_ENV),travis)
		@sudo riak-admin security enable > /dev/null || true
		@sudo riak-admin security add-user riak password=testing > /dev/null || true
		@sudo riak-admin security add-grant riak_kv.put,riak_kv.get,riak_kv.del on any to riak > /dev/null || true
		@sudo riak-admin security add-source riak 127.0.0.1/32 password > /dev/null || true
	else
		@riak-admin security enable > /dev/null || true
		@riak-admin security add-user riak password=testing > /dev/null || true
		@riak-admin security add-grant riak_kv.put,riak_kv.get,riak_kv.del on any to riak > /dev/null || true
		@riak-admin security add-source riak 127.0.0.1/32 password > /dev/null || true
	endif

disable-security:
	ifeq ($(TEST_ENV),travis)
		@sudo riak-admin security disable > /dev/null || true
	else
		@riak-admin security disable > /dev/null || true
	endif

.PHONY: test test-cov test-cov-html dt-setup enable-security disable-security
