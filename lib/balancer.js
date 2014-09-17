function Balancer(options) {

    this.auth = options.auth;
    this.connectTimeout = options.connectTimeout;
    this.parseValues = options.parseValues;
    this.nodes = options.nodes;
    this.index = -1;
}

Balancer.prototype.next = function () {

    ++this.index;
    if (this.index >= this.nodes.length) {
        this.index = 0;
    }

    return {
        host: this.nodes[this.index].host,
        port: this.nodes[this.index].port,
        connectTimeout: this.connectTimeout,
        parseValues: this.parseValues,
        auth: this.auth
    };
};

module.exports = Balancer;
