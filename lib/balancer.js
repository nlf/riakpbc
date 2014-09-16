function Balancer(options) {

    this.auth = options.auth;
    this.connect_timeout = options.connect_timeout;
    this.parse_values = options.parse_values;
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
        connect_timeout: this.connect_timeout,
        parse_values: this.parse_values,
        auth: this.auth
    };
};

module.exports = Balancer;
