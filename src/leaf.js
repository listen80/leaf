~ function() {
    function leaf(tpl, id) {
        tpl += ''
        var el;
        if (cache[tpl]) {
            return cache[tpl];
        } else if (el = document.getElementById(tpl)) {
            id = id || tpl;
            tpl = el.innerHTML;
        }
        return cache[id] = build(tpl);
    };

    var cache = {};

    function build(tpl) {
        var func = compile(tpl);
        return function(data) {
            return func.call(leaf, data);
        }
    };

    function toString(value) {
        if (value === undefined) {
            value = '';
        } else {
            value += '';
        }

        return value;
    };

    var xss = {
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "&": "&#38;"
    };

    function escape(value) {
        return toString(value).replace(/&(?![\w#]+;)|[<>"']/g, function(s) {
            return xss[s];
        })
    };

    function ArrayLike(obj) {
        return obj && typeof obj.length === 'number';
    };

    function forEach(data, callback) {
        var i, len, count = 0;
        if (ArrayLike(data)) {
            for (i = 0, len = data.length; i < len; i++) {
                callback.call(data, data[i], i, i);
            }
        } else {
            for (i in data) {
                if (data.hasOwnProperty(i)) {
                    callback.call(data, data[i], i, count);
                    count++;
                }
            }
        }
    };
    
    leaf.$e = escape;
    leaf.$f = forEach;
    leaf.$s = toString;

    function compile(source) {
        var code = "'use strict';var $t=this,$e=$t.$e,$f=$t.$f,$s=$t.$s,$o='';";
        var codes = source.split(/\{|\}/);

        function echo(code) {
            return "$o+=" + code + ";"
        }

        function stringify(code) {
            return "'" + code.replace(/('|\\)/g, '\\$1').replace(/\r/g, '\\r').replace(/\n/g, '\\n') + "'";
        }

        function logic(code) {
            var split = code.replace(/^\s+|\s+$/, '').split(/\s+/);
            var key = split.shift();
            switch (key) {

                case 'if':
                    code = 'if(' + split.join(' ') + '){';
                    break;

                case 'else':
                    code = '}else{';
                    break;

                case 'elif':
                case 'elseif':
                    code = '}else if(' + split.join(' ') + '){';
                    break;

                case '/if':
                    code = '};';
                    break;

                case 'for':
                    split[0] = split[0] || '$d';
                    split[1] = split[1] || '$v';
                    split[2] = split[2] || '$k';
                    code = '$f(' + split.shift() + ',function(' + split.join() + '){';
                    break;

                case '/for':
                    code = '});';
                    break;

                case 'eval':
                    code = code + ';';
                    break;

                case 'escape':
                    code = echo("$e(" + code + ")");
                    break;

                case 'include':
                    code = echo("$t(" + split[0] + ")(" + split[1] + ")");
                    break;

                default:
                    code = echo("$s(" + code + ")");
                    break;
            }
            return code;
        }

        for (var i = 0, len = codes.length; i < len; i++) {
            i % 2 === 0 ? code += echo(stringify(codes[i])) : code += logic(codes[i]);
        }

        code += "return $o;"

        return new Function("$d", code);;
    }

    if (typeof module === 'object') {
        module.exports = leaf;
    } else {
        this.leaf = leaf;
    }
}();