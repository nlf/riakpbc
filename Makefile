test: dt-setup
	@node node_modules/lab/bin/lab

test-cov: dt-setup
	@node node_modules/lab/bin/lab -t 99.57

test-cov-html: dt-setup
	@node node_modules/lab/bin/lab -r html -o coverage.html

dt-setup:
	@riak-admin bucket-type create _test_crdt_counter '{"props":{"datatype":"counter","allow_mult":true}}' > /dev/null || true
	@riak-admin bucket-type create _test_crdt_map '{"props":{"datatype":"map","allow_mult":true}}' > /dev/null || true
	@riak-admin bucket-type create _test_crdt_set '{"props":{"datatype":"set","allow_mult":true}}' > /dev/null || true
	@riak-admin bucket-type activate _test_crdt_counter > /dev/null || true
	@riak-admin bucket-type activate _test_crdt_map > /dev/null || true
	@riak-admin bucket-type activate _test_crdt_set > /dev/null || true

.PHONY: test test-cov test-cov-html dt-setup
