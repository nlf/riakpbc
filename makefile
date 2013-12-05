MOCHA?=node_modules/.bin/mocha
REPORTER?=list
GROWL?=--growl
FLAGS=$(GROWL) --reporter $(REPORTER) --colors

test:
	$(MOCHA) $(shell find test -name "*-test.js") $(FLAGS)

one:
	$(MOCHA) $(NAME) $(FLAGS)

unit:
	$(MOCHA) $(shell find test/unit -name "*-test.js") $(FLAGS)

integration:
	$(MOCHA) $(shell find test/integration -name "*-test.js") $(FLAGS)

.PHONY: test
